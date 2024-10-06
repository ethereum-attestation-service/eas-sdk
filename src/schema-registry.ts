import {
  SchemaRegistry__factory,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { Overrides, solidityPackedKeccak256, TransactionReceipt } from 'ethers';
import { legacyVersion } from './legacy/version';
import { Base, RequireSigner, Transaction, TransactionProvider, TransactionSigner } from './transaction';
import { ZERO_ADDRESS, ZERO_BYTES32 } from './utils';

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

export class SchemaRegistry extends Base<SchemaRegistryContract> {
  constructor(address: string, options?: SchemaRegistryOptions) {
    const { signer } = options || {};

    super(new SchemaRegistry__factory(), address, signer);
  }

  // Returns the version of the contract
  public async getVersion(): Promise<string> {
    return (await legacyVersion(this.contract)) ?? this.contract.version();
  }

  // Returns a schema UID
  public static getSchemaUID(schema: string, resolverAddress: string, revocable: boolean) {
    return solidityPackedKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
  }

  // Registers a new schema and returns its UID
  @RequireSigner
  public async register(
    { schema, resolverAddress = ZERO_ADDRESS, revocable = true }: RegisterSchemaParams,
    overrides?: Overrides
  ): Promise<Transaction<string>> {
    return new Transaction(
      await this.contract.register.populateTransaction(schema, resolverAddress, revocable, overrides ?? {}),
      this.signer!,
      // eslint-disable-next-line require-await
      async (_receipt: TransactionReceipt) => SchemaRegistry.getSchemaUID(schema, resolverAddress, revocable)
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
