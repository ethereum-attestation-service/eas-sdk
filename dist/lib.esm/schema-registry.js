import { __decorate, __metadata } from "tslib";
import { SchemaRegistry__factory } from '@ethereum-attestation-service/eas-contracts';
import { solidityPackedKeccak256 } from 'ethers';
import { legacyVersion } from './legacy/version';
import { Base, RequireSigner, Transaction } from './transaction';
import { ZERO_ADDRESS, ZERO_BYTES32 } from './utils';
export class SchemaRegistry extends Base {
    constructor(address, options) {
        const { signer } = options || {};
        super(new SchemaRegistry__factory(), address, signer);
    }
    // Returns the version of the contract
    async getVersion() {
        return (await legacyVersion(this.contract)) ?? this.contract.version();
    }
    // Returns a schema UID
    static getSchemaUID(schema, resolverAddress, revocable) {
        return solidityPackedKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
    }
    // Registers a new schema and returns its UID
    async register({ schema, resolverAddress = ZERO_ADDRESS, revocable = true }, overrides) {
        return new Transaction(await this.contract.register.populateTransaction(schema, resolverAddress, revocable, overrides ?? {}), this.signer, 
        // eslint-disable-next-line require-await
        async (_receipt) => SchemaRegistry.getSchemaUID(schema, resolverAddress, revocable));
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
__decorate([
    RequireSigner,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SchemaRegistry.prototype, "register", null);
//# sourceMappingURL=schema-registry.js.map