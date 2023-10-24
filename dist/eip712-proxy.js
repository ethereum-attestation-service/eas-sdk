"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EIP712Proxy = void 0;
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const version_1 = require("./legacy/version");
const offchain_1 = require("./offchain");
const request_1 = require("./request");
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
class EIP712Proxy extends transaction_1.Base {
    delegated;
    constructor(address, options) {
        const { signerOrProvider } = options || {};
        super(new eas_contracts_1.EIP712Proxy__factory(), address, signerOrProvider);
    }
    // Connects the API to a specific signer
    connect(signerOrProvider) {
        delete this.delegated;
        super.connect(signerOrProvider);
        return this;
    }
    // Returns the version of the contract
    async getVersion() {
        return (await (0, version_1.legacyVersion)(this.contract)) ?? this.contract.version();
    }
    // Returns the address of the EAS contract
    getEAS() {
        return this.contract.getEAS();
    }
    // Returns the EIP712 name
    getName() {
        return this.contract.getName();
    }
    // Returns the domain separator used in the encoding of the signatures for attest, and revoke
    getDomainSeparator() {
        return this.contract.getDomainSeparator();
    }
    // Returns the EIP712 type hash for the attest function
    getAttestTypeHash() {
        return this.contract.getAttestTypeHash();
    }
    // Returns the EIP712 type hash for the revoke function
    getRevokeTypeHash() {
        return this.contract.getRevokeTypeHash();
    }
    // Returns the attester for a given uid
    getAttester(uid) {
        return this.contract.getAttester(uid);
    }
    // Returns the delegated attestations helper
    getDelegated() {
        if (this.delegated) {
            return this.delegated;
        }
        return this.setDelegated();
    }
    // Attests to a specific schema via an EIP712 delegation request using an external EIP712 proxy
    async attestByDelegationProxy({ schema, data: { recipient, data, expirationTime = request_1.NO_EXPIRATION, revocable = true, refUID = utils_1.ZERO_BYTES32, value = 0n }, attester, signature, deadline = request_1.NO_EXPIRATION }, overrides) {
        const tx = await this.contract.attestByDelegation({
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
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt)[0]);
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
    async multiAttestByDelegationProxy(requests, overrides) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
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
        const tx = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
            value: requestedValue,
            ...overrides
        });
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (receipt) => (0, utils_1.getUIDsFromAttestReceipt)(receipt));
    }
    // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
    async revokeByDelegationProxy({ schema, data: { uid, value = 0n }, signature, revoker, deadline = request_1.NO_EXPIRATION }, overrides) {
        const tx = await this.contract.revokeByDelegation({
            schema,
            data: {
                uid,
                value
            },
            signature,
            revoker,
            deadline
        }, { value, ...overrides });
        return new transaction_1.Transaction(tx, async () => { });
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests using an external EIP712 proxy
    async multiRevokeByDelegationProxy(requests, overrides) {
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
        const tx = await this.contract.multiRevokeByDelegation(multiRevocationRequests, {
            value: requestedValue,
            ...overrides
        });
        return new transaction_1.Transaction(tx, async () => { });
    }
    // Sets the delegated attestations helper
    async setDelegated() {
        this.delegated = new offchain_1.DelegatedProxy({
            name: await this.getName(),
            address: await this.contract.getAddress(),
            version: await this.getVersion(),
            chainId: await this.getChainId()
        });
        return this.delegated;
    }
}
exports.EIP712Proxy = EIP712Proxy;
//# sourceMappingURL=eip712-proxy.js.map