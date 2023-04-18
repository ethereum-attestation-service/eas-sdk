import { EIP712MessageTypes, EIP712Params, EIP712Response, TypedData, TypedDataHandler } from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { BigNumberish } from 'ethers';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  TypedDataConfig
} from './typed-data-handler';

export const EIP712_NAME = 'EAS';
export const ATTEST_TYPED_SIGNATURE =
  'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)';
export const REVOKE_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)';
export const ATTEST_PRIMARY_TYPE = 'Attest';
export const REVOKE_PRIMARY_TYPE = 'Revoke';
export const ATTEST_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'expirationTime', type: 'uint64' },
  { name: 'revocable', type: 'bool' },
  { name: 'refUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' },
  { name: 'nonce', type: 'uint256' }
];
export const REVOKE_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'uid', type: 'bytes32' },
  { name: 'nonce', type: 'uint256' }
];

export type EIP712AttestationParams = EIP712Params & {
  schema: string;
  recipient: string;
  expirationTime: BigNumberish;
  revocable: boolean;
  refUID: string;
  data: string;
};

export type EIP712RevocationParams = EIP712Params & {
  schema: string;
  uid: string;
};

interface PartialTypedDataConfig {
  address: string;
  version: string;
  chainId: number;
}

export class Delegated extends TypedDataHandler {
  public constructor(config: PartialTypedDataConfig) {
    super({ ...config, name: EIP712_NAME });
  }

  public signDelegatedAttestation(
    params: EIP712AttestationParams,
    signer: TypedDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>> {
    return this.signTypedDataRequest<EIP712MessageTypes, EIP712AttestationParams>(
      params,
      {
        domain: this.getDomainTypedData(),
        primaryType: ATTEST_PRIMARY_TYPE,
        message: params,
        types: {
          Attest: ATTEST_TYPE
        }
      },
      signer
    );
  }

  public verifyDelegatedAttestationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(attester, response);
  }

  public signDelegatedRevocation(
    params: EIP712RevocationParams,
    signer: TypedDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>> {
    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationParams>(
      params,
      {
        domain: this.getDomainTypedData(),
        primaryType: REVOKE_PRIMARY_TYPE,
        message: params,
        types: {
          Revoke: REVOKE_TYPE
        }
      },
      signer
    );
  }

  public verifyDelegatedRevocationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(attester, response);
  }
}
