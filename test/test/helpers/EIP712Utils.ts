import {
  Delegated,
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Request,
  EIP712RevocationParams,
  TypedDataConfig
} from '../../../src/offchain/delegated';
import { EIP712Verifier } from '@ethereum-attestation-service/eas-contracts';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BytesLike } from 'ethers';
import { network } from 'hardhat';

export class EIP712Utils {
  private verifier: EIP712Verifier;
  private config?: TypedDataConfig;

  private delegated?: Delegated;

  private constructor(verifier: EIP712Verifier) {
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

  public static async fromVerifier(verifier: EIP712Verifier) {
    const utils = new EIP712Utils(verifier);
    await utils.init();

    return utils;
  }

  public async signDelegatedAttestation(
    attester: TypedDataSigner,
    schema: string,
    recipient: string | SignerWithAddress,
    expirationTime: number,
    revocable: boolean,
    refUUID: string,
    data: BytesLike,
    nonce: BigNumber
  ): Promise<EIP712Request<EIP712MessageTypes, EIP712AttestationParams>> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.signDelegatedAttestation(
      {
        schema,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        expirationTime,
        revocable,
        refUUID,
        data: Buffer.isBuffer(data) ? data : Buffer.from((data as string).slice(2), 'hex'),
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public async verifyDelegatedAttestationSignature(
    attester: string | SignerWithAddress,
    request: EIP712Request<EIP712MessageTypes, EIP712AttestationParams>
  ): Promise<boolean> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.verifyDelegatedAttestationSignature(
      typeof attester === 'string' ? attester : attester.address,
      request
    );
  }

  public async signDelegatedRevocation(
    attester: TypedDataSigner,
    schema: string,
    uuid: string,
    nonce: BigNumber
  ): Promise<EIP712Request<EIP712MessageTypes, EIP712RevocationParams>> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.signDelegatedRevocation(
      {
        schema,
        uuid,
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public async verifyDelegatedRevocationSignature(
    attester: string | SignerWithAddress,
    request: EIP712Request<EIP712MessageTypes, EIP712RevocationParams>
  ): Promise<boolean> {
    if (!this.delegated) {
      throw new Error('EIP712Utils was not initialized');
    }

    return this.delegated.verifyDelegatedRevocationSignature(
      typeof attester === 'string' ? attester : attester.address,
      request
    );
  }
}
