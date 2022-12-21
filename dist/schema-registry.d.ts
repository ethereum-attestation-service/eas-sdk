import { Base, SignerOrProvider } from './base';
import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
export declare type SchemaRecord = {
    uuid: string;
    resolver: string;
    revocable: boolean;
    schema: string;
};
export interface RegisterSchemaParams {
    schema: string;
    resolverAddress?: string;
    revocable?: boolean;
}
export interface GetSchemaParams {
    uuid: string;
}
export declare class SchemaRegistry extends Base<SchemaRegistryContract> {
    constructor(address: string, signerOrProvider?: SignerOrProvider);
    register({ schema, resolverAddress, revocable }: RegisterSchemaParams): Promise<string>;
    getSchema({ uuid }: GetSchemaParams): Promise<SchemaRecord>;
}
