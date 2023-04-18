import { Base, Transaction } from './transaction';
import { getSchemaUID, ZERO_ADDRESS, ZERO_BYTES32 } from './utils';
import { SchemaRegistry__factory } from '@ethereum-attestation-service/eas-contracts';
export class SchemaRegistry extends Base {
    constructor(address, signerOrProvider) {
        super(new SchemaRegistry__factory(), address, signerOrProvider);
    }
    // Returns the version of the contract
    getVersion() {
        return this.contract.VERSION();
    }
    // Registers a new schema and returns its UID
    async register({ schema, resolverAddress = ZERO_ADDRESS, revocable = true }) {
        const tx = await this.contract.register(schema, resolverAddress, revocable);
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (_receipt) => getSchemaUID(schema, resolverAddress, revocable));
    }
    // Returns an existing schema by a schema UID
    async getSchema({ uid }) {
        const schema = await this.contract.getSchema(uid);
        if (schema.uid === ZERO_BYTES32) {
            throw new Error('Schema not found');
        }
        return schema;
    }
}
//# sourceMappingURL=schema-registry.js.map