import { EAS, EIP712Proxy as EIP712ProxyContract, SchemaRegistry } from '@ethereum-attestation-service/eas-contracts';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { EIP712Proxy } from '../../src/eip712-proxy';
import Contracts from '../components/Contracts';
import chai from './helpers/chai';

const { expect } = chai;

const EIP712_PROXY_NAME = 'EAS-Proxy';

describe('EIP712Proxy API', () => {
  let registry: SchemaRegistry;
  let eas: EAS;
  let proxyContract: EIP712ProxyContract;
  let proxy: EIP712Proxy;

  let sender: Signer;

  before(async () => {
    [sender] = await ethers.getSigners();
  });

  beforeEach(async () => {
    registry = await Contracts.SchemaRegistry.deploy();
    eas = await Contracts.EAS.deploy(await registry.getAddress());

    proxyContract = await Contracts.EIP712Proxy.deploy(await eas.getAddress(), EIP712_PROXY_NAME);
    proxy = new EIP712Proxy(await proxyContract.getAddress(), { signer: sender });
  });

  describe('construction', () => {
    it('should properly create an EIP712Proxy API', async () => {
      expect(await proxy.getVersion()).to.equal(await proxyContract.version());

      expect(await proxy.getEAS()).to.equal(await eas.getAddress());
      expect(await proxy.getName()).to.equal(EIP712_PROXY_NAME);
      expect(await proxy.getDomainSeparator()).to.equal(await proxyContract.getDomainSeparator());
      expect(await proxy.getAttestTypeHash()).to.equal(await proxyContract.getAttestTypeHash());
      expect(await proxy.getRevokeTypeHash()).to.equal(await proxyContract.getRevokeTypeHash());
    });
  });
});
