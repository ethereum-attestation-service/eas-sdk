import {
  DomainTypedData,
  Signature,
  SignData,
  TypedDataConfig,
  TypedDataSigner,
  VerifyData
} from './typed-data-signer';
import { BigNumberish, utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { Signature } from './typed-data-signer';

export const ATTEST_TYPED_SIGNATURE =
  'Attest(address recipient,bytes32 schema,uint32 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)';
export const REVOKE_TYPED_SIGNATURE = 'Revoke(bytes32 uuid,uint256 nonce)';
export const EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';
export const EIP712_NAME = 'EAS';

export type EIP712Params = {
  nonce: BigNumberish;
};

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

export class Delegation extends TypedDataSigner {
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

  public async getAttestationSignature(params: EIP712AttestationParams, signData: SignData): Promise<Signature> {
    return this.getTypedDataSignature(Delegation.getAttestationTypedParams(params), signData);
  }

  public async verifyAttestationSignature(
    attester: string,
    params: EIP712AttestationParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    return this.verifyTypedDataSignature(attester, Delegation.getAttestationTypedParams(params), signature, verifyData);
  }

  public async getRevocationSignature(params: EIP712RevocationParams, signData: SignData): Promise<Signature> {
    return this.getTypedDataSignature(Delegation.getRevocationParams(params), signData);
  }

  public async verifyRevocationSignature(
    attester: string,
    params: EIP712RevocationParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    return this.verifyTypedDataSignature(attester, Delegation.getRevocationParams(params), signature, verifyData);
  }

  private static getAttestationTypedParams(params: EIP712AttestationParams) {
    return {
      types: ['bytes32', 'address', 'bytes32', 'uint32', 'bytes32', 'bytes32', 'uint256'],
      values: [
        keccak256(toUtf8Bytes(ATTEST_TYPED_SIGNATURE)),
        params.recipient,
        params.schema,
        params.expirationTime,
        params.refUUID,
        keccak256(params.data),
        params.nonce
      ]
    };
  }

  private static getRevocationParams(params: EIP712RevocationParams) {
    return {
      types: ['bytes32', 'bytes32', 'uint256'],
      values: [keccak256(toUtf8Bytes(REVOKE_TYPED_SIGNATURE)), params.uuid, params.nonce]
    };
  }
}
