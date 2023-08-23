import { Signer } from 'ethers';
import { EIP712AttestationParams, EIP712RevocationParams } from './delegated';
import { EIP712MessageTypes, EIP712Response, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  TypedDataConfig
} from './typed-data-handler';

export const ATTEST_PROXY_TYPED_SIGNATURE =
  'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)';
export const REVOKE_PROXY_TYPED_SIGNATURE = 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)';
export const ATTEST_PROXY_PRIMARY_TYPE = 'Attest';
export const REVOKE_PROXY_PRIMARY_TYPE = 'Revoke';
export const ATTEST_PROXY_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'expirationTime', type: 'uint64' },
  { name: 'revocable', type: 'bool' },
  { name: 'refUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' },
  { name: 'deadline', type: 'uint64' }
];
export const REVOKE_PROXY_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'uid', type: 'bytes32' },
  { name: 'deadline', type: 'uint64' }
];

export type EIP712AttestationProxyParams = EIP712AttestationParams & {
  deadline: bigint;
};

export type EIP712RevocationProxyParams = EIP712RevocationParams & {
  deadline: bigint;
};

export class DelegatedProxy extends TypedDataHandler {
  constructor(config: TypedDataConfig) {
    super(config);
  }

  public signDelegatedProxyAttestation(
    params: EIP712AttestationProxyParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>> {
    return this.signTypedDataRequest<EIP712MessageTypes, EIP712AttestationProxyParams>(
      params,
      {
        domain: this.getDomainTypedData(),
        primaryType: ATTEST_PROXY_PRIMARY_TYPE,
        message: params,
        types: {
          Attest: ATTEST_PROXY_TYPE
        }
      },
      signer
    );
  }

  public verifyDelegatedProxyAttestationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(attester, response);
  }

  public signDelegatedProxyRevocation(
    params: EIP712RevocationProxyParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>> {
    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationProxyParams>(
      params,
      {
        domain: this.getDomainTypedData(),
        primaryType: REVOKE_PROXY_PRIMARY_TYPE,
        message: params,
        types: {
          Revoke: REVOKE_PROXY_TYPE
        }
      },
      signer
    );
  }

  public verifyDelegatedProxyRevocationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(attester, response);
  }
}
