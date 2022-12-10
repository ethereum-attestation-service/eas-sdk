import { getOffchainUUID } from '../utils';
import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Request,
  TypedData,
  TypedDataConfig,
  TypedDataHandler
} from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { EIP712Request, TypedDataConfig, EIP712MessageTypes } from './typed-data-handler';
export { TypedDataSigner } from '@ethersproject/abstract-signer';

export const ATTESTATION_PRIMARY_TYPE = 'Attestation';
export const ATTESTATION_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'time', type: 'uint32' },
  { name: 'expirationTime', type: 'uint32' },
  { name: 'revocable', type: 'bool' },
  { name: 'refUUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' }
];

export const DOMAIN_NAME = 'EAS Attestation';

export type OffchainAttestationParams = {
  schema: string;
  recipient: string;
  time: number;
  expirationTime: number;
  revocable: boolean;
  refUUID: string;
  data: string;
} & Partial<EIP712Params>;

export interface SignedOffchainAttestation extends EIP712Request<EIP712MessageTypes, OffchainAttestationParams> {
  uuid: string;
}

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

  public async signOffchainAttestation(
    params: OffchainAttestationParams,
    signer: TypedDataSigner
  ): Promise<SignedOffchainAttestation> {
    const uuid = Offchain.getOffchainUUID(params);

    return {
      ...(await this.signTypedDataRequest<EIP712MessageTypes, OffchainAttestationParams>(
        params,
        {
          domain: this.getDomainTypedData(),
          primaryType: ATTESTATION_PRIMARY_TYPE,
          message: params,
          types: {
            Attest: ATTESTATION_TYPE
          }
        },
        signer
      )),
      uuid
    };
  }

  public async verifyOffchainAttestationSignature(
    attester: string,
    request: SignedOffchainAttestation
  ): Promise<boolean> {
    return (
      request.uuid === Offchain.getOffchainUUID(request.message) &&
      this.verifyTypedDataRequestSignature(attester, request)
    );
  }

  public static getOffchainUUID(params: OffchainAttestationParams): string {
    return getOffchainUUID(
      params.schema,
      params.recipient,
      params.time,
      params.expirationTime,
      params.revocable,
      params.refUUID,
      params.data
    );
  }
}
