import { ZERO_ADDRESS } from '../utils';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { BigNumberish, Signature, utils } from 'ethers';

const {
  getAddress,
  solidityPack,
  verifyTypedData,
  defaultAbiCoder,
  keccak256,
  hexlify,
  joinSignature,
  splitSignature
} = utils;

export interface TypedDataConfig {
  address: string;
  version: string;
  chainId: number;
}

export interface DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface TypedDataParams {
  types: string[];
  values: unknown[];
}

export interface TypedData {
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

export interface EIP712DomainTypedData {
  chainId: number;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface EIP712MessageTypes {
  [additionalProperties: string]: TypedData[];
}
export type EIP712Params = {
  nonce?: BigNumberish;
};

export interface EIP712TypedData<T extends EIP712MessageTypes> {
  domain: EIP712DomainTypedData;
  primaryType: keyof T;
  types: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
}

export interface EIP712Request extends Signature {
  params: EIP712Params;
  data: EIP712TypedData<EIP712MessageTypes>;
}

export abstract class TypedDataHandler {
  protected config: TypedDataConfig;

  public constructor(config: TypedDataConfig) {
    this.config = config;
  }

  abstract getDomainSeparator(): string;
  abstract getDomainTypedData(): DomainTypedData;
  abstract getTypedData(type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes>;

  public async signTypedDataRequest(
    type: string,
    params: EIP712Params,
    signer: TypedDataSigner
  ): Promise<EIP712Request> {
    const data = this.getTypedData(type, params);
    const rawSignature = await signer._signTypedData(data.domain, data.types, params);

    return { data, params, ...splitSignature(rawSignature) };
  }

  public async verifyTypedDataRequestSignature(attester: string, request: EIP712Request): Promise<boolean> {
    if (attester === ZERO_ADDRESS) {
      throw new Error('Invalid address');
    }

    const sig = joinSignature({ v: request.v, r: hexlify(request.r), s: hexlify(request.s) });
    const recoveredAddress = verifyTypedData(request.data.domain, request.data.types, request.params, sig);

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
