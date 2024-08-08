import omit from 'lodash/omit';
import semver from 'semver';
import { EIP712AttestationParams, EIP712RevocationParams } from './delegated';
import {
  EIP712MessageTypes,
  EIP712Response,
  EIP712Types,
  TypeDataSigner,
  TypedDataConfig,
  TypedDataHandler
} from './typed-data-handler';

export {
  EIP712MessageTypes,
  EIP712TypedData,
  EIP712Request,
  EIP712Response,
  TypedDataConfig
} from './typed-data-handler';

export enum DelegatedProxyAttestationVersion {
  Legacy = 0,
  Version1 = 1,
  Version2 = 2
}

interface DelegatedProxyAttestationType extends EIP712Types<EIP712MessageTypes> {
  typedSignature: string;
}

const DELEGATED_PROXY_ATTESTATION_TYPES: Record<DelegatedProxyAttestationVersion, DelegatedProxyAttestationType> = {
  [DelegatedProxyAttestationVersion.Legacy]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)',
    primaryType: 'Attest',
    types: {
      Attest: [
        { name: 'schema', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'expirationTime', type: 'uint64' },
        { name: 'revocable', type: 'bool' },
        { name: 'refUID', type: 'bytes32' },
        { name: 'data', type: 'bytes' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
  },
  [DelegatedProxyAttestationVersion.Version1]: {
    typedSignature:
      'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint64 deadline)',
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
        { name: 'deadline', type: 'uint64' }
      ]
    }
  },
  [DelegatedProxyAttestationVersion.Version2]: {
    typedSignature:
      // eslint-disable-next-line max-len
      'Attest(address attester,bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint64 deadline)',
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
        { name: 'deadline', type: 'uint64' }
      ]
    }
  }
};

const DELEGATED_PROXY_REVOCATION_TYPES: Record<DelegatedProxyAttestationVersion, DelegatedProxyAttestationType> = {
  [DelegatedProxyAttestationVersion.Legacy]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
  },
  [DelegatedProxyAttestationVersion.Version1]: {
    typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint64 deadline)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'value', type: 'uint256' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
  },
  [DelegatedProxyAttestationVersion.Version2]: {
    typedSignature: 'Revoke(address revoker,bytes32 schema,bytes32 uid,uint256 value,uint64 deadline)',
    primaryType: 'Revoke',
    types: {
      Revoke: [
        { name: 'revoker', type: 'address' },
        { name: 'schema', type: 'bytes32' },
        { name: 'uid', type: 'bytes32' },
        { name: 'value', type: 'uint256' },
        { name: 'deadline', type: 'uint64' }
      ]
    }
  }
};

export type EIP712AttestationProxyParams = EIP712AttestationParams & {
  deadline: bigint;
};

interface EIP712FullAttestationProxyParams extends EIP712AttestationProxyParams {
  attester: string;
}

export type EIP712RevocationProxyParams = EIP712RevocationParams & {
  deadline: bigint;
};

interface EIP712FullRevocationProxyParams extends EIP712RevocationProxyParams {
  revoker: string;
}

export class DelegatedProxy extends TypedDataHandler {
  public readonly version: DelegatedProxyAttestationVersion;
  private readonly attestType: DelegatedProxyAttestationType;
  private readonly revokeType: DelegatedProxyAttestationType;

  constructor(config: TypedDataConfig) {
    super(config);

    const fullVersion = semver.coerce(config.version);
    if (!fullVersion) {
      throw new Error(`Invalid version: ${config.version}`);
    }

    if (semver.lt(fullVersion, '1.2.0')) {
      this.version = DelegatedProxyAttestationVersion.Legacy;
    } else if (semver.lt(fullVersion, '1.3.0')) {
      this.version = DelegatedProxyAttestationVersion.Version1;
    } else {
      this.version = DelegatedProxyAttestationVersion.Version2;
    }

    this.attestType = DELEGATED_PROXY_ATTESTATION_TYPES[this.version];
    this.revokeType = DELEGATED_PROXY_REVOCATION_TYPES[this.version];
  }

  public async signDelegatedProxyAttestation(
    params: EIP712AttestationProxyParams,
    signer: TypeDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>> {
    let effectiveParams: EIP712FullAttestationProxyParams = {
      attester: await signer.getAddress(),
      ...params
    };

    if (this.version === DelegatedProxyAttestationVersion.Legacy) {
      // Committing to a value isn't supported for legacy attestations, therefore it will be ignored
      effectiveParams = omit(params, ['value']) as EIP712FullAttestationProxyParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712AttestationProxyParams>(
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

  public verifyDelegatedProxyAttestationSignature(
    attester: string,
    response: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>
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

  public async signDelegatedProxyRevocation(
    params: EIP712RevocationProxyParams,
    signer: TypeDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>> {
    let effectiveParams: EIP712FullRevocationProxyParams = {
      revoker: await signer.getAddress(),
      ...params
    };

    if (this.version === DelegatedProxyAttestationVersion.Legacy) {
      // Committing to a value isn't supported for legacy revocations, therefore it will be ignored
      effectiveParams = omit(params, ['value']) as EIP712FullRevocationProxyParams;
    }

    return this.signTypedDataRequest<EIP712MessageTypes, EIP712RevocationProxyParams>(
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

  public verifyDelegatedProxyRevocationSignature(
    revoker: string,
    response: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>
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
