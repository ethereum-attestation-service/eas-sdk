/// <reference types="node" />
import { BigNumberish } from "ethers";
export declare const ATTEST_TYPED_SIGNATURE = "Attest(address recipient,bytes32 schema,uint32 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export declare const REVOKE_TYPED_SIGNATURE = "Revoke(bytes32 uuid,uint256 nonce)";
export declare const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export declare const EIP712_NAME = "EAS";
export interface EIP712Config {
    address: string;
    version: string;
    chainId: number;
}
export declare type EIP712Params = {
    nonce: BigNumberish;
};
export declare type EIP712AttestationParams = EIP712Params & {
    recipient: string;
    schema: string;
    expirationTime: BigNumberish;
    refUUID: string;
    data: Buffer;
};
export declare type EIP712RevocationParams = EIP712Params & {
    uuid: string;
};
export interface EIP712Request {
    v: number;
    r: Buffer;
    s: Buffer;
}
export interface EIP712AttestationRequest extends EIP712Request {
    params: EIP712AttestationParams;
}
export interface EIP712RevocationRequest extends EIP712Request {
    params: EIP712RevocationParams;
}
export declare type Signature = {
    v: number;
    r: Buffer;
    s: Buffer;
};
export declare type SignData = (message: Buffer) => Promise<Signature>;
export declare type VerifyData = (message: Buffer, signature: Signature) => Promise<string>;
export interface TypedData {
    name: string;
    type: "bool" | "uint8" | "uint16" | "uint32" | "uint64" | "uint128" | "uint256" | "address" | "string" | "bytes" | "bytes32";
}
export declare const ATTEST_PRIMARY_TYPE = "Attest";
export declare const REVOKE_PRIMARY_TYPE = "Revoke";
export declare const DOMAIN_TYPE: TypedData[];
export declare const ATTEST_TYPE: TypedData[];
export declare const REVOKE_TYPE: TypedData[];
export interface EIP712DomainTypedData {
    chainId: number;
    name: string;
    verifyingContract: string;
    version: string;
}
export interface EIP712MessageTypes {
    EIP712Domain: TypedData[];
    [additionalProperties: string]: TypedData[];
}
export interface EIP712TypedData<T extends EIP712MessageTypes> {
    domain: EIP712DomainTypedData;
    primaryType: keyof T;
    types: T;
    message: any;
}
export interface EIP712AttestationMessageTypes extends EIP712MessageTypes {
    Attest: typeof ATTEST_TYPE;
}
export interface EIP712AttestationTypedData extends EIP712TypedData<EIP712AttestationMessageTypes> {
    message: EIP712AttestationParams;
}
export interface EIP712RevocationMessageTypes extends EIP712MessageTypes {
    Revoke: typeof REVOKE_TYPE;
}
export interface EIP712RevocationTypedData extends EIP712TypedData<EIP712RevocationMessageTypes> {
    message: EIP712RevocationParams;
}
export interface EIP712AttestationTypedDataRequest extends EIP712Request {
    data: EIP712AttestationTypedData;
}
export interface EIP712RevocationTypedDataRequest extends EIP712Request {
    data: EIP712RevocationTypedData;
}
export declare type SignTypedData<T extends EIP712MessageTypes> = (data: EIP712TypedData<T>) => Promise<Signature>;
export declare type VerifyTypedData<T extends EIP712MessageTypes> = (data: EIP712TypedData<T>, signature: Signature) => Promise<string>;
export declare class Delegation {
    private eip712Config;
    constructor(eip712Config: EIP712Config);
    getDomainSeparator(): string;
    getDomainTypedData(): EIP712DomainTypedData;
    getAttestationRequest(params: EIP712AttestationParams, signData: SignData): Promise<EIP712AttestationRequest>;
    verifyAttestationRequest(attester: string, request: EIP712AttestationRequest, verifyData: VerifyData): Promise<boolean>;
    getAttestationTypedDataRequest(params: EIP712AttestationParams, signTypedData: SignTypedData<EIP712AttestationMessageTypes>): Promise<EIP712AttestationTypedDataRequest>;
    verifyAttestationTypedDataRequest(attester: string, request: EIP712AttestationTypedDataRequest, verifyTypedData: VerifyTypedData<EIP712AttestationMessageTypes>): Promise<boolean>;
    getRevocationRequest(params: EIP712RevocationParams, signData: SignData): Promise<EIP712RevocationRequest>;
    verifyRevocationRequest(attester: string, request: EIP712RevocationRequest, verifyData: VerifyData): Promise<boolean>;
    getRevocationTypedDataRequest(params: EIP712RevocationParams, signTypedData: SignTypedData<EIP712RevocationMessageTypes>): Promise<EIP712RevocationTypedDataRequest>;
    verifyRevocationTypedDataRequest(attester: string, request: EIP712RevocationTypedDataRequest, verifyTypedData: VerifyTypedData<EIP712RevocationMessageTypes>): Promise<boolean>;
    private getAttestationDigest;
    private getRevocationDigest;
    private getAttestationTypedData;
    private getRevocationTypedData;
}
