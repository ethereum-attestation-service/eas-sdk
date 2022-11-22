import {
  DomainTypedData,
  EIP712_DOMAIN_TYPE,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Request,
  EIP712TypedData,
  Signature,
  SignData,
  SignTypedData,
  TypedData,
  TypedDataConfig,
  TypedDataSigner,
  VerifyData,
  VerifyTypedData
} from './typed-data-signer';
import { utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { Signature, EIP712MessageTypes, EIP712TypedData } from './typed-data-signer';

export const ATTEST_PRIMARY_TYPE = 'Attest';
export const REVOKE_PRIMARY_TYPE = 'Revoke';
export const ATTEST_TYPED_SIGNATURE =
  'Attest(address recipient,bytes32 schema,uint32 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)';
export const REVOKE_TYPED_SIGNATURE = 'Revoke(bytes32 uuid,uint256 nonce)';
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

export interface EIP712AttestationMessageTypes extends EIP712MessageTypes {
  Attest: typeof ATTEST_TYPE;
}

export interface EIP712AttestationTypedData extends EIP712TypedData<EIP712AttestationMessageTypes> {
  message: EIP712AttestationParams;
}

export interface EIP712RevocationMessageTypes extends EIP712MessageTypes {
  Revoke: typeof REVOKE_TYPE;
}

export interface EIP712RevocationTypedData extends EIP712TypedData<EIP712RevocationMessageTypes> {
  message: EIP712RevocationParams;
}

export class Delegated extends TypedDataSigner {
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
            EIP712Domain: EIP712_DOMAIN_TYPE,
            Attest: ATTEST_TYPE
          }
        };

      case REVOKE_PRIMARY_TYPE:
        return {
          domain: this.getDomainTypedData(),
          primaryType: REVOKE_PRIMARY_TYPE,
          message: params,
          types: {
            EIP712Domain: EIP712_DOMAIN_TYPE,
            Revoke: REVOKE_TYPE
          }
        };

      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  public async signDelegatedAttestation(params: EIP712AttestationParams, signData: SignData): Promise<Signature> {
    return this.signTypedData(Delegated.getAttestationTypedParams(params), signData);
  }

  public async verifyDelegatedAttestationSignature(
    attester: string,
    params: EIP712AttestationParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    return this.verifyTypedDataSignature(attester, Delegated.getAttestationTypedParams(params), signature, verifyData);
  }

  public async signDelegatedAttestationTypedData(
    params: EIP712AttestationParams,
    signTypedData: SignTypedData<EIP712MessageTypes>
  ): Promise<EIP712Request> {
    return this.signTypedDataRequest(ATTEST_PRIMARY_TYPE, params, signTypedData);
  }

  public async verifyDelegatedAttestationTypedDataSignature(
    attester: string,
    request: EIP712Request,
    verifyTypedData: VerifyTypedData<EIP712MessageTypes>
  ): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request, verifyTypedData);
  }

  public async signDelegatedRevocation(params: EIP712RevocationParams, signData: SignData): Promise<Signature> {
    return this.signTypedData(Delegated.getRevocationParams(params), signData);
  }

  public async verifyRevocationAttestationSignature(
    attester: string,
    params: EIP712RevocationParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    return this.verifyTypedDataSignature(attester, Delegated.getRevocationParams(params), signature, verifyData);
  }

  public async signDelegatedRevocationTypedData(
    params: EIP712RevocationParams,
    signTypedData: SignTypedData<EIP712MessageTypes>
  ): Promise<EIP712Request> {
    return this.signTypedDataRequest(REVOKE_PRIMARY_TYPE, params, signTypedData);
  }

  public async verifyDelegatedRevocationTypedDataSignature(
    attester: string,
    request: EIP712Request,
    verifyTypedData: VerifyTypedData<EIP712MessageTypes>
  ): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request, verifyTypedData);
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
