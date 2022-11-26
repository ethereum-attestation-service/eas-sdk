import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Request,
  EIP712TypedData,
  TypedData,
  TypedDataConfig,
  TypedDataHandler
} from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { EIP712MessageTypes, EIP712TypedData, EIP712Request } from './typed-data-handler';

export const ATTEST_PRIMARY_TYPE = 'Attest';
export const REVOKE_PRIMARY_TYPE = 'Revoke';
export const ATTEST_TYPE: TypedData[] = [
  { name: 'recipient', type: 'address' },
  { name: 'schema', type: 'bytes32' },
  { name: 'expirationTime', type: 'uint32' },
  { name: 'refUUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' },
  { name: 'nonce', type: 'uint256' }
];
export const REVOKE_TYPE: TypedData[] = [
  { name: 'uuid', type: 'bytes32' },
  { name: 'nonce', type: 'uint256' }
];
export const EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export const EIP712_NAME = 'EAS';

export type EIP712AttestationParams = EIP712Params & {
  recipient: string;
  schema: string;
  expirationTime: number;
  refUUID: string;
  data: Buffer;
};

export type EIP712RevocationParams = EIP712Params & {
  uuid: string;
};

export class Delegated extends TypedDataHandler {
  public constructor(config: TypedDataConfig) {
    super(config);
  }

  public getDomainSeparator() {
    return keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes(EIP712_DOMAIN)),
          keccak256(toUtf8Bytes(EIP712_NAME)),
          keccak256(toUtf8Bytes(this.config.version)),
          this.config.chainId,
          this.config.address
        ]
      )
    );
  }

  public getDomainTypedData(): DomainTypedData {
    return {
      name: EIP712_NAME,
      version: this.config.version,
      chainId: this.config.chainId,
      verifyingContract: this.config.address
    };
  }

  public getTypedData(type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes> {
    switch (type) {
      case ATTEST_PRIMARY_TYPE:
        return {
          domain: this.getDomainTypedData(),
          primaryType: ATTEST_PRIMARY_TYPE,
          message: params,
          types: {
            Attest: ATTEST_TYPE
          }
        };

      case REVOKE_PRIMARY_TYPE:
        return {
          domain: this.getDomainTypedData(),
          primaryType: REVOKE_PRIMARY_TYPE,
          message: params,
          types: {
            Revoke: REVOKE_TYPE
          }
        };

      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  public async signDelegatedAttestation(
    params: EIP712AttestationParams,
    signer: TypedDataSigner
  ): Promise<EIP712Request> {
    return this.signTypedDataRequest(ATTEST_PRIMARY_TYPE, params, signer);
  }

  public async verifyDelegatedAttestationSignature(attester: string, request: EIP712Request): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request);
  }

  public async signDelegatedRevocation(
    params: EIP712RevocationParams,
    signer: TypedDataSigner
  ): Promise<EIP712Request> {
    return this.signTypedDataRequest(REVOKE_PRIMARY_TYPE, params, signer);
  }

  public async verifyDelegatedRevocationTypedData(attester: string, request: EIP712Request): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request);
  }
}