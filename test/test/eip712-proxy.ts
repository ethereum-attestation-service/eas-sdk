import { EIP712Proxy } from '../../src/eip712-proxy';
import Contracts from '../components/Contracts';
import chai from './helpers/chai';
import { EAS, EIP712Proxy as EIP712ProxyContract, SchemaRegistry } from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';

const { expect } = chai;

const EIP712_PROXY_NAME = 'EAS-Proxy';

describe('EIP712Proxy API', () => {
  let registry: SchemaRegistry;
  let eas: EAS;
  let proxyContract: EIP712ProxyContract;
  let proxy: EIP712Proxy;

  let sender: SignerWithAddress;

  before(async () => {
    [sender] = await ethers.getSigners();
  });

  beforeEach(async () => {
    registry = await Contracts.SchemaRegistry.deploy();
    eas = await Contracts.EAS.deploy(registry.address);

    proxyContract = await Contracts.EIP712Proxy.deploy(eas.address, EIP712_PROXY_NAME);
    proxy = new EIP712Proxy(proxyContract.address, { signerOrProvider: sender });
  });

  describe('construction', () => {
    it('should properly create an EIP712Proxy API', async () => {
      expect(await proxy.getVersion()).to.equal(await proxyContract.VERSION());

      expect(await proxy.getEAS()).to.equal(eas.address);
      expect(await proxy.getName()).to.equal(EIP712_PROXY_NAME);
      expect(await proxy.getDomainSeparator()).to.equal(await proxyContract.getDomainSeparator());
      expect(await proxy.getAttestTypeHash()).to.equal(await proxyContract.getAttestTypeHash());
      expect(await proxy.getRevokeTypeHash()).to.equal(await proxyContract.getRevokeTypeHash());
    });
  });
});
