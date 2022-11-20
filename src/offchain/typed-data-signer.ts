import { ZERO_ADDRESS } from '../utils';
import { utils } from 'ethers';

const { getAddress, solidityPack, defaultAbiCoder, keccak256 } = utils;

export interface TypedDataConfig {
  address: string;
  version: string;
  chainId: number;
}

export type Signature = { v: number; r: Buffer; s: Buffer };
export type SignData = (message: Buffer) => Promise<Signature>;
export type VerifyData = (message: Buffer, signature: Signature) => Promise<string>;

export interface Data {
  name: string;
  type:
    | 'bool'
    | 'uint8'
    | 'uint16'
    | 'uint32'
    | 'uint64'
    | 'uint128'
    | 'uint256'
    | 'address'
    | 'string'
    | 'bytes'
    | 'bytes32';
}

export const DOMAIN_TYPE: Data[] = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' }
];

export interface DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface MessageTypes {
  EIP712Domain: Data[];
  [additionalProperties: string]: Data[];
}

export interface TypedData<T extends MessageTypes> {
  domain: DomainTypedData;
  primaryType: keyof T;
  types: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
}

export interface TypedDataParams {
  types: string[];
  values: unknown[];
}

export type SignTypedData<T extends MessageTypes> = (data: TypedData<T>) => Promise<Signature>;
export type VerifyTypedData<T extends MessageTypes> = (data: TypedData<T>, signature: Signature) => Promise<string>;

export abstract class TypedDataSigner {
  protected config: TypedDataConfig;

  public constructor(config: TypedDataConfig) {
    this.config = config;
  }

  abstract getDomainSeparator(): string;
  abstract getDomainTypedData(): DomainTypedData;

  public async getTypedDataSignature(params: TypedDataParams, signData: SignData): Promise<Signature> {
    const digest = this.getDigest(params);
    const { v, r, s } = await signData(Buffer.from(digest.slice(2), 'hex'));

    return { v, r, s };
  }

  public async verifyTypedDataSignature(
    attester: string,
    params: TypedDataParams,
    signature: Signature,
    verifyData: VerifyData
  ): Promise<boolean> {
    if (attester === ZERO_ADDRESS) {
      throw new Error('Invalid address');
    }
    const digest = this.getDigest(params);
    const recoveredAddress = await verifyData(Buffer.from(digest.slice(2), 'hex'), signature);

    return getAddress(attester) === getAddress(recoveredAddress);
  }

  protected getDigest(params: TypedDataParams): string {
    return keccak256(
      solidityPack(
        ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
        ['0x19', '0x01', this.getDomainSeparator(), keccak256(defaultAbiCoder.encode(params.types, params.values))]
      )
    );
  }
}
