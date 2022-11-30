import { Base } from './base';
import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
import { PayableOverrides } from 'ethers';
export declare type SchemaRecord = {
    uuid: string;
    resolver: string;
    schema: string;
};
export interface RegisterSchemaParams {
    schema: string;
    resolverAddress?: string;
    revocable?: boolean;
    overrides?: PayableOverrides;
}
export interface GetSchemaParams {
    uuid: string;
}
export declare class SchemaRegistry extends Base<SchemaRegistryContract> {
    constructor(address: string);
    register({ schema, resolverAddress, revocable, overrides }: RegisterSchemaParams): Promise<string>;
    getSchema({ uuid }: GetSchemaParams): Promise<SchemaRecord>;
}
