import { getOffchainUID } from '../utils';
import { EIP712_NAME } from './delegated';
import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712Response,
  PartialTypedDataConfig,
  TypedData,
  TypedDataHandler
} from './typed-data-handler';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { BigNumberish, utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { EIP712Request, PartialTypedDataConfig, EIP712MessageTypes } from './typed-data-handler';
export { TypedDataSigner } from '@ethersproject/abstract-signer';

export const ATTESTATION_PRIMARY_TYPE = 'Attestation';
export const ATTESTATION_TYPE: TypedData[] = [
  { name: 'schema', type: 'bytes32' },
  { name: 'recipient', type: 'address' },
  { name: 'time', type: 'uint64' },
  { name: 'expirationTime', type: 'uint64' },
  { name: 'revocable', type: 'bool' },
  { name: 'refUID', type: 'bytes32' },
  { name: 'data', type: 'bytes' }
];

export const DOMAIN_NAME = 'EAS Attestation';

export type OffchainAttestationParams = {
  schema: string;
  recipient: string;
  time: BigNumberish;
  expirationTime: BigNumberish;
  revocable: boolean;
  refUID: string;
  data: string;
} & Partial<EIP712Params>;

export interface SignedOffchainAttestation extends EIP712Response<EIP712MessageTypes, OffchainAttestationParams> {
  uid: string;
}

export class Offchain extends TypedDataHandler {
  public constructor(config: PartialTypedDataConfig) {
    super({ ...config, name: EIP712_NAME });
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
    const uid = Offchain.getOffchainUID(params);

    const signedRequest = await this.signTypedDataRequest<EIP712MessageTypes, OffchainAttestationParams>(
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
    );

    return {
      ...signedRequest,
      uid
    };
  }

  public verifyOffchainAttestationSignature(attester: string, request: SignedOffchainAttestation): boolean {
    return (
      request.uid === Offchain.getOffchainUID(request.message) &&
      this.verifyTypedDataRequestSignature(attester, request)
    );
  }

  public static getOffchainUID(params: OffchainAttestationParams): string {
    return getOffchainUID(
      params.schema,
      params.recipient,
      params.time,
      params.expirationTime,
      params.revocable,
      params.refUID,
      params.data
    );
  }
}
