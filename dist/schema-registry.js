"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRegistry = void 0;
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
class SchemaRegistry extends transaction_1.Base {
    constructor(address, options) {
        const { signerOrProvider } = options || {};
        super(new eas_contracts_1.SchemaRegistry__factory(), address, signerOrProvider);
    }
    // Returns the version of the contract
    getVersion() {
        return this.contract.VERSION();
    }
    // Registers a new schema and returns its UID
    async register({ schema, resolverAddress = utils_1.ZERO_ADDRESS, revocable = true }) {
        const tx = await this.contract.register(schema, resolverAddress, revocable);
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (_receipt) => (0, utils_1.getSchemaUID)(schema, resolverAddress, revocable));
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
//# sourceMappingURL=schema-registry.js.map