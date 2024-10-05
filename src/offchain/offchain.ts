import { AbiCoder, hexlify, keccak256, randomBytes, solidityPackedKeccak256, toUtf8Bytes } from 'ethers';
import { EAS } from '../eas';
import { ZERO_ADDRESS, ZERO_BYTES32 } from '../utils';
import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Response,
  EIP712Types,
  InvalidPrimaryType,
  InvalidTypes,
  TypeDataSigner,
  TypedDataHandler
} from './typed-data-handler';
import { EIP712_NAME } from './versions';

export { EIP712Request, EIP712MessageTypes } from './typed-data-handler';

export interface OffchainAttestationType extends EIP712Types<EIP712MessageTypes> {
  domain: string;
}

export enum OffchainAttestationVersion {
  Legacy = 0,
  Version1 = 1,
  Version2 = 2
}

export const OFFCHAIN_ATTESTATION_TYPES: Record<OffchainAttestationVersion, OffchainAttestationType[]> = {
  [OffchainAttestationVersion.Legacy]: [
    {
      domain: 'EAS Attestation',
      primaryType: 'Attestation',
      types: {
        Attestation: [
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocable', type: 'bool' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'data', type: 'bytes' }
        ]
      }
    },
    {
      domain: 'EAS Attestation',
      primaryType: 'Attestation',
      types: {
        Attest: [
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocable', type: 'bool' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'data', type: 'bytes' }
        ]
      }
    },
    {
      domain: 'EAS Attestation',
      primaryType: 'Attest',
      types: {
        Attest: [
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocable', type: 'bool' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'data', type: 'bytes' }
        ]
      }
    }
  ],
  [OffchainAttestationVersion.Version1]: [
    {
      domain: 'EAS Attestation',
      primaryType: 'Attest',
      types: {
        Attest: [
          { name: 'version', type: 'uint16' },
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocable', type: 'bool' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'data', type: 'bytes' }
        ]
      }
    }
  ],
  [OffchainAttestationVersion.Version2]: [
    {
      domain: 'EAS Attestation',
      primaryType: 'Attest',
      types: {
        Attest: [
          { name: 'version', type: 'uint16' },
          { name: 'schema', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocable', type: 'bool' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'data', type: 'bytes' },
          { name: 'salt', type: 'bytes32' }
        ]
      }
    }
  ]
};

export type OffchainAttestationParams = {
  schema: string;
  recipient: string;
  time: bigint;
  expirationTime: bigint;
  revocable: boolean;
  refUID: string;
  data: string;
  salt?: string;
} & Partial<EIP712Params>;

export type OffchainAttestationTypedData = OffchainAttestationParams & { version: OffchainAttestationVersion };

export type OffchainAttestationOptions = {
  salt?: string;
  verifyOnchain: boolean;
};

const DEFAULT_OFFCHAIN_ATTESTATION_OPTIONS: OffchainAttestationOptions = {
  verifyOnchain: false
};

export interface SignedOffchainAttestation extends EIP712Response<EIP712MessageTypes, OffchainAttestationTypedData> {
  version: OffchainAttestationVersion;
  uid: string;
}

export const SALT_SIZE = 32;

export interface OffchainConfig {
  address: string;
  version: string;
  chainId: bigint;
}

export class Offchain extends TypedDataHandler {
  public readonly version: OffchainAttestationVersion;
  protected signingType: OffchainAttestationType;
  protected readonly verificationTypes: OffchainAttestationType[];
  private readonly eas: EAS;

  constructor(config: OffchainConfig, version: OffchainAttestationVersion, eas: EAS) {
    if (version > OffchainAttestationVersion.Version2) {
      throw new Error('Unsupported version');
    }

    super({ ...config, name: EIP712_NAME });

    this.version = version;
    this.verificationTypes = OFFCHAIN_ATTESTATION_TYPES[this.version];
    this.signingType = this.verificationTypes[0];

    this.eas = eas;
  }

  public getDomainSeparator() {
    return keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes(this.signingType.domain)),
          keccak256(toUtf8Bytes(this.config.version)),
          this.config.chainId,
          this.config.address
        ]
      )
    );
  }

  public getDomainTypedData(): DomainTypedData {
    return {
      name: this.signingType.domain,
      version: this.config.version,
      chainId: this.config.chainId,
      verifyingContract: this.config.address
    };
  }

  public async signOffchainAttestation(
    params: OffchainAttestationParams,
    signer: TypeDataSigner,
    options?: OffchainAttestationOptions
  ): Promise<SignedOffchainAttestation> {
    const typedData = { version: this.version, ...params };

    // If no salt was provided - generate a random salt.
    if (this.version >= OffchainAttestationVersion.Version2 && !typedData.salt) {
      typedData.salt = hexlify(randomBytes(SALT_SIZE));
    }

    const signedRequest = await this.signTypedDataRequest<EIP712MessageTypes, OffchainAttestationTypedData>(
      typedData,
      {
        domain: this.getDomainTypedData(),
        primaryType: this.signingType.primaryType,
        message: typedData,
        types: this.signingType.types
      },
      signer
    );

    const { verifyOnchain } = { ...DEFAULT_OFFCHAIN_ATTESTATION_OPTIONS, ...options };
    if (verifyOnchain) {
      try {
        const { schema, recipient, expirationTime, revocable, data } = params;

        // Verify the offchain attestation onchain by simulating a contract call to attest. Since onchain verification
        // makes sure that any referenced attestations exist, we will set refUID to ZERO_BYTES32.
        await this.eas.contract.attest.staticCall(
          {
            schema,
            data: { recipient, expirationTime, revocable, refUID: params.refUID || ZERO_BYTES32, data, value: 0 }
          },
          { from: signer }
        );
      } catch (e: unknown) {
        throw new Error(`Unable to verify offchain attestation with: ${e}`);
      }
    }

    return {
      version: this.version,
      uid: this.getOffchainUID(typedData),
      ...signedRequest
    };
  }

  public verifyOffchainAttestationSignature(attester: string, attestation: SignedOffchainAttestation): boolean {
    const {
      message: { schema, recipient, time, expirationTime, revocable, refUID, data, salt }
    } = attestation;
    if (
      attestation.uid !==
      Offchain.getOffchainUID(this.version, schema, recipient, time, expirationTime, revocable, refUID, data, salt)
    ) {
      return false;
    }

    const typeCount = this.verificationTypes.length;
    return this.verificationTypes.some((type, index) => {
      try {
        return this.verifyTypedDataRequestSignature(
          attester,
          attestation,
          {
            primaryType: type.primaryType,
            types: type.types
          },
          false
        );
      } catch (e) {
        if (index !== typeCount - 1 && (e instanceof InvalidPrimaryType || e instanceof InvalidTypes)) {
          return false;
        }

        throw e;
      }
    });
  }

  private getOffchainUID(params: OffchainAttestationParams): string {
    return Offchain.getOffchainUID(
      this.version,
      params.schema,
      params.recipient,
      params.time,
      params.expirationTime,
      params.revocable,
      params.refUID,
      params.data,
      params.salt
    );
  }

  // public static getOffchainAttestationUID(version: OffchainAttestationVersion, attestation: SignedOffchainAttestation): string {
  //   return Offchain.getOffchainUID(
  //     version,
  //     attestation.message.schema,
  //     attestation.message.recipient,
  //     attestation.message.time,
  //     attestation.message.expirationTime,
  //     attestation.message.revocable,
  //     attestation.message.refUID,
  //     attestation.message.data,
  //     attestation.message.salt
  //   );
  // }

  public static getOffchainUID(
    version: number,
    schema: string,
    recipient: string,
    time: bigint,
    expirationTime: bigint,
    revocable: boolean,
    refUID: string,
    data: string,
    salt?: string
  ) {
    switch (version) {
      case OffchainAttestationVersion.Legacy:
        return solidityPackedKeccak256(
          ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
          [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]
        );

      case OffchainAttestationVersion.Version1:
        return solidityPackedKeccak256(
          ['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
          [
            version,
            hexlify(toUtf8Bytes(schema)),
            recipient,
            ZERO_ADDRESS,
            time,
            expirationTime,
            revocable,
            refUID,
            data,
            0
          ]
        );

      case OffchainAttestationVersion.Version2:
        return solidityPackedKeccak256(
          [
            'uint16',
            'bytes',
            'address',
            'address',
            'uint64',
            'uint64',
            'bool',
            'bytes32',
            'bytes',
            'bytes32',
            'uint32'
          ],
          [
            version,
            hexlify(toUtf8Bytes(schema)),
            recipient,
            ZERO_ADDRESS,
            time,
            expirationTime,
            revocable,
            refUID,
            data,
            salt,
            0
          ]
        );

      default:
        throw new Error('Unsupported version');
    }
  }
}
