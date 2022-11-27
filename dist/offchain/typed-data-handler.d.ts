import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { BigNumberish, Signature } from 'ethers';
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
    type: 'bool' | 'uint8' | 'uint16' | 'uint32' | 'uint64' | 'uint128' | 'uint256' | 'address' | 'string' | 'bytes' | 'bytes32';
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
    message: any;
}
export interface EIP712Request extends Signature {
    params: EIP712Params;
    data: EIP712TypedData<EIP712MessageTypes>;
}
export declare abstract class TypedDataHandler {
    protected config: TypedDataConfig;
    constructor(config: TypedDataConfig);
    abstract getDomainSeparator(): string;
    abstract getDomainTypedData(): DomainTypedData;
    abstract getTypedData(type: string, params: EIP712Params): EIP712TypedData<EIP712MessageTypes>;
    signTypedDataRequest(type: string, params: EIP712Params, signer: TypedDataSigner): Promise<EIP712Request>;
    verifyTypedDataRequestSignature(attester: string, request: EIP712Request): Promise<boolean>;
    protected getDigest(params: TypedDataParams): string;
}
