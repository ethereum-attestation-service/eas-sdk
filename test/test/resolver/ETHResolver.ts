import {
  EAS as EASContract,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { EAS } from '../../../src/eas';
import { SchemaRegistry } from '../../../src/schema-registry';
import Contracts from '../../components/Contracts';
import { ETHResolver } from '../../typechain-types';
import { createWallet, getBalance } from '../helpers/wallet';

describe('ETHResolver', () => {
  let accounts: Signer[];
  let recipient: Signer;
  let sender: Signer;

  let registry: SchemaRegistryContract;
  let easContract: EASContract;
  let resolver: ETHResolver;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;

  const schema = 'bytes32 eventId,uint8 ticketType,uint32 ticketNum';
  let schemaId: string;
  const data = '0x1234';

  const incentive = 12345n;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    easContract = await Contracts.EAS.deploy(await registry.getAddress());

    resolver = await Contracts.ETHResolver.deploy(await easContract.getAddress(), incentive);
    expect(await resolver.isPayable()).to.be.true;

    eas = new EAS(await easContract.getAddress(), { signer: sender });
    eas.connect(sender);

    await sender.sendTransaction({ to: await resolver.getAddress(), value: incentive * 2n });

    schemaRegistry = new SchemaRegistry(await registry.getAddress(), { signer: sender });
    schemaRegistry.connect(sender);

    const tx = await schemaRegistry.register({ schema, resolverAddress: await resolver.getAddress() });
    schemaId = await tx.wait();
  });

  it('should allow sending ETH during attestations', async () => {
    const prevResolverBalance = await getBalance(await resolver.getAddress());

    const tip = 999n;
    const tx = await eas.attest({
      schema: schemaId,
      data: { recipient: await recipient.getAddress(), data, value: tip }
    });
    const uid = await tx.wait();
    expect(await eas.isAttestationValid(uid)).to.be.true;

    expect(await getBalance(await resolver.getAddress())).to.equal(prevResolverBalance - incentive + tip);
  });

  context('with an attestation', () => {
    let uid: string;

    beforeEach(async () => {
      const tx = await eas.attest({ schema: schemaId, data: { recipient: await recipient.getAddress(), data } });
      uid = await tx.wait();
      expect(await eas.isAttestationValid(uid)).to.be.true;
    });

    it('should allow sending ETH during revocation', async () => {
      const prevResolverBalance = await getBalance(await resolver.getAddress());

      const value = incentive;
      const tx = await eas.revoke({ schema: schemaId, data: { uid, value } });
      await tx.wait();

      expect(await eas.isAttestationRevoked(uid)).to.be.true;

      expect(await getBalance(await resolver.getAddress())).to.equal(prevResolverBalance + incentive);
    });
  });
});
