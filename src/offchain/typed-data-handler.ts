import {
  AbiCoder,
  Addressable,
  getAddress,
  hexlify,
  keccak256,
  Signature as Sig,
  toUtf8Bytes,
  TypedDataDomain,
  TypedDataField,
  verifyTypedData
} from 'ethers';
import isEqual from 'lodash/isEqual';
import { ZERO_ADDRESS } from '../utils';

export interface TypeDataSigner extends Addressable {
  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: Record<string, any>
  ): Promise<string>;
}

export interface DomainTypedData {
  chainId: bigint;
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
  chainId: bigint;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface EIP712MessageTypes {
  [additionalProperties: string]: TypedData[];
}

export type EIP712Params = {
  nonce?: bigint;
};

export interface EIP712Types<T extends EIP712MessageTypes> {
  primaryType: string;
  types: T;
}

export interface EIP712TypedData<T extends EIP712MessageTypes, P extends EIP712Params> extends EIP712Types<T> {
  domain: EIP712DomainTypedData;
  message: P;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
}

export type EIP712Request<T extends EIP712MessageTypes, P extends EIP712Params> = EIP712TypedData<T, P>;

export type EIP712Response<T extends EIP712MessageTypes, P extends EIP712Params> = EIP712TypedData<T, P> & {
  signature: Signature;
};

export const EIP712_DOMAIN = 'EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)';

export class InvalidDomain extends Error {}
export class InvalidPrimaryType extends Error {}
export class InvalidTypes extends Error {}
export class InvalidAddress extends Error {}

export interface TypedDataConfig {
  address: string;
  version: string;
  chainId: bigint;
  name: string;
}

export abstract class TypedDataHandler {
  public config: TypedDataConfig;

  constructor(config: TypedDataConfig) {
    this.config = config;
  }

  public getDomainSeparator() {
    return TypedDataHandler.getDomainSeparator(this.config);
  }

  public static getDomainSeparator(config: TypedDataConfig) {
    return keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32', 'bytes32', 'uint256', 'address'],
        [
          keccak256(toUtf8Bytes(EIP712_DOMAIN)),
          keccak256(toUtf8Bytes(config.name)),
          keccak256(toUtf8Bytes(config.version)),
          config.chainId,
          config.address
        ]
      )
    );
  }

  public getDomainTypedData(): DomainTypedData {
    return {
      name: this.config.name,
      version: this.config.version,
      chainId: this.config.chainId,
      verifyingContract: this.config.address
    };
  }

  public async signTypedDataRequest<T extends EIP712MessageTypes, P extends EIP712Params>(
    params: P,
    types: EIP712TypedData<T, P>,
    signer: TypeDataSigner
  ): Promise<EIP712Response<T, P>> {
    const rawSignature = await signer.signTypedData(types.domain, types.types, params);
    const signature = Sig.from(rawSignature);

    return { ...types, signature: { v: signature.v, r: signature.r, s: signature.s } };
  }

  public verifyTypedDataRequestSignature<T extends EIP712MessageTypes, P extends EIP712Params>(
    attester: string,
    response: EIP712Response<T, P>,
    types: EIP712Types<T>,
    strict = true
  ): boolean {
    // Normalize the chain ID
    const domain: EIP712DomainTypedData = { ...response.domain, chainId: BigInt(response.domain.chainId) };

    let expectedDomain = this.getDomainTypedData();
    if (!strict) {
      expectedDomain = { ...expectedDomain, version: domain.version };
    }

    if (!isEqual(domain, expectedDomain)) {
      throw new InvalidDomain();
    }

    if (response.primaryType !== types.primaryType) {
      throw new InvalidPrimaryType();
    }

    if (!isEqual(response.types, types.types)) {
      throw new InvalidTypes();
    }

    if (attester === ZERO_ADDRESS) {
      throw new InvalidAddress();
    }

    const { signature } = response;
    const sig = Sig.from({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) }).serialized;
    const recoveredAddress = verifyTypedData(domain, response.types, response.message, sig);

    return getAddress(attester) === getAddress(recoveredAddress);
  }
}
