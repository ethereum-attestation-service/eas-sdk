"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAS = exports.RequireProxy = void 0;
const tslib_1 = require("tslib");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
const semver_1 = tslib_1.__importDefault(require("semver"));
const typechain_1 = require("./legacy/typechain");
const version_1 = require("./legacy/version");
const offchain_1 = require("./offchain");
const request_1 = require("./request");
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
const LEGACY_VERSION = '1.1.0';
tslib_1.__exportStar(require("./request"), exports);
const RequireProxy = (_target, _propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor.value = function (...args) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.proxy) {
            throw new Error('Invalid proxy');
        }
        return originalMethod.apply(this, args);
    };
    return descriptor;
};
exports.RequireProxy = RequireProxy;
class EAS extends transaction_1.Base {
    proxy;
    delegated;
    offchain;
    version;
    legacyEAS;
    constructor(address, options) {
        const { signer, proxy } = options || {};
        super(new eas_contracts_1.EAS__factory(), address, signer);
        // Check for ethers v6 compatibility
        if (!this.contract.getAddress) {
            throw new Error('Incompatible ethers version detect. Make sure to use the SDK with ethers v6 or later');
        }
        this.signer = signer;
        if (proxy) {
            this.proxy = proxy;
        }
        this.legacyEAS = new transaction_1.Base(new typechain_1.EAS__factory(), address, signer);
    }
    // Connects the API to a specific signer
    connect(signer) {
        delete this.delegated;
        delete this.offchain;
        super.connect(signer);
        if (this.legacyEAS) {
            this.legacyEAS.connect(signer);
        }
        return this;
    }
    // Returns the version of the contract
    async getVersion() {
        if (this.version) {
            return this.version;
        }
        return (this.version = (await (0, version_1.legacyVersion)(this.contract)) ?? (await this.contract.version()));
    }
    // Returns an existing schema by attestation UID
    getAttestation(uid) {
        return this.contract.getAttestation(uid);
    }
    // Returns whether an attestation is valid
    isAttestationValid(uid) {
        return this.contract.isAttestationValid(uid);
    }
    // Returns whether an attestation has been revoked
    async isAttestationRevoked(uid) {
        const attestation = await this.contract.getAttestation(uid);
        if (attestation.uid === utils_1.ZERO_BYTES32) {
            throw new Error('Invalid attestation');
        }
        return attestation.revocationTime != request_1.NO_EXPIRATION;
    }
    // Returns the timestamp that the specified data was timestamped with
    getTimestamp(data) {
        return this.contract.getTimestamp(data);
    }
    // Returns the timestamp that the specified data was timestamped with
    getRevocationOffchain(user, uid) {
        return this.contract.getRevokeOffchain(user, uid);
    }
    // Returns the EIP712 proxy
    getEIP712Proxy() {
        return this.proxy;
    }
    // Returns the delegated attestations helper
    getDelegated() {
        if (this.delegated) {
            return this.delegated;
        }
        return this.setDelegated();
    }
    // Returns the offchain attestations helper
    getOffchain() {
        if (this.offchain) {
            return this.offchain;
        }
        return this.setOffchain();
    }
    // Attests to a specific schema
    async attest({ schema, data: { recipient = utils_1.ZERO_ADDRESS, data, expirationTime = request_1.NO_EXPIRATION, revocable = true, refUID = utils_1.ZERO_BYTES32, value = 0n } }, overrides) {
        return new transaction_1.Transaction(await this.contract.attest.populateTransaction({ schema, data: { recipient, expirationTime, revocable, refUID, data, value } }, { value, ...overrides }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt)[0]);
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ schema, data: { recipient = utils_1.ZERO_ADDRESS, data, expirationTime = request_1.NO_EXPIRATION, revocable = true, refUID = utils_1.ZERO_BYTES32, value = 0n }, signature, attester, deadline = request_1.NO_EXPIRATION }, overrides) {
        let tx;
        if (await this.isLegacyContract()) {
            tx = await this.legacyEAS.contract.attestByDelegation.populateTransaction({
                schema,
                data: {
                    recipient,
                    expirationTime,
                    revocable,
                    refUID,
                    data,
                    value
                },
                signature,
                attester
            }, { value, ...overrides });
        }
        else {
            tx = await this.contract.attestByDelegation.populateTransaction({
                schema,
                data: {
                    recipient,
                    expirationTime,
                    revocable,
                    refUID,
                    data,
                    value
                },
                signature,
                attester,
                deadline
            }, { value, ...overrides });
        }
        return new transaction_1.Transaction(tx, this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt)[0]);
    }
    // Multi-attests to multiple schemas
    async multiAttest(requests, overrides) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient ?? utils_1.ZERO_ADDRESS,
                expirationTime: d.expirationTime ?? request_1.NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUID: d.refUID ?? utils_1.ZERO_BYTES32,
                data: d.data ?? utils_1.ZERO_BYTES32,
                value: d.value ?? 0n
            }))
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res + r.value, 0n);
            return res + total;
        }, 0n);
        return new transaction_1.Transaction(await this.contract.multiAttest.populateTransaction(multiAttestationRequests, {
            value: requestedValue,
            ...overrides
        }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt));
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests
    async multiAttestByDelegation(requests, overrides) {
        let tx;
        if (await this.isLegacyContract()) {
            const multiAttestationRequests = requests.map((r) => ({
                schema: r.schema,
                data: r.data.map((d) => ({
                    recipient: d.recipient ?? utils_1.ZERO_ADDRESS,
                    expirationTime: d.expirationTime ?? request_1.NO_EXPIRATION,
                    revocable: d.revocable ?? true,
                    refUID: d.refUID ?? utils_1.ZERO_BYTES32,
                    data: d.data ?? utils_1.ZERO_BYTES32,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                attester: r.attester,
                deadline: r.deadline ?? request_1.NO_EXPIRATION
            }));
            const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
                const total = data.reduce((res, r) => res + r.value, 0n);
                return res + total;
            }, 0n);
            tx = await this.legacyEAS.contract.multiAttestByDelegation.populateTransaction(multiAttestationRequests, {
                value: requestedValue,
                ...overrides
            });
        }
        else {
            const multiAttestationRequests = requests.map((r) => ({
                schema: r.schema,
                data: r.data.map((d) => ({
                    recipient: d.recipient ?? utils_1.ZERO_ADDRESS,
                    expirationTime: d.expirationTime ?? request_1.NO_EXPIRATION,
                    revocable: d.revocable ?? true,
                    refUID: d.refUID ?? utils_1.ZERO_BYTES32,
                    data: d.data ?? utils_1.ZERO_BYTES32,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                attester: r.attester,
                deadline: r.deadline ?? request_1.NO_EXPIRATION
            }));
            const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
                const total = data.reduce((res, r) => res + r.value, 0n);
                return res + total;
            }, 0n);
            tx = await this.contract.multiAttestByDelegation.populateTransaction(multiAttestationRequests, {
                value: requestedValue,
                ...overrides
            });
        }
        return new transaction_1.Transaction(tx, this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt));
    }
    // Revokes an existing attestation
    async revoke({ schema, data: { uid, value = 0n } }, overrides) {
        return new transaction_1.Transaction(await this.contract.revoke.populateTransaction({ schema, data: { uid, value } }, { value, ...overrides }), this.signer, async () => { });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ schema, data: { uid, value = 0n }, signature, revoker, deadline = request_1.NO_EXPIRATION }, overrides) {
        let tx;
        if (await this.isLegacyContract()) {
            tx = await this.legacyEAS.contract.revokeByDelegation.populateTransaction({
                schema,
                data: {
                    uid,
                    value
                },
                signature,
                revoker
            }, { value, ...overrides });
        }
        else {
            tx = await this.contract.revokeByDelegation.populateTransaction({
                schema,
                data: {
                    uid,
                    value
                },
                signature,
                revoker,
                deadline
            }, { value, ...overrides });
        }
        return new transaction_1.Transaction(tx, this.signer, async () => { });
    }
    // Multi-revokes multiple attestations
    async multiRevoke(requests, overrides) {
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uid: d.uid,
                value: d.value ?? 0n
            }))
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res + r.value, 0n);
            return res + total;
        }, 0n);
        return new transaction_1.Transaction(await this.contract.multiRevoke.populateTransaction(multiRevocationRequests, {
            value: requestedValue,
            ...overrides
        }), this.signer, async () => { });
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests
    async multiRevokeByDelegation(requests, overrides) {
        let tx;
        if (await this.isLegacyContract()) {
            const multiRevocationRequests = requests.map((r) => ({
                schema: r.schema,
                data: r.data.map((d) => ({
                    uid: d.uid,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                revoker: r.revoker
            }));
            const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
                const total = data.reduce((res, r) => res + r.value, 0n);
                return res + total;
            }, 0n);
            tx = await this.legacyEAS.contract.multiRevokeByDelegation.populateTransaction(multiRevocationRequests, {
                value: requestedValue,
                ...overrides
            });
        }
        else {
            const multiRevocationRequests = requests.map((r) => ({
                schema: r.schema,
                data: r.data.map((d) => ({
                    uid: d.uid,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                revoker: r.revoker,
                deadline: r.deadline ?? request_1.NO_EXPIRATION
            }));
            const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
                const total = data.reduce((res, r) => res + r.value, 0n);
                return res + total;
            }, 0n);
            tx = await this.contract.multiRevokeByDelegation.populateTransaction(multiRevocationRequests, {
                value: requestedValue,
                ...overrides
            });
        }
        return new transaction_1.Transaction(tx, this.signer, async () => { });
    }
    // Attests to a specific schema via an EIP712 delegation request using an external EIP712 proxy
    attestByDelegationProxy(request, overrides) {
        return this.proxy.attestByDelegationProxy(request, overrides);
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
    multiAttestByDelegationProxy(requests, overrides) {
        return this.proxy.multiAttestByDelegationProxy(requests, overrides);
    }
    // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
    revokeByDelegationProxy(request, overrides) {
        return this.proxy.revokeByDelegationProxy(request, overrides);
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests using an external EIP712 proxy
    multiRevokeByDelegationProxy(requests, overrides) {
        return this.proxy.multiRevokeByDelegationProxy(requests, overrides);
    }
    // Timestamps the specified bytes32 data
    async timestamp(data, overrides) {
        return new transaction_1.Transaction(await this.contract.timestamp.populateTransaction(data, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getTimestampFromTimestampReceipt)(receipt)[0]);
    }
    // Timestamps the specified multiple bytes32 data
    async multiTimestamp(data, overrides) {
        return new transaction_1.Transaction(await this.contract.multiTimestamp.populateTransaction(data, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getTimestampFromTimestampReceipt)(receipt));
    }
    // Revokes the specified offchain attestation UID
    async revokeOffchain(uid, overrides) {
        return new transaction_1.Transaction(await this.contract.revokeOffchain.populateTransaction(uid, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getTimestampFromOffchainRevocationReceipt)(receipt)[0]);
    }
    // Revokes the specified multiple offchain attestation UIDs
    async multiRevokeOffchain(uids, overrides) {
        return new transaction_1.Transaction(await this.contract.multiRevokeOffchain.populateTransaction(uids, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => (0, utils_1.getTimestampFromOffchainRevocationReceipt)(receipt));
    }
    // Returns the domain separator used in the encoding of the signatures for attest, and revoke
    getDomainSeparator() {
        return this.contract.getDomainSeparator();
    }
    // Returns the current nonce per-account.
    getNonce(address) {
        return this.contract.getNonce(address);
    }
    // Returns the EIP712 type hash for the attest function
    getAttestTypeHash() {
        return this.contract.getAttestTypeHash();
    }
    // Returns the EIP712 type hash for the revoke function
    getRevokeTypeHash() {
        return this.contract.getRevokeTypeHash();
    }
    // Return attestation UID
    static getAttestationUID = (schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump) => (0, ethers_1.solidityPackedKeccak256)(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [(0, ethers_1.hexlify)((0, ethers_1.toUtf8Bytes)(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]);
    // Sets the delegated attestations helper
    async setDelegated() {
        this.delegated = new offchain_1.Delegated({
            address: await this.contract.getAddress(),
            domainSeparator: await this.getDomainSeparator(),
            chainId: await this.getChainId()
        }, this);
        return this.delegated;
    }
    // Sets the offchain attestations helper
    async setOffchain() {
        this.offchain = new offchain_1.Offchain({
            address: await this.contract.getAddress(),
            version: await this.getVersion(),
            chainId: await this.getChainId()
        }, offchain_1.OffchainAttestationVersion.Version2, this);
        return this.offchain;
    }
    async isLegacyContract() {
        const version = await this.getVersion();
        const fullVersion = semver_1.default.coerce(version);
        if (!fullVersion) {
            throw new Error(`Invalid version: ${version}`);
        }
        return semver_1.default.lte(fullVersion, LEGACY_VERSION);
    }
}
exports.EAS = EAS;
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "attest", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "attestByDelegation", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiAttest", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiAttestByDelegation", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "revoke", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "revokeByDelegation", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiRevoke", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeByDelegation", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    exports.RequireProxy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "attestByDelegationProxy", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    exports.RequireProxy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiAttestByDelegationProxy", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    exports.RequireProxy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "revokeByDelegationProxy", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    exports.RequireProxy,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeByDelegationProxy", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "timestamp", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiTimestamp", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "revokeOffchain", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeOffchain", null);
//# sourceMappingURL=eas.js.map