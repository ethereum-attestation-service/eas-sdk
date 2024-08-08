import omit from 'lodash/omit';
import semver from 'semver';
import { EAS } from '../eas';
import {
  EIP712MessageTypes,
  EIP712Params,
  EIP712Response,
  EIP712Types,
  TypeDataSigner,
  TypedDataHandler
} from './typed-data-handler';
import { EIP712_NAME, EIP712_VERSIONS } from './versions';

export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, Signature } from './typed-data-handler';

enum DelegatedAttestationVersion {
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
      // eslint-disable-next-line max-len
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
      // eslint-disable-next-line max-len
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

interface DelegatedConfig {
  address: string;
  chainId: bigint;
  version?: string;
  domainSeparator?: string;
}

export class Delegated extends TypedDataHandler {
  public readonly version: DelegatedAttestationVersion;
  private readonly attestType: DelegatedAttestationType;
  private readonly revokeType: DelegatedAttestationType;
  private readonly eas: EAS;

  constructor(config: DelegatedConfig, eas: EAS) {
    let { version } = config;
    if (!version) {
      const { domainSeparator } = config;

      if (!domainSeparator) {
        throw new Error('Neither EIP712 version or domain separator were provided');
      }

      // If only the domain separator was provided, let's try to deduce the version accordingly.
      for (const eip712Version of EIP712_VERSIONS) {
        if (
          domainSeparator ===
          TypedDataHandler.getDomainSeparator({
            address: config.address,
            name: EIP712_NAME,
            version: eip712Version,
            chainId: config.chainId
          })
        ) {
          version = eip712Version;

          break;
        }
      }

      if (!version) {
        throw new Error(`Unable to find version for domain separator: ${domainSeparator}`);
      }
    }

    super({ ...config, version, name: EIP712_NAME });

    const fullVersion = semver.coerce(version);
    if (!fullVersion) {
      throw new Error(`Invalid version: ${version}`);
    }
    if (semver.lt(fullVersion, '1.2.0')) {
      this.version = DelegatedAttestationVersion.Legacy;
    } else if (semver.lt(fullVersion, '1.3.0')) {
      this.version = DelegatedAttestationVersion.Version1;
    } else {
      this.version = DelegatedAttestationVersion.Version2;
    }

    this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
    this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];

    this.eas = eas;
  }

  public async signDelegatedAttestation(
    params: EIP712AttestationParams,
    signer: TypeDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>> {
    let effectiveParams: EIP712FullAttestationParams = {
      attester: await signer.getAddress(),
      ...params
    };

    // If nonce wasn't provided, try retrieving it onchain.
    effectiveParams.nonce ??= await this.eas.contract.getNonce(effectiveParams.attester);

    switch (this.version) {
      case DelegatedAttestationVersion.Legacy:
        effectiveParams = omit(effectiveParams, ['value', 'deadline']) as EIP712FullAttestationParams;

        break;
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
    signer: TypeDataSigner
  ): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>> {
    let effectiveParams: EIP712FullRevocationParams = {
      revoker: await signer.getAddress(),
      ...params
    };

    // If nonce wasn't provided, try retrieving it onchain.
    effectiveParams.nonce ??= await this.eas.contract.getNonce(effectiveParams.revoker);

    switch (this.version) {
      case DelegatedAttestationVersion.Legacy:
        effectiveParams = omit(effectiveParams, ['value', 'deadline']) as EIP712FullRevocationParams;

        break;
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
