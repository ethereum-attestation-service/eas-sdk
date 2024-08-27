import { Indexer as IndexerContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { Base, Transaction, TransactionProvider, TransactionSigner } from './transaction';
export interface IndexerOptions {
    signer?: TransactionSigner | TransactionProvider;
}
export interface UIDOptions {
    uid: string;
}
export type IndexAttestationOptions = UIDOptions;
export interface IndexAttestationsOptions {
    uids: string[];
}
export type IsAttestationIndexedOptions = UIDOptions;
export interface PaginationOptions {
    start: bigint;
    length: bigint;
    reverseOrder: boolean;
}
export interface GetReceivedAttestationUIDCountOptions {
    recipient: string;
    schema: string;
}
export interface GetReceivedAttestationUIDsOptions extends GetReceivedAttestationUIDCountOptions, PaginationOptions {
}
export interface GetSentAttestationUIDCountOptions {
    attester: string;
    schema: string;
}
export interface GetSentAttestationUIDsOptions extends GetSentAttestationUIDCountOptions, PaginationOptions {
}
export interface GetSchemaAttesterRecipientAttestationUIDsOptions extends GetSchemaAttesterRecipientAttestationUIDCountOptions, PaginationOptions {
}
export interface GetSchemaAttesterRecipientAttestationUIDCountOptions {
    schema: string;
    attester: string;
    recipient: string;
}
export interface GetSchemaAttestationUIDsOptions extends GetSchemaAttestationUIDCountOptions, PaginationOptions {
}
export interface GetSchemaAttestationUIDCountOptions {
    schema: string;
}
export declare class Indexer extends Base<IndexerContract> {
    private delegated?;
    constructor(address: string, options?: IndexerOptions);
    connect(signer: TransactionSigner | TransactionProvider): this;
    getVersion(): Promise<string>;
    getEAS(): Promise<string>;
    indexAttestation({ uid }: IndexAttestationOptions, overrides?: Overrides): Promise<Transaction<void>>;
    indexAttestations({ uids }: IndexAttestationsOptions, overrides?: Overrides): Promise<Transaction<void>>;
    isAttestationIndexed({ uid }: IsAttestationIndexedOptions, overrides?: Overrides): Promise<boolean>;
    getReceivedAttestationUIDs({ recipient, schema, start, length, reverseOrder }: GetReceivedAttestationUIDsOptions, overrides?: Overrides): Promise<string[]>;
    getReceivedAttestationUIDCount({ recipient, schema }: GetReceivedAttestationUIDCountOptions, overrides?: Overrides): Promise<bigint>;
    getSentAttestationUIDs({ attester, schema, start, length, reverseOrder }: GetSentAttestationUIDsOptions, overrides?: Overrides): Promise<string[]>;
    getSentAttestationUIDCount({ attester, schema }: GetSentAttestationUIDCountOptions, overrides?: Overrides): Promise<bigint>;
    getSchemaAttesterRecipientAttestationUIDs({ schema, attester, recipient, start, length, reverseOrder }: GetSchemaAttesterRecipientAttestationUIDsOptions, overrides?: Overrides): Promise<string[]>;
    getSchemaAttesterRecipientAttestationUIDCount({ schema, attester, recipient }: GetSchemaAttesterRecipientAttestationUIDCountOptions, overrides?: Overrides): Promise<bigint>;
    getSchemaAttestationUIDs({ schema, start, length, reverseOrder }: GetSchemaAttestationUIDsOptions, overrides?: Overrides): Promise<string[]>;
    getSchemaAttestationUIDCount({ schema }: GetSchemaAttestationUIDCountOptions, overrides?: Overrides): Promise<bigint>;
}
