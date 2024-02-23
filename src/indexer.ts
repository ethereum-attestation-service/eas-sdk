import { Indexer__factory, Indexer as IndexerContract } from '@ethereum-attestation-service/eas-contracts';
import { Overrides } from 'ethers';
import { legacyVersion } from './legacy/version';
import { DelegatedProxy } from './offchain';
import { Base, Transaction, TransactionSigner } from './transaction';

export interface IndexerOptions {
  signer?: TransactionSigner;
}

export interface UIDOptions {
  uid: string;
}

export interface IndexAttestationOptions extends UIDOptions {}

export interface IndexAttestationsOptions {
  uids: string[];
}

export interface IsAttestationIndexedOptions extends UIDOptions {}

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
  public connect(signer: TransactionSigner) {
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
  public async indexAttestation({ uid }: IndexAttestationOptions, overrides?: Overrides): Promise<Transaction<void>> {
    const tx = await this.contract.indexAttestation(uid, { ...overrides });

    return new Transaction(tx, async () => {});
  }

  // Indexes multiple existing attestations
  public async indexAttestations(
    { uids }: IndexAttestationsOptions,
    overrides?: Overrides
  ): Promise<Transaction<void>> {
    const tx = await this.contract.indexAttestations(uids, { ...overrides });

    return new Transaction(tx, async () => {});
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
