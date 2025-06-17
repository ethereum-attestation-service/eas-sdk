import { __decorate, __metadata } from "tslib";
import { Indexer__factory } from '@ethereum-attestation-service/eas-contracts';
import { legacyVersion } from './legacy/version';
import { Base, RequireSigner, Transaction } from './transaction';
export class Indexer extends Base {
    delegated;
    constructor(address, options) {
        const { signer } = options || {};
        super(new Indexer__factory(), address, signer);
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
    // Indexes an existing attestation
    async indexAttestation({ uid }, overrides) {
        return new Transaction(await this.contract.indexAttestation.populateTransaction(uid, { ...overrides }), this.signer, async () => { });
    }
    // Indexes multiple existing attestations
    async indexAttestations({ uids }, overrides) {
        return new Transaction(await this.contract.indexAttestations.populateTransaction(uids, { ...overrides }), this.signer, async () => { });
    }
    isAttestationIndexed({ uid }, overrides) {
        return this.contract.isAttestationIndexed(uid, { ...overrides });
    }
    getReceivedAttestationUIDs({ recipient, schema, start, length, reverseOrder }, overrides) {
        return this.contract.getReceivedAttestationUIDs(recipient, schema, start, length, reverseOrder, { ...overrides });
    }
    getReceivedAttestationUIDCount({ recipient, schema }, overrides) {
        return this.contract.getReceivedAttestationUIDCount(recipient, schema, {
            ...overrides
        });
    }
    getSentAttestationUIDs({ attester, schema, start, length, reverseOrder }, overrides) {
        return this.contract.getSentAttestationUIDs(attester, schema, start, length, reverseOrder, { ...overrides });
    }
    getSentAttestationUIDCount({ attester, schema }, overrides) {
        return this.contract.getSentAttestationUIDCount(attester, schema, {
            ...overrides
        });
    }
    getSchemaAttesterRecipientAttestationUIDs({ schema, attester, recipient, start, length, reverseOrder }, overrides) {
        return this.contract.getSchemaAttesterRecipientAttestationUIDs(schema, attester, recipient, start, length, reverseOrder, {
            ...overrides
        });
    }
    getSchemaAttesterRecipientAttestationUIDCount({ schema, attester, recipient }, overrides) {
        return this.contract.getSchemaAttesterRecipientAttestationUIDCount(schema, attester, recipient, {
            ...overrides
        });
    }
    getSchemaAttestationUIDs({ schema, start, length, reverseOrder }, overrides) {
        return this.contract.getSchemaAttestationUIDs(schema, start, length, reverseOrder, {
            ...overrides
        });
    }
    getSchemaAttestationUIDCount({ schema }, overrides) {
        return this.contract.getSchemaAttestationUIDCount(schema, {
            ...overrides
        });
    }
}
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Indexer.prototype, "indexAttestation", null);
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Indexer.prototype, "indexAttestations", null);
//# sourceMappingURL=indexer.js.map