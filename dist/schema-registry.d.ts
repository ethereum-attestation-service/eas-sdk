import { Base, SignerOrProvider, Transaction } from './transaction';
import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
export declare type SchemaRecord = {
    uid: string;
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
    uid: string;
}
export declare class SchemaRegistry extends Base<SchemaRegistryContract> {
    constructor(address: string, signerOrProvider?: SignerOrProvider);
    getVersion(): Promise<string>;
    register({ schema, resolverAddress, revocable }: RegisterSchemaParams): Promise<Transaction<string>>;
    getSchema({ uid }: GetSchemaParams): Promise<SchemaRecord>;
}
