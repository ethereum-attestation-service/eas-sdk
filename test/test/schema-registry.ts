import { SchemaRegistry } from '../../src/schema-registry';
import { getSchemaUUID } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES } from '../utils/Constants';
import chai from './helpers/chai';
import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

const { expect } = chai;

describe('SchemaRegistry API', () => {
  let accounts: SignerWithAddress[];
  let sender: SignerWithAddress;

  let registry: SchemaRegistryContract;
  let api: SchemaRegistry;

  before(async () => {
    accounts = await ethers.getSigners();

    [sender] = accounts;
  });

  beforeEach(async () => {
    registry = await Contracts.SchemaRegistry.deploy();

    api = new SchemaRegistry(registry.address);
    api.connect(sender);
  });

  describe('registration', () => {
    const testRegister = async (schema: string, resolver: string | SignerWithAddress) => {
      const resolverAddress = typeof resolver === 'string' ? resolver : resolver.address;

      const uuid = getSchemaUUID(schema, resolverAddress);
      expect(api.getSchema(uuid)).to.be.rejectedWith(new Error('Schema not found'));

      await api.register(schema, resolverAddress);

      const schemaRecord = await api.getSchema(uuid);
      expect(schemaRecord.uuid).to.equal(uuid);
      expect(schemaRecord.schema).to.equal(schema);
      expect(schemaRecord.resolver).to.equal(resolverAddress);
    };

    it('should allow to register an schema without a schema', async () => {
      await testRegister(ZERO_BYTES, accounts[3]);
    });

    it('should allow to register an schema without a resolver', async () => {
      await testRegister('0x1234', ZERO_ADDRESS);
    });

    it('should allow to register an schema without neither a schema or a resolver', async () => {
      await testRegister(ZERO_BYTES, ZERO_ADDRESS);
    });
  });
});
