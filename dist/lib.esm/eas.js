import { __decorate, __metadata } from "tslib";
import { EAS__factory as EASFactory } from '@ethereum-attestation-service/eas-contracts';
import { hexlify, solidityPackedKeccak256, toUtf8Bytes } from 'ethers';
import semver from 'semver';
import { EAS__factory as EASLegacyFactory } from './legacy/typechain/index.js';
import { legacyVersion } from './legacy/version.js';
import { Delegated, Offchain, OffchainAttestationVersion } from './offchain/index.js';
import { NO_EXPIRATION } from './request.js';
import { Base, RequireSigner, Transaction } from './transaction.js';
import { getTimestampFromOffchainRevocationReceipt, getTimestampFromTimestampReceipt, getUIDsFromAttestReceipt, ZERO_ADDRESS, ZERO_BYTES32 } from './utils.js';
const LEGACY_VERSION = '1.1.0';
export * from './request.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RequireProxy(...args) {
    // Standard decorator: (value, context)
    if (args.length === 2) {
        const [value] = args;
        const wrapped = function (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...fnArgs) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!this.proxy) {
                throw new Error('Invalid proxy');
            }
            return value.apply(this, fnArgs);
        };
        return wrapped;
    }
    // Legacy decorator: (target, propertyKey, descriptor)
    const [_target, _propertyKey, descriptor] = args;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const original = descriptor.value;
    descriptor.value = function (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...fnArgs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.proxy) {
            throw new Error('Invalid proxy');
        }
        return original.apply(this, fnArgs);
    };
    return descriptor;
}
export class EAS extends Base {
    proxy;
    delegated;
    offchain;
    version;
    legacyEAS;
    constructor(address, options) {
        const { signer, proxy } = options || {};
        super(new EASFactory(), address, signer);
        // Check for ethers v6 compatibility
        if (!this.contract.getAddress) {
            throw new Error('Incompatible ethers version detect. Make sure to use the SDK with ethers v6 or later');
        }
        this.signer = signer;
        if (proxy) {
            this.proxy = proxy;
        }
        this.legacyEAS = new Base(new EASLegacyFactory(), address, signer);
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
        return (this.version = (await legacyVersion(this.contract)) ?? (await this.contract.version()));
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
        if (attestation.uid === ZERO_BYTES32) {
            throw new Error('Invalid attestation');
        }
        return attestation.revocationTime != NO_EXPIRATION;
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
    async attest({ schema, data: { recipient = ZERO_ADDRESS, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0n } }, overrides) {
        return new Transaction(await this.contract.attest.populateTransaction({ schema, data: { recipient, expirationTime, revocable, refUID, data, value } }, { value, ...overrides }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt)[0]);
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ schema, data: { recipient = ZERO_ADDRESS, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0n }, signature, attester, deadline = NO_EXPIRATION }, overrides) {
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
        return new Transaction(tx, this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt)[0]);
    }
    // Multi-attests to multiple schemas
    async multiAttest(requests, overrides) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient ?? ZERO_ADDRESS,
                expirationTime: d.expirationTime ?? NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUID: d.refUID ?? ZERO_BYTES32,
                data: d.data ?? ZERO_BYTES32,
                value: d.value ?? 0n
            }))
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res + r.value, 0n);
            return res + total;
        }, 0n);
        return new Transaction(await this.contract.multiAttest.populateTransaction(multiAttestationRequests, {
            value: requestedValue,
            ...overrides
        }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt));
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests
    async multiAttestByDelegation(requests, overrides) {
        let tx;
        if (await this.isLegacyContract()) {
            const multiAttestationRequests = requests.map((r) => ({
                schema: r.schema,
                data: r.data.map((d) => ({
                    recipient: d.recipient ?? ZERO_ADDRESS,
                    expirationTime: d.expirationTime ?? NO_EXPIRATION,
                    revocable: d.revocable ?? true,
                    refUID: d.refUID ?? ZERO_BYTES32,
                    data: d.data ?? ZERO_BYTES32,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                attester: r.attester,
                deadline: r.deadline ?? NO_EXPIRATION
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
                    recipient: d.recipient ?? ZERO_ADDRESS,
                    expirationTime: d.expirationTime ?? NO_EXPIRATION,
                    revocable: d.revocable ?? true,
                    refUID: d.refUID ?? ZERO_BYTES32,
                    data: d.data ?? ZERO_BYTES32,
                    value: d.value ?? 0n
                })),
                signatures: r.signatures,
                attester: r.attester,
                deadline: r.deadline ?? NO_EXPIRATION
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
        return new Transaction(tx, this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt));
    }
    // Revokes an existing attestation
    async revoke({ schema, data: { uid, value = 0n } }, overrides) {
        return new Transaction(await this.contract.revoke.populateTransaction({ schema, data: { uid, value } }, { value, ...overrides }), this.signer, async () => { });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ schema, data: { uid, value = 0n }, signature, revoker, deadline = NO_EXPIRATION }, overrides) {
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
        return new Transaction(tx, this.signer, async () => { });
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
        return new Transaction(await this.contract.multiRevoke.populateTransaction(multiRevocationRequests, {
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
                deadline: r.deadline ?? NO_EXPIRATION
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
        return new Transaction(tx, this.signer, async () => { });
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
        return new Transaction(await this.contract.timestamp.populateTransaction(data, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getTimestampFromTimestampReceipt(receipt)[0]);
    }
    // Timestamps the specified multiple bytes32 data
    async multiTimestamp(data, overrides) {
        return new Transaction(await this.contract.multiTimestamp.populateTransaction(data, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getTimestampFromTimestampReceipt(receipt));
    }
    // Revokes the specified offchain attestation UID
    async revokeOffchain(uid, overrides) {
        return new Transaction(await this.contract.revokeOffchain.populateTransaction(uid, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getTimestampFromOffchainRevocationReceipt(receipt)[0]);
    }
    // Revokes the specified multiple offchain attestation UIDs
    async multiRevokeOffchain(uids, overrides) {
        return new Transaction(await this.contract.multiRevokeOffchain.populateTransaction(uids, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getTimestampFromOffchainRevocationReceipt(receipt));
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
    static getAttestationUID = (schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump) => solidityPackedKeccak256(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]);
    // Sets the delegated attestations helper
    async setDelegated() {
        this.delegated = new Delegated({
            address: await this.contract.getAddress(),
            domainSeparator: await this.getDomainSeparator(),
            chainId: await this.getChainId()
        }, this);
        return this.delegated;
    }
    // Sets the offchain attestations helper
    async setOffchain() {
        this.offchain = new Offchain({
            address: await this.contract.getAddress(),
            version: await this.getVersion(),
            chainId: await this.getChainId()
        }, OffchainAttestationVersion.Version2, this);
        return this.offchain;
    }
    async isLegacyContract() {
        const version = await this.getVersion();
        const fullVersion = semver.coerce(version);
        if (!fullVersion) {
            throw new Error(`Invalid version: ${version}`);
        }
        return semver.lte(fullVersion, LEGACY_VERSION);
    }
}
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "attest", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "attestByDelegation", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiAttest", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiAttestByDelegation", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "revoke", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "revokeByDelegation", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiRevoke", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeByDelegation", null);
__decorate([
    RequireSigner,
    RequireProxy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "attestByDelegationProxy", null);
__decorate([
    RequireSigner,
    RequireProxy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiAttestByDelegationProxy", null);
__decorate([
    RequireSigner,
    RequireProxy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "revokeByDelegationProxy", null);
__decorate([
    RequireSigner,
    RequireProxy,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeByDelegationProxy", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "timestamp", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiTimestamp", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "revokeOffchain", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EAS.prototype, "multiRevokeOffchain", null);
//# sourceMappingURL=eas.js.map