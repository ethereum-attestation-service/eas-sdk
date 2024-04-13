import { Addressable, TypedDataDomain, TypedDataField } from 'ethers';
export interface TypeDataSigner extends Addressable {
    signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
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
    type: 'bool' | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'uint128' | 'uint256' | 'address' | 'string' | 'bytes' | 'bytes32';
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
export declare const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export declare class InvalidDomain extends Error {
}
export declare class InvalidPrimaryType extends Error {
}
export declare class InvalidTypes extends Error {
}
export declare class InvalidAddress extends Error {
}
export interface TypedDataConfig {
    address: string;
    version: string;
    chainId: bigint;
    name: string;
}
export declare abstract class TypedDataHandler {
    config: TypedDataConfig;
    constructor(config: TypedDataConfig);
    getDomainSeparator(): string;
    static getDomainSeparator(config: TypedDataConfig): string;
    getDomainTypedData(): DomainTypedData;
    signTypedDataRequest<T extends EIP712MessageTypes, P extends EIP712Params>(params: P, types: EIP712TypedData<T, P>, signer: TypeDataSigner): Promise<EIP712Response<T, P>>;
    verifyTypedDataRequestSignature<T extends EIP712MessageTypes, P extends EIP712Params>(attester: string, response: EIP712Response<T, P>, types: EIP712Types<T>, strict?: boolean): boolean;
}
