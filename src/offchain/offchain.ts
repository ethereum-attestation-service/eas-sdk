import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Request,
  EIP712TypedData,
  TypedData,
  TypedDataConfig,
  TypedDataHandler
} from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { EIP712Request } from './typed-data-handler';

export const ATTESTATION_PRIMARY_TYPE = 'Attestation';
export const ATTESTATION_TYPE: TypedData[] = [
  { name: 'time', type: 'uint32' },
  { name: 'uuid', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'schema', type: 'bytes32' },
  { name: 'expirationTime', type: 'uint32' },
  { name: 'refUUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' }
];

export const DOMAIN_NAME = 'EAS Attestation';

export type OffchainAttestationParams = {
  time: number;
  uuid: string;
  recipient: string;
  schema: string;
  expirationTime: number;
  refUUID: string;
  data: Buffer;
} & Partial<EIP712Params>;

export class Offchain extends TypedDataHandler {
  public constructor(config: TypedDataConfig) {
    super(config);
  }

  public getDomainSeparator() {
    return keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes(DOMAIN_NAME)),
          keccak256(toUtf8Bytes(this.config.version)),
          this.config.chainId,
          this.config.address
        ]
      )
    );
  }

  public getDomainTypedData(): DomainTypedData {
    return {
      name: DOMAIN_NAME,
      version: this.config.version,
      chainId: this.config.chainId,
      verifyingContract: this.config.address
    };
  }

  public getTypedData(_type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes> {
    return {
      domain: this.getDomainTypedData(),
      primaryType: ATTESTATION_PRIMARY_TYPE,
      message: params,
      types: {
        Attest: ATTESTATION_TYPE
      }
    };
  }

  public async signOffchainAttestation(
    params: OffchainAttestationParams,
    signer: TypedDataSigner
  ): Promise<EIP712Request> {
    return this.signTypedDataRequest(ATTESTATION_PRIMARY_TYPE, params, signer);
  }

  public async verifyOffchainAttestationSignature(attester: string, request: EIP712Request): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request);
  }
}
