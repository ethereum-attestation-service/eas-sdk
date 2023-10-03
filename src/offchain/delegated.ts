import { Signer } from 'ethers';
import omit from 'lodash/omit';
import semver from 'semver';
import { NO_EXPIRATION } from '../request';
import {
  EIP712MessageTypes,
  EIP712Params,
  EIP712Response,
  PartialTypedDataConfig,
  TypedData,
  TypedDataHandler
} from './typed-data-handler';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  PartialTypedDataConfig
} from './typed-data-handler';

export const EIP712_NAME = 'EAS';

export enum DelegatedAttestationVersion {
  Legacy = 0,
  Version1 = 1
}

interface DelegatedAttestationType {
  typedSignature: string;
  primaryType: string;
  types: TypedData[];
}

const DELEGATED_ATTESTATION_TYPES: Record<DelegatedAttestationVersion, DelegatedAttestationType> = {
  [DelegatedAttestationVersion.Legacy]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)',
    primaryType: 'Attest',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' },
      { name: 'nonce', type: 'uint256' }
    ]
  },
  [DelegatedAttestationVersion.Version1]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Attest',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ]
  }
};

const DELEGATED_REVOCATION_TYPES: Record<DelegatedAttestationVersion, DelegatedAttestationType> = {
  [DelegatedAttestationVersion.Legacy]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)',
    primaryType: 'Revoke',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'uid', type: 'bytes32' },
      { name: 'nonce', type: 'uint256' }
    ]
  },
  [DelegatedAttestationVersion.Version1]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Revoke',
    types: [
      { name: 'schema', type: 'bytes32' },
      { name: 'uid', type: 'bytes32' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint64' }
    ]
  }
};

export type EIP712AttestationParams = EIP712Params & {
  schema: string;
  recipient: string;
  expirationTime: bigint;
  revocable: boolean;
  refUID: string;
  data: string;
  value: bigint;
  deadline: bigint;
};

export type EIP712RevocationParams = EIP712Params & {
  schema: string;
  uid: string;
  value: bigint;
  deadline: bigint;
};

export class Delegated extends TypedDataHandler {
  public readonly version: DelegatedAttestationVersion;
  private readonly attestType: DelegatedAttestationType;
  private readonly revokeType: DelegatedAttestationType;

  constructor(config: PartialTypedDataConfig) {
    super({ ...config, name: EIP712_NAME });

    if (semver.lt(config.version, '1.2.0')) {
      this.version = DelegatedAttestationVersion.Legacy;
    } else {
      this.version = DelegatedAttestationVersion.Version1;
    }

    this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
    this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];
  }

  public signDelegatedAttestation(
    params: EIP712AttestationParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>> {
    let effectiveParams = params;

    if (this.version === DelegatedAttestationVersion.Legacy) {
      if (params.value !== 0n) {
        throw new Error("Committing to a value isn't supported for legacy attestations. Please specify 0 instead");
      }

      if (params.deadline !== NO_EXPIRATION) {
        throw new Error(
          `Committing to a deadline isn't supported for legacy attestations. Please specify ${NO_EXPIRATION} instead`
        );
      }

      effectiveParams = omit(params, ['value', 'deadline']) as EIP712AttestationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712AttestationParams>(
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

  public verifyDelegatedAttestationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(attester, response);
  }

  public signDelegatedRevocation(
    params: EIP712RevocationParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>> {
    let effectiveParams = params;

    if (this.version === DelegatedAttestationVersion.Legacy) {
      if (params.value !== 0n) {
        throw new Error("Committing to a value isn't supported for legacy revocations. Please specify 0 instead");
      }

      if (params.deadline !== NO_EXPIRATION) {
        throw new Error(
          `Committing to a deadline isn't supported for legacy revocations. Please specify ${NO_EXPIRATION} instead`
        );
      }

      effectiveParams = omit(params, ['value', 'deadline']) as EIP712RevocationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationParams>(
      effectiveParams,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.revokeType.primaryType,
        message: effectiveParams,
        types: {
          [this.revokeType.primaryType]: this.revokeType.types
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
