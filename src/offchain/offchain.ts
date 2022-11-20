import {
  DomainTypedData,
  EIP712MessageTypes,
  EIP712Params,
  EIP712TypedData,
  Signature,
  SignData,
  TypedDataConfig,
  TypedDataSigner,
  VerifyData
} from './typed-data-signer';
import { utils } from 'ethers';

const { keccak256, toUtf8Bytes, defaultAbiCoder } = utils;

export { Signature } from './typed-data-signer';

export const NAME = 'EAS Attestation';

export type OffchainAttestationParams = {
  time: number;
  uuid: string;
  recipient: string;
  schema: string;
  expirationTime: number;
  refUUID: string;
  data: Buffer;
};

export class Offchain extends TypedDataSigner {
  public constructor(config: TypedDataConfig) {
    super(config);
  }

  public getDomainSeparator() {
    return keccak256(
      defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes(NAME)),
          keccak256(toUtf8Bytes(this.config.version)),
          this.config.chainId,
          this.config.address
        ]
      )
    );
  }

  public getDomainTypedData(): DomainTypedData {
    return {
      name: NAME,
      version: this.config.version,
      chainId: this.config.chainId,
      verifyingContract: this.config.address
    };
  }

  public async signOffchainAttestation(params: OffchainAttestationParams, signData: SignData): Promise<Signature> {
    return this.signTypedData(Offchain.getOffchainAttestationTypedParams(params), signData);
  }

  public async verifyOffchainAttestationSignature(
    attester: string,
    params: OffchainAttestationParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    return this.verifyTypedDataSignature(
      attester,
      Offchain.getOffchainAttestationTypedParams(params),
      signature,
      verifyData
    );
  }

  public getTypedData(_type: string, _params: EIP712Params): EIP712TypedData<EIP712MessageTypes> {
    throw new Error('Unsupported typed data');
  }

  private static getOffchainAttestationTypedParams(params: OffchainAttestationParams) {
    return {
      types: ['uint32', 'bytes32', 'address', 'bytes32', 'uint32', 'bytes32', 'bytes32'],
      values: [
        params.time,
        params.uuid,
        params.recipient,
        params.schema,
        params.expirationTime,
        params.refUUID,
        keccak256(params.data)
      ]
    };
  }
}
