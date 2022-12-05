"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRegistry = void 0;
const base_1 = require("./base");
const utils_1 = require("./utils");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
class SchemaRegistry extends base_1.Base {
    constructor(address) {
        super(new eas_contracts_1.SchemaRegistry__factory(), address);
    }
    // Registers a new schema and returns its UUID
    async register({ schema, resolverAddress = utils_1.ZERO_ADDRESS, revocable = true, overrides = {} }) {
        // TODO: revocable
        await this.contract.register(schema, resolverAddress, overrides);
        return (0, utils_1.getSchemaUUID)(schema, resolverAddress, revocable);
    }
    // Returns an existing schema by a schema UUID
    async getSchema({ uuid }) {
        const schema = await this.contract.getSchema(uuid);
        if (schema.uuid === utils_1.ZERO_BYTES32) {
            throw new Error('Schema not found');
        }
        return schema;
    }
}
exports.SchemaRegistry = SchemaRegistry;
//# sourceMappingURL=schema-registry.js.map