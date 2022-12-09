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
export interface EIP712TypedData<T extends EIP712MessageTypes, P extends EIP712Params> {
    domain: EIP712DomainTypedData;
    primaryType: keyof T;
    types: T;
    message: P;
}
export type EIP712Request<T extends EIP712MessageTypes, P extends EIP712Params> = EIP712TypedData<T, P> & Signature;
export declare abstract class TypedDataHandler {
    protected config: TypedDataConfig;
    constructor(config: TypedDataConfig);
    abstract getDomainSeparator(): string;
    abstract getDomainTypedData(): DomainTypedData;
    signTypedDataRequest<T extends EIP712MessageTypes, P extends EIP712Params>(params: P, types: EIP712TypedData<T, P>, signer: TypedDataSigner): Promise<EIP712Request<T, P>>;
    verifyTypedDataRequestSignature<T extends EIP712MessageTypes, P extends EIP712Params>(attester: string, request: EIP712Request<T, P>): Promise<boolean>;
}
