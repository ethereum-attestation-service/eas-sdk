import { Indexer__factory, Indexer as IndexerContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { legacyVersion } from './legacy/version';
import { DelegatedProxy } from './offchain';
import { Base, RequireSigner, Transaction, TransactionProvider, TransactionSigner } from './transaction';

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

export interface GetReceivedAttestationUIDsOptions extends GetReceivedAttestationUIDCountOptions, PaginationOptions {}

export interface GetSentAttestationUIDCountOptions {
  attester: string;
  schema: string;
}

export interface GetSentAttestationUIDsOptions extends GetSentAttestationUIDCountOptions, PaginationOptions {}

export interface GetSchemaAttesterRecipientAttestationUIDsOptions
  extends GetSchemaAttesterRecipientAttestationUIDCountOptions,
    PaginationOptions {}

export interface GetSchemaAttesterRecipientAttestationUIDCountOptions {
  schema: string;
  attester: string;
  recipient: string;
}

export interface GetSchemaAttestationUIDsOptions extends GetSchemaAttestationUIDCountOptions, PaginationOptions {}

export interface GetSchemaAttestationUIDCountOptions {
  schema: string;
}

export class Indexer extends Base<IndexerContract> {
  private delegated?: DelegatedProxy;

  constructor(address: string, options?: IndexerOptions) {
    const { signer } = options || {};

    super(new Indexer__factory(), address, signer);
  }

  // Connects the API to a specific signer
  public connect(signer: TransactionSigner | TransactionProvider) {
    delete this.delegated;

    super.connect(signer);

    return this;
  }

  // Returns the version of the contract
  public async getVersion(): Promise<string> {
    return (await legacyVersion(this.contract)) ?? this.contract.version();
  }

  // Returns the address of the EAS contract
  public getEAS(): Promise<string> {
    return this.contract.getEAS();
  }

  // Indexes an existing attestation
  @RequireSigner
  public async indexAttestation({ uid }: IndexAttestationOptions, overrides?: Overrides): Promise<Transaction<void>> {
    return new Transaction(
      await this.contract.indexAttestation.populateTransaction(uid, { ...overrides }),
      this.signer!,
      async () => {}
    );
  }

  // Indexes multiple existing attestations
  @RequireSigner
  public async indexAttestations(
    { uids }: IndexAttestationsOptions,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    return new Transaction(
      await this.contract.indexAttestations.populateTransaction(uids, { ...overrides }),
      this.signer!,
      async () => {}
    );
  }

  public isAttestationIndexed({ uid }: IsAttestationIndexedOptions, overrides?: Overrides): Promise<boolean> {
    return this.contract.isAttestationIndexed(uid, { ...overrides });
  }

  public getReceivedAttestationUIDs(
    { recipient, schema, start, length, reverseOrder }: GetReceivedAttestationUIDsOptions,
    overrides?: Overrides
  ): Promise<string[]> {
    return this.contract.getReceivedAttestationUIDs(recipient, schema, start, length, reverseOrder, { ...overrides });
  }

  public getReceivedAttestationUIDCount(
    { recipient, schema }: GetReceivedAttestationUIDCountOptions,
    overrides?: Overrides
  ): Promise<bigint> {
    return this.contract.getReceivedAttestationUIDCount(recipient, schema, {
      ...overrides
    });
  }

  public getSentAttestationUIDs(
    { attester, schema, start, length, reverseOrder }: GetSentAttestationUIDsOptions,
    overrides?: Overrides
  ): Promise<string[]> {
    return this.contract.getSentAttestationUIDs(attester, schema, start, length, reverseOrder, { ...overrides });
  }

  public getSentAttestationUIDCount(
    { attester, schema }: GetSentAttestationUIDCountOptions,
    overrides?: Overrides
  ): Promise<bigint> {
    return this.contract.getSentAttestationUIDCount(attester, schema, {
      ...overrides
    });
  }

  public getSchemaAttesterRecipientAttestationUIDs(
    { schema, attester, recipient, start, length, reverseOrder }: GetSchemaAttesterRecipientAttestationUIDsOptions,
    overrides?: Overrides
  ): Promise<string[]> {
    return this.contract.getSchemaAttesterRecipientAttestationUIDs(
      schema,
      attester,
      recipient,
      start,
      length,
      reverseOrder,
      {
        ...overrides
      }
    );
  }

  public getSchemaAttesterRecipientAttestationUIDCount(
    { schema, attester, recipient }: GetSchemaAttesterRecipientAttestationUIDCountOptions,
    overrides?: Overrides
  ): Promise<bigint> {
    return this.contract.getSchemaAttesterRecipientAttestationUIDCount(schema, attester, recipient, {
      ...overrides
    });
  }

  public getSchemaAttestationUIDs(
    { schema, start, length, reverseOrder }: GetSchemaAttestationUIDsOptions,
    overrides?: Overrides
  ): Promise<string[]> {
    return this.contract.getSchemaAttestationUIDs(schema, start, length, reverseOrder, {
      ...overrides
    });
  }

  public getSchemaAttestationUIDCount(
    { schema }: GetSchemaAttestationUIDCountOptions,
    overrides?: Overrides
  ): Promise<bigint> {
    return this.contract.getSchemaAttestationUIDCount(schema, {
      ...overrides
    });
  }
}
