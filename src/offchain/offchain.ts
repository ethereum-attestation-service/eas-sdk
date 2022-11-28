import { getOffchainUUID } from '../utils';
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
  { name: 'schema', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'time', type: 'uint32' },
  { name: 'expirationTime', type: 'uint32' },
  { name: 'revocable', type: 'bool' },
  { name: 'refUUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' }
];

export const DOMAIN_NAME = 'EAS Attestation';

export interface SignedOffchainAttestation extends EIP712Request {
  uuid: string;
}

export type OffchainAttestationParams = {
  schema: string;
  recipient: string;
  time: number;
  expirationTime: number;
  revocable: boolean;
  refUUID: string;
  data: string;
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
  ): Promise<SignedOffchainAttestation> {
    const uuid = getOffchainUUID(
      params.schema,
      params.recipient,
      params.time,
      params.expirationTime,
      params.revocable,
      params.refUUID,
      params.data
    );

    return { ...(await this.signTypedDataRequest(ATTESTATION_PRIMARY_TYPE, params, signer)), uuid };
  }

  public async verifyOffchainAttestationSignature(
    attester: string,
    request: SignedOffchainAttestation
  ): Promise<boolean> {
    return this.verifyTypedDataRequestSignature(attester, request);
  }
}
