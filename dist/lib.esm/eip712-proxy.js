import { __decorate, __metadata } from "tslib";
import { EIP712Proxy__factory } from '@ethereum-attestation-service/eas-contracts';
import from './legacy/version.js';
import from './offchain/index.js';
import from './request.js';
import from './transaction.js';
import from './utils.js';
export class EIP712Proxy extends Base {
    delegated;
    constructor(address, options) {
        const { signer } = options || {};
        super(new EIP712Proxy__factory(), address, signer);
    }
    // Connects the API to a specific signer
    connect(signer) {
        delete this.delegated;
        super.connect(signer);
        return this;
    }
    // Returns the version of the contract
    async getVersion() {
        return (await legacyVersion(this.contract)) ?? this.contract.version();
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
    async attestByDelegationProxy({ schema, data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0n }, attester, signature, deadline = NO_EXPIRATION }, overrides) {
        return new Transaction(await this.contract.attestByDelegation.populateTransaction({
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
        }, { value, ...overrides }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt)[0]);
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
    async multiAttestByDelegationProxy(requests, overrides) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
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
        return new Transaction(await this.contract.multiAttestByDelegation.populateTransaction(multiAttestationRequests, {
            value: requestedValue,
            ...overrides
        }), this.signer, 
        // eslint-disable-next-line require-await
        async (receipt) => getUIDsFromAttestReceipt(receipt));
    }
    // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
    async revokeByDelegationProxy({ schema, data: { uid, value = 0n }, signature, revoker, deadline = NO_EXPIRATION }, overrides) {
        return new Transaction(await this.contract.revokeByDelegation.populateTransaction({
            schema,
            data: {
                uid,
                value
            },
            signature,
            revoker,
            deadline
        }, { value, ...overrides }), this.signer, async () => { });
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
            deadline: r.deadline ?? NO_EXPIRATION
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res + r.value, 0n);
            return res + total;
        }, 0n);
        return new Transaction(await this.contract.multiRevokeByDelegation.populateTransaction(multiRevocationRequests, {
            value: requestedValue,
            ...overrides
        }), this.signer, async () => { });
    }
    // Sets the delegated attestations helper
    async setDelegated() {
        this.delegated = new DelegatedProxy({
            name: await this.getName(),
            address: await this.contract.getAddress(),
            version: await this.getVersion(),
            chainId: await this.getChainId()
        });
        return this.delegated;
    }
}
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EIP712Proxy.prototype, "attestByDelegationProxy", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EIP712Proxy.prototype, "multiAttestByDelegationProxy", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EIP712Proxy.prototype, "revokeByDelegationProxy", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], EIP712Proxy.prototype, "multiRevokeByDelegationProxy", null);
//# sourceMappingURL=eip712-proxy.js.map