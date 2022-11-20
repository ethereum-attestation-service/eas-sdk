import { Delegated, EIP712MessageTypes, EIP712TypedData } from '../../../src/offchain/delegated';
import { Offchain, Signature } from '../../../src/offchain/offchain';
import { HARDHAT_CHAIN_ID } from '../../utils/Constants';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { signTypedData_v4 } from 'eth-sig-util';
import { ecsign } from 'ethereumjs-util';
import { BigNumber, utils } from 'ethers';

const { splitSignature, joinSignature, hexlify, recoverAddress } = utils;

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
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string,
    nonce: BigNumber,
    privateKey: Buffer
  ) {
    return this.delegated.signDelegatedAttestation(
      {
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex'),
        nonce
      },
      async (message) => {
        const { v, r, s } = ecsign(message, privateKey);
        return { v, r, s };
      }
    );
  }

  async signDelegatedRevocation(uuid: string, nonce: BigNumber, privateKey: Buffer) {
    return this.delegated.signDelegatedRevocation(
      {
        uuid,
        nonce
      },
      async (message) => {
        const { v, r, s } = ecsign(message, privateKey);
        return { v, r, s };
      }
    );
  }

  async signDelegatedAttestationTypedData(
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string,
    nonce: BigNumber,
    privateKey: Buffer
  ) {
    return this.delegated.signDelegatedAttestationTypedData(
      {
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex'),
        nonce: nonce.toNumber()
      },
      async (data: EIP712TypedData<EIP712MessageTypes>) => {
        const { v, r, s } = splitSignature(await signTypedData_v4(privateKey, { data }));
        return { v, r: Buffer.from(r.slice(2), 'hex'), s: Buffer.from(s.slice(2), 'hex') };
      }
    );
  }

  async signDelegatedRevocationTypedData(uuid: string, nonce: BigNumber, privateKey: Buffer) {
    return this.delegated.signDelegatedRevocationTypedData(
      {
        uuid,
        nonce: nonce.toNumber()
      },
      async (data: EIP712TypedData<EIP712MessageTypes>) => {
        const { v, r, s } = splitSignature(await signTypedData_v4(privateKey, { data }));
        return { v, r: Buffer.from(r.slice(2), 'hex'), s: Buffer.from(s.slice(2), 'hex') };
      }
    );
  }

  public async signOffchainAttestation(
    time: number,
    uuid: string,
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string,
    privateKey: Buffer
  ): Promise<Signature> {
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
      async (message) => {
        const { v, r, s } = ecsign(message, privateKey);
        return { v, r, s };
      }
    );
  }

  public async verifyOffchainAttestation(
    attester: string,
    signature: Signature,
    time: number,
    uuid: string,
    recipient: string | SignerWithAddress,
    schema: string,
    expirationTime: number,
    refUUID: string,
    data: string
  ): Promise<boolean> {
    return this.offchain.verifyOffchainAttestationSignature(
      attester,
      {
        time,
        uuid,
        recipient: typeof recipient === 'string' ? recipient : recipient.address,
        schema,
        expirationTime,
        refUUID,
        data: Buffer.from(data.slice(2), 'hex')
      },
      signature,
      async (message: Buffer, signature: Signature) => {
        const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
        return recoverAddress(message, sig);
      }
    );
  }
}
