import { Signer } from 'ethers';
import omit from 'lodash/omit';
import semver from 'semver';
import {
  EIP712MessageTypes,
  EIP712Params,
  EIP712Response,
  EIP712Types,
  PartialTypedDataConfig,
  TypedDataHandler
} from './typed-data-handler';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  PartialTypedDataConfig,
  Signature
} from './typed-data-handler';

export const EIP712_NAME = 'EAS';

export enum DelegatedAttestationVersion {
  Legacy = 0,
  Version1 = 1,
  Version2 = 2
}

interface DelegatedAttestationType extends EIP712Types<EIP712MessageTypes> {
  typedSignature: string;
}

const DELEGATED_ATTESTATION_TYPES: Record<DelegatedAttestationVersion, DelegatedAttestationType> = {
  [DelegatedAttestationVersion.Legacy]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)',
    primaryType: 'Attest',
    types: {
      Attest: [
        { name: 'schema', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'expirationTime', type: 'uint64' },
        { name: 'revocable', type: 'bool' },
        { name: 'refUID', type: 'bytes32' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' }
      ]
    }
  },
  [DelegatedAttestationVersion.Version1]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Attest',
    types: {
      Attest: [
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
  },
  [DelegatedAttestationVersion.Version2]: {
    typedSignature:
      'Attest(address attester,bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Attest',
    types: {
      Attest: [
        { name: 'attester', type: 'address' },
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
  }
};

const DELEGATED_REVOCATION_TYPES: Record<DelegatedAttestationVersion, DelegatedAttestationType> = {
  [DelegatedAttestationVersion.Legacy]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' }
      ]
    }
  },
  [DelegatedAttestationVersion.Version1]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
  },
  [DelegatedAttestationVersion.Version2]: {
    typedSignature: 'Revoke(address revoker,bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'revoker', type: 'address' },
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
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

interface EIP712FullAttestationParams extends EIP712AttestationParams {
  attester: string;
}

export type EIP712RevocationParams = EIP712Params & {
  schema: string;
  uid: string;
  value: bigint;
  deadline: bigint;
};

interface EIP712FullRevocationParams extends EIP712RevocationParams {
  revoker: string;
}

export class Delegated extends TypedDataHandler {
  public readonly version: DelegatedAttestationVersion;
  private readonly attestType: DelegatedAttestationType;
  private readonly revokeType: DelegatedAttestationType;

  constructor(config: PartialTypedDataConfig) {
    super({ ...config, name: EIP712_NAME });

    if (semver.lt(config.version, '1.2.0')) {
      this.version = DelegatedAttestationVersion.Legacy;
    } else if (semver.lt(config.version, '1.3.0')) {
      this.version = DelegatedAttestationVersion.Version1;
    } else {
      this.version = DelegatedAttestationVersion.Version2;
    }

    this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
    this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];
  }

  public async signDelegatedAttestation(
    params: EIP712AttestationParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>> {
    let effectiveParams: EIP712FullAttestationParams = {
      attester: await signer.getAddress(),
      ...params
    };

    if (this.version === DelegatedAttestationVersion.Legacy) {
      // Committing to a value or to a deadline isn't supported for legacy attestations, therefore they will be ignored
      effectiveParams = omit(params, ['value', 'deadline']) as EIP712FullAttestationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712FullAttestationParams>(
      effectiveParams,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.attestType.primaryType,
        message: effectiveParams,
        types: this.attestType.types
      },
      signer
    );
  }

  public verifyDelegatedAttestationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(
      attester,
      { ...response, message: { attester, ...response.message } },
      {
        primaryType: this.attestType.primaryType,
        types: this.attestType.types
      }
    );
  }

  public async signDelegatedRevocation(
    params: EIP712RevocationParams,
    signer: Signer
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>> {
    let effectiveParams: EIP712FullRevocationParams = {
      revoker: await signer.getAddress(),
      ...params
    };

    if (this.version === DelegatedAttestationVersion.Legacy) {
      // Committing to a value or to a deadline isn't supported for legacy revocations, therefore they will be ignored
      effectiveParams = omit(params, ['value', 'deadline']) as EIP712FullRevocationParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationParams>(
      effectiveParams,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.revokeType.primaryType,
        message: effectiveParams,
        types: this.revokeType.types
      },
      signer
    );
  }

  public verifyDelegatedRevocationSignature(
    revoker: string,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>
  ): boolean {
    return this.verifyTypedDataRequestSignature(
      revoker,
      { ...response, message: { revoker, ...response.message } },
      {
        primaryType: this.revokeType.primaryType,
        types: this.revokeType.types
      }
    );
  }
}
