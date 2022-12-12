import {
  Delegated,
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Request,
  EIP712RevocationParams
} from '../../../src/offchain/delegated';
import { HARDHAT_CHAIN_ID } from '../../utils/Constants';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

export class EIP712Utils {
  delegated: Delegated;

  constructor(contract: string | SignerWithAddress) {
    const contractAddress = typeof contract === 'string' ? contract : contract.address;

    const config = {
      address: contractAddress,
      version: '0.20',
      chainId: HARDHAT_CHAIN_ID
    };

    this.delegated = new Delegated(config);
  }

  public async signDelegatedAttestation(
    attester: TypedDataSigner,
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    revocable: boolean,
    refUUID: string,
    data: string,
    nonce: BigNumber
  ): Promise<EIP712Request<EIP712MessageTypes, EIP712AttestationParams>> {
    return this.delegated.signDelegatedAttestation(
      {
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        revocable,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex'),
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public async verifyDelegatedAttestationSignature(
    attester: string | SignerWithAddress,
    request: EIP712Request<EIP712MessageTypes, EIP712AttestationParams>
  ): Promise<boolean> {
    return this.delegated.verifyDelegatedAttestationSignature(
      typeof attester === 'string' ? attester : attester.address,
      request
    );
  }

  public async signDelegatedRevocation(
    attester: TypedDataSigner,
    uuid: string,
    nonce: BigNumber
  ): Promise<EIP712Request<EIP712MessageTypes, EIP712RevocationParams>> {
    return this.delegated.signDelegatedRevocation(
      {
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
    return this.delegated.verifyDelegatedRevocationSignature(
      typeof attester === 'string' ? attester : attester.address,
      request
    );
  }
}
