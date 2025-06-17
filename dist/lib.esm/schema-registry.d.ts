import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { Base, Transaction, TransactionProvider, TransactionSigner } from './transaction';
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
export interface SchemaRegistryOptions {
    signer?: TransactionSigner | TransactionProvider;
}
export declare class SchemaRegistry extends Base<SchemaRegistryContract> {
    constructor(address: string, options?: SchemaRegistryOptions);
    getVersion(): Promise<string>;
    static getSchemaUID(schema: string, resolverAddress: string, revocable: boolean): string;
    register({ schema, resolverAddress, revocable }: RegisterSchemaParams, overrides?: Overrides): Promise<Transaction<string>>;
    getSchema({ uid }: GetSchemaParams): Promise<SchemaRecord>;
}
