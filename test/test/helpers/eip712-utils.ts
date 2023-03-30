import {
  Delegated,
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Response,
  EIP712RevocationParams,
  TypedDataConfig
} from '../../../src/offchain/delegated';
import { EAS } from '@ethereum-attestation-service/eas-contracts';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BigNumberish, BytesLike } from 'ethers';
import { network } from 'hardhat';

export class EIP712Utils {
  private verifier: EAS;
  private config?: TypedDataConfig;

  private delegated?: Delegated;

  private constructor(verifier: EAS) {
    this.verifier = verifier;
  }

  public async init() {
    this.config = {
      address: this.verifier.address,
      version: await this.verifier.VERSION(),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chainId: network.config.chainId!
    };

    this.delegated = new Delegated(this.config);
  }

  public static async fromVerifier(verifier: EAS) {
    const utils = new EIP712Utils(verifier);
    await utils.init();

    return utils;
  }

  public signDelegatedAttestation(
    attester: TypedDataSigner,
    schema: string,
    recipient: string | SignerWithAddress,
    expirationTime: BigNumberish,
    revocable: boolean,
    refUID: string,
    data: BytesLike,
    nonce: BigNumber
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.signDelegatedAttestation(
      {
        schema,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        expirationTime,
        revocable,
        refUID,
        data: Buffer.isBuffer(data) ? data : Buffer.from((data as string).slice(2), 'hex'),
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public verifyDelegatedAttestationSignature(
    attester: string | SignerWithAddress,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>
  ): boolean {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.verifyDelegatedAttestationSignature(
      typeof attester === 'string' ? attester : attester.address,
      response
    );
  }

  public signDelegatedRevocation(
    attester: TypedDataSigner,
    schema: string,
    uid: string,
    nonce: BigNumber
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.signDelegatedRevocation(
      {
        schema,
        uid,
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public verifyDelegatedRevocationSignature(
    attester: string | SignerWithAddress,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>
  ): boolean {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.verifyDelegatedRevocationSignature(
      typeof attester === 'string' ? attester : attester.address,
      response
    );
  }
}
