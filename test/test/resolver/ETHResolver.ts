import { EAS } from '../../../src/eas';
import { SchemaRegistry } from '../../../src/schema-registry';
import Contracts from '../../components/Contracts';
import { ETHResolver } from '../../typechain-types';
import { createWallet } from '../helpers/Wallet';
import {
  EAS as EASContract,
  EIP712Verifier,
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
  let verifier: EIP712Verifier;
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
    verifier = await Contracts.EIP712Verifier.deploy();
    easContract = await Contracts.EAS.deploy(registry.address, verifier.address);

    resolver = await Contracts.ETHResolver.deploy(easContract.address, incentive);
    expect(await resolver.isPayable()).to.be.true;

    eas = new EAS(easContract.address);
    eas.connect(sender);

    await sender.sendTransaction({ to: resolver.address, value: incentive * 2 });

    schemaRegistry = new SchemaRegistry(registry.address);
    schemaRegistry.connect(sender);

    schemaId = await schemaRegistry.register({ schema, resolverAddress: resolver.address });
  });

  it('should allow sending ETH during attestations', async () => {
    const prevResolverBalance = await getBalance(resolver.address);

    const tip = 999;
    const uuid = await eas.attest({ recipient: recipient.address, schema: schemaId, data, value: tip });
    expect(await eas.isAttestationValid({ uuid })).to.be.true;

    expect(await getBalance(resolver.address)).to.equal(prevResolverBalance.sub(incentive).add(tip));
  });

  context('with an attestation', () => {
    let uuid: string;

    beforeEach(async () => {
      uuid = await eas.attest({ recipient: recipient.address, schema: schemaId, data });
      expect(await eas.isAttestationValid({ uuid })).to.be.true;
    });

    it('should allow sending ETH during revocation', async () => {
      const prevResolverBalance = await getBalance(resolver.address);

      const value = incentive;
      await eas.revoke({ uuid, value });

      expect(await eas.isAttestationRevoked({ uuid })).to.be.true;

      expect(await getBalance(resolver.address)).to.equal(prevResolverBalance.add(incentive));
    });
  });
});
