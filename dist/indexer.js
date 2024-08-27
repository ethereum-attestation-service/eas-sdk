"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Indexer = void 0;
const tslib_1 = require("tslib");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const version_1 = require("./legacy/version");
const transaction_1 = require("./transaction");
class Indexer extends transaction_1.Base {
    delegated;
    constructor(address, options) {
        const { signer } = options || {};
        super(new eas_contracts_1.Indexer__factory(), address, signer);
    }
    // Connects the API to a specific signer
    connect(signer) {
        delete this.delegated;
        super.connect(signer);
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
    // Indexes an existing attestation
    async indexAttestation({ uid }, overrides) {
        return new transaction_1.Transaction(await this.contract.indexAttestation.populateTransaction(uid, { ...overrides }), this.signer, async () => { });
    }
    // Indexes multiple existing attestations
    async indexAttestations({ uids }, overrides) {
        return new transaction_1.Transaction(await this.contract.indexAttestations.populateTransaction(uids, { ...overrides }), this.signer, async () => { });
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
exports.Indexer = Indexer;
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], Indexer.prototype, "indexAttestation", null);
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], Indexer.prototype, "indexAttestations", null);
//# sourceMappingURL=indexer.js.map