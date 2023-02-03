import { EAS } from '../../../src/eas';
import { SchemaRegistry } from '../../../src/schema-registry';
import Contracts from '../../components/Contracts';
import { ETHResolver } from '../../typechain-types';
import { createWallet } from '../helpers/wallet';
import {
  EAS as EASContract,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { ethers } from 'hardhat';

const {
  provider: { getBalance }
} = ethers;

describe('ETHResolver', () => {
  let accounts: SignerWithAddress[];
  let recipient: SignerWithAddress;
  let sender: Wallet;

  let registry: SchemaRegistryContract;
  let easContract: EASContract;
  let resolver: ETHResolver;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;

  const schema = 'bytes32 eventId,uint8 ticketType,uint32 ticketNum';
  let schemaId: string;
  const data = '0x1234';

  const incentive = 12345;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    easContract = await Contracts.EAS.deploy(registry.address);

    resolver = await Contracts.ETHResolver.deploy(easContract.address, incentive);
    expect(await resolver.isPayable()).to.be.true;

    eas = new EAS(easContract.address);
    eas.connect(sender);

    await sender.sendTransaction({ to: resolver.address, value: incentive * 2 });

    schemaRegistry = new SchemaRegistry(registry.address);
    schemaRegistry.connect(sender);

    const tx = await schemaRegistry.register({ schema, resolverAddress: resolver.address });
    schemaId = await tx.wait();
  });

  it('should allow sending ETH during attestations', async () => {
    const prevResolverBalance = await getBalance(resolver.address);

    const tip = 999;
    const tx = await eas.attest({ schema: schemaId, data: { recipient: recipient.address, data, value: tip } });
    const uuid = await tx.wait();
    expect(await eas.isAttestationValid(uuid)).to.be.true;

    expect(await getBalance(resolver.address)).to.equal(prevResolverBalance.sub(incentive).add(tip));
  });

  context('with an attestation', () => {
    let uuid: string;

    beforeEach(async () => {
      const tx = await eas.attest({ schema: schemaId, data: { recipient: recipient.address, data } });
      uuid = await tx.wait();
      expect(await eas.isAttestationValid(uuid)).to.be.true;
    });

    it('should allow sending ETH during revocation', async () => {
      const prevResolverBalance = await getBalance(resolver.address);

      const value = incentive;
      await eas.revoke({ schema: schemaId, data: { uuid, value } });

      expect(await eas.isAttestationRevoked(uuid)).to.be.true;

      expect(await getBalance(resolver.address)).to.equal(prevResolverBalance.add(incentive));
    });
  });
});
