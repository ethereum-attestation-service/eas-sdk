import { Delegated, EIP712Request } from '../../../src/offchain/delegated';
import { Offchain } from '../../../src/offchain/offchain';
import { HARDHAT_CHAIN_ID } from '../../utils/Constants';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

export class EIP712Utils {
  delegated: Delegated;
  offchain: Offchain;

  constructor(contract: string | SignerWithAddress) {
    const contractAddress = typeof contract === 'string' ? contract : contract.address;

    const config = {
      address: contractAddress,
      version: '0.14',
      chainId: HARDHAT_CHAIN_ID
    };

    this.delegated = new Delegated(config);
    this.offchain = new Offchain(config);
  }

  async signDelegatedAttestation(
    attester: TypedDataSigner,
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string,
    nonce: BigNumber
  ): Promise<EIP712Request> {
    return this.delegated.signDelegatedAttestation(
      {
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex'),
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  async signDelegatedRevocation(attester: TypedDataSigner, uuid: string, nonce: BigNumber): Promise<EIP712Request> {
    return this.delegated.signDelegatedRevocation(
      {
        uuid,
        nonce: nonce.toNumber()
      },
      attester
    );
  }

  public async signOffchainAttestation(
    attester: TypedDataSigner,
    time: number,
    uuid: string,
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string
  ): Promise<EIP712Request> {
    return this.offchain.signOffchainAttestation(
      {
        time,
        uuid,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex')
      },
      attester
    );
  }

  public async verifyOffchainAttestation(attester: string, request: EIP712Request): Promise<boolean> {
    return this.offchain.verifyOffchainAttestationSignature(attester, request);
  }
}
