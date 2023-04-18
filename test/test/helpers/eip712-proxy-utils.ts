import { EIP712MessageTypes, EIP712Response } from '../../../src/offchain/delegated';
import {
  DelegatedProxy,
  EIP712AttestationProxyParams,
  EIP712RevocationProxyParams,
  TypedDataConfig
} from '../../../src/offchain/delegated-proxy';
import { EIP712Proxy } from '@ethereum-attestation-service/eas-contracts';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';
import { network } from 'hardhat';

export class EIP712ProxyUtils {
  private proxy: EIP712Proxy;
  private config?: TypedDataConfig;

  private delegatedProxy?: DelegatedProxy;

  private constructor(proxy: EIP712Proxy) {
    this.proxy = proxy;
  }

  public async init() {
    this.config = {
      name: await this.proxy.getName(),
      address: this.proxy.address,
      version: await this.proxy.VERSION(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chainId: network.config.chainId!
    };

    this.delegatedProxy = new DelegatedProxy(this.config);
  }

  public static async fromProxy(proxy: EIP712Proxy) {
    const utils = new EIP712ProxyUtils(proxy);
    await utils.init();

    return utils;
  }

  public signDelegatedProxyAttestation(
    attester: TypedDataSigner,
    schema: string,
    recipient: string | SignerWithAddress,
    expirationTime: BigNumberish,
    revocable: boolean,
    refUID: string,
    data: string,
    deadline: BigNumberish
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>> {
    if (!this.delegatedProxy) {
      throw new Error('EIP712ProxyUtils was not initialized');
    }

    return this.delegatedProxy.signDelegatedProxyAttestation(
      {
        schema,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        expirationTime,
        revocable,
        refUID,
        data,
        deadline
      },
      attester
    );
  }

  public verifyDelegatedProxyAttestationSignature(
    attester: string | SignerWithAddress,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>
  ): boolean {
    if (!this.delegatedProxy) {
      throw new Error('EIP712ProxyUtils was not initialized');
    }

    return this.delegatedProxy.verifyDelegatedProxyAttestationSignature(
      typeof attester === 'string' ? attester : attester.address,
      response
    );
  }

  public signDelegatedProxyRevocation(
    attester: TypedDataSigner,
    schema: string,
    uid: string,
    deadline: BigNumberish
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>> {
    if (!this.delegatedProxy) {
      throw new Error('EIP712ProxyUtils was not initialized');
    }

    return this.delegatedProxy.signDelegatedProxyRevocation(
      {
        schema,
        uid,
        deadline
      },
      attester
    );
  }

  public verifyDelegatedProxyRevocationSignature(
    attester: string | SignerWithAddress,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>
  ): boolean {
    if (!this.delegatedProxy) {
      throw new Error('EIP712ProxyUtils was not initialized');
    }

    return this.delegatedProxy.verifyDelegatedProxyRevocationSignature(
      typeof attester === 'string' ? attester : attester.address,
      response
    );
  }
}
