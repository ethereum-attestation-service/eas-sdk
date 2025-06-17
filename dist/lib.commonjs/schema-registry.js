"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRegistry = void 0;
const tslib_1 = require("tslib");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
const version_1 = require("./legacy/version");
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
class SchemaRegistry extends transaction_1.Base {
    constructor(address, options) {
        const { signer } = options || {};
        super(new eas_contracts_1.SchemaRegistry__factory(), address, signer);
    }
    // Returns the version of the contract
    async getVersion() {
        return (await (0, version_1.legacyVersion)(this.contract)) ?? this.contract.version();
    }
    // Returns a schema UID
    static getSchemaUID(schema, resolverAddress, revocable) {
        return (0, ethers_1.solidityPackedKeccak256)(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
    }
    // Registers a new schema and returns its UID
    async register({ schema, resolverAddress = utils_1.ZERO_ADDRESS, revocable = true }, overrides) {
        return new transaction_1.Transaction(await this.contract.register.populateTransaction(schema, resolverAddress, revocable, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (_receipt) => SchemaRegistry.getSchemaUID(schema, resolverAddress, revocable));
    }
    // Returns an existing schema by a schema UID
    async getSchema({ uid }) {
        const schema = await this.contract.getSchema(uid);
        if (schema.uid === utils_1.ZERO_BYTES32) {
            throw new Error('Schema not found');
        }
        return schema;
    }
}
exports.SchemaRegistry = SchemaRegistry;
tslib_1.__decorate([
    transaction_1.RequireSigner,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object, Object]),
    tslib_1.__metadata("design:returntype", Promise)
], SchemaRegistry.prototype, "register", null);
//# sourceMappingURL=schema-registry.js.map