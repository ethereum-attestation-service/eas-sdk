import { Base } from './base';
import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
export declare type SchemaRecord = {
    uuid: string;
    resolver: string;
    schema: string;
};
export declare class SchemaRegistry extends Base<SchemaRegistryContract> {
    constructor(address: string);
    register(schema: string, resolverAddress?: string): Promise<string>;
    getSchema(uuid: string): Promise<SchemaRecord>;
}
