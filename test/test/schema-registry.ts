import { SchemaRegistry as SchemaRegistryContract } from '@ethereum-attestation-service/eas-contracts';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { SchemaRegistry } from '../../src/schema-registry';
import { getSchemaUID } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

describe('SchemaRegistry API', () => {
  let accounts: Signer[];
  let sender: Signer;

  let schemaRegistryContract: SchemaRegistryContract;
  let schemaRegistry: SchemaRegistry;

  before(async () => {
    accounts = await ethers.getSigners();

    [sender] = accounts;
  });

  beforeEach(async () => {
    schemaRegistryContract = await Contracts.SchemaRegistry.deploy();

    schemaRegistry = new SchemaRegistry(await schemaRegistryContract.getAddress());
    schemaRegistry.connect(sender);
  });

  describe('construction', () => {
    it('should properly create an EAS API', async () => {
      expect(await schemaRegistry.getVersion()).to.equal(await schemaRegistryContract.version());
    });
  });

  describe('registration', () => {
    const testRegister = async (schema: string, resolver: string | Signer, revocable: boolean) => {
      const resolverAddress = typeof resolver === 'string' ? resolver : await resolver.getAddress();

      const uid = getSchemaUID(schema, resolverAddress, revocable);
      await expect(schemaRegistry.getSchema({ uid })).to.be.rejectedWith('Schema not found');

      const tx = await schemaRegistry.register({ schema, resolverAddress, revocable });
      const uid2 = await tx.wait();

      const schemaRecord = await schemaRegistry.getSchema({ uid });
      expect(schemaRecord.uid).to.equal(uid);
      expect(schemaRecord.uid).to.equal(uid2);
      expect(schemaRecord.schema).to.equal(schema);
      expect(schemaRecord.revocable).to.equal(revocable);
      expect(schemaRecord.resolver).to.equal(resolverAddress);
    };

    it('should allow to register a schema', async () => {
      await testRegister('bytes32 proposalId, bool vote', accounts[3], true);
      await testRegister('bool hasPhoneNumber, bytes32 phoneHash', accounts[3], false);
    });

    it('should allow to register a schema without a schema', async () => {
      await testRegister(ZERO_BYTES, accounts[3], true);
    });

    it('should allow to register a schema without a resolver', async () => {
      await testRegister('bool isFriend', ZERO_ADDRESS, true);
    });

    it('should allow to register a schema without neither a schema or a resolver', async () => {
      await testRegister(ZERO_BYTES, ZERO_ADDRESS, true);
    });
  });
});
