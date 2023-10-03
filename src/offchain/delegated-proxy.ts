import { Signer } from 'ethers';
import omit from 'lodash/omit';
import semver from 'semver';
import { EIP712AttestationParams, EIP712RevocationParams } from './delegated';
import { EIP712MessageTypes, EIP712Response, TypedData, TypedDataConfig, TypedDataHandler } from './typed-data-handler';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  TypedDataConfig
} from './typed-data-handler';

export enum DelegatedProxyAttestationVersion {
  Legacy = 0,
  Version1 = 1
}

interface DelegatedProxyAttestationType {
  typedSignature: string;
  primaryType: string;
  types: TypedData[];
}

const DELEGATED_PROXY_ATTESTATION_TYPES: Record<DelegatedProxyAttestationVersion, DelegatedProxyAttestationType> = {
  [DelegatedProxyAttestationVersion.Legacy]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)',
    primaryType: 'Attest',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' },
      { name: 'deadline', type: 'uint64' }
    ]
  },
  [DelegatedProxyAttestationVersion.Version1]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint64 deadline)',
    primaryType: 'Attest',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ]
  }
};

const DELEGATED_PROXY_REVOCATION_TYPES: Record<DelegatedProxyAttestationVersion, DelegatedProxyAttestationType> = {
  [DelegatedProxyAttestationVersion.Legacy]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)',
    primaryType: 'Revoke',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'uid', type: 'bytes32' },
      { name: 'deadline', type: 'uint64' }
    ]
  },
  [DelegatedProxyAttestationVersion.Version1]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint64 deadline)',
    primaryType: 'Revoke',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'uid', type: 'bytes32' },
      { name: 'value', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ]
  }
};

export type EIP712AttestationProxyParams = EIP712AttestationParams & {
  deadline: bigint;
};

export type EIP712RevocationProxyParams = EIP712RevocationParams & {
  deadline: bigint;
};

export class DelegatedProxy extends TypedDataHandler {
  public readonly version: DelegatedProxyAttestationVersion;
  private readonly attestType: DelegatedProxyAttestationType;
  private readonly revokeType: DelegatedProxyAttestationType;

  constructor(config: TypedDataConfig) {
    super(config);

    if (semver.lt(config.version, '1.2.0')) {
      this.version = DelegatedProxyAttestationVersion.Legacy;
    } else {
      this.version = DelegatedProxyAttestationVersion.Version1;
    }

    this.attestType = DELEGATED_PROXY_ATTESTATION_TYPES[this.version];
    this.revokeType = DELEGATED_PROXY_REVOCATION_TYPES[this.version];
  }

  public signDelegatedProxyAttestation(
    params: EIP712AttestationProxyParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>> {
    let effectiveParams = params;

    if (this.version === DelegatedProxyAttestationVersion.Legacy) {
      if (params.value !== 0n) {
        throw new Error("Committing to a value isn't supported for legacy attestations. Please specify 0 instead");
      }

      effectiveParams = omit(params, ['value']) as EIP712AttestationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712AttestationProxyParams>(
      effectiveParams,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.attestType.primaryType,
        message: effectiveParams,
        types: {
          [this.attestType.primaryType]: this.attestType.types
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
    let effectiveParams = params;

    if (this.version === DelegatedProxyAttestationVersion.Legacy) {
      if (params.value !== 0n) {
        throw new Error("Committing to a value isn't supported for legacy revocations. Please specify 0 instead");
      }

      effectiveParams = omit(params, ['value']) as EIP712RevocationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationProxyParams>(
      effectiveParams,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.revokeType.primaryType,
        message: effectiveParams,
        types: {
          Revoke: this.revokeType.types
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
