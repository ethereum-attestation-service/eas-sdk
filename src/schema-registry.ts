import { Base, SignerOrProvider, Transaction } from './base';
import { getSchemaUUID, ZERO_ADDRESS, ZERO_BYTES32 } from './utils';
import {
  SchemaRegistry__factory,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { ContractReceipt } from 'ethers';

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

export class SchemaRegistry extends Base<SchemaRegistryContract> {
  constructor(address: string, signerOrProvider?: SignerOrProvider) {
    super(new SchemaRegistry__factory(), address, signerOrProvider);
  }

  // Registers a new schema and returns its UUID
  public register({
    schema,
    resolverAddress = ZERO_ADDRESS,
    revocable = true
  }: RegisterSchemaParams): Transaction<string> {
    const tx = this.contract.register(schema, resolverAddress, revocable);

    // eslint-disable-next-line require-await
    return new Transaction(tx, async (_receipt: ContractReceipt) => getSchemaUUID(schema, resolverAddress, revocable));
  }

  // Returns an existing schema by a schema UUID
  public async getSchema({ uuid }: GetSchemaParams): Promise<SchemaRecord> {
    const schema = await this.contract.getSchema(uuid);
    if (schema.uuid === ZERO_BYTES32) {
      throw new Error('Schema not found');
    }

    return schema;
  }
}
