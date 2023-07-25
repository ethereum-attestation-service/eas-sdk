import { Base, SignerOrProvider, Transaction } from './transaction';
import { getSchemaUID, ZERO_ADDRESS, ZERO_BYTES32 } from './utils';
import {
  SchemaRegistry__factory,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { legacyVersion } from './legacy/version';
import { TransactionReceipt } from 'ethers';

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
  signerOrProvider?: SignerOrProvider;
}

export class SchemaRegistry extends Base<SchemaRegistryContract> {
  constructor(address: string, options?: SchemaRegistryOptions) {
    const { signerOrProvider } = options || {};

    super(new SchemaRegistry__factory(), address, signerOrProvider);
  }

  // Returns the version of the contract
  public async getVersion(): Promise<string> {
    return (await legacyVersion(this.contract)) ?? this.contract.version();
  }

  // Registers a new schema and returns its UID
  public async register({
    schema,
    resolverAddress = ZERO_ADDRESS,
    revocable = true
  }: RegisterSchemaParams): Promise<Transaction<string>> {
    const tx = await this.contract.register(schema, resolverAddress, revocable);

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (_receipt: TransactionReceipt) =>
      getSchemaUID(schema, resolverAddress, revocable)
    );
  }

  // Returns an existing schema by a schema UID
  public async getSchema({ uid }: GetSchemaParams): Promise<SchemaRecord> {
    const schema = await this.contract.getSchema(uid);
    if (schema.uid === ZERO_BYTES32) {
      throw new Error('Schema not found');
    }

    return schema;
  }
}
