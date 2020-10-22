/// <reference types="node" />
export declare const ATTEST_TYPED_SIGNATURE = "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export declare const REVOKE_TYPED_SIGNATURE = "Revoke(byte32 uuid,uint256 nonce)";
export declare const EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
export declare const EIP712_NAME = "EAS";
export interface EIP712Config {
    address: string;
    version: string;
    chainId: number;
}
export interface EIP712Params {
    nonce: number;
}
export interface EIP712AttestationParams extends EIP712Params {
    recipient: string;
    ao: number;
    expirationTime: number;
    refUUID: string;
    data: Buffer;
}
export interface EIP712RevocationParams extends EIP712Params {
    uuid: string;
}
export interface EIP712Request {
    v: number;
    r: string;
    s: string;
    digest: string;
}
export interface EIP712AttestationRequest extends EIP712Request {
    params: EIP712AttestationParams;
}
export interface EIP712RevocationRequest extends EIP712Request {
    params: EIP712RevocationParams;
}
export declare type Signature = {
    v: number;
    r: string;
    s: string;
};
export declare type SignMessage = (message: Buffer) => Promise<Signature>;
export declare type VerifyMessage = (message: Buffer, signature: Signature) => Promise<string>;
export interface Attribute {
    name: string;
    type: "bool" | "uint8" | "uint16" | "uint32" | "uint64" | "uint128" | "uint256" | "address" | "string" | "bytes" | "bytes32";
}
export declare const ATTEST_PRIMARY_TYPE = "Attest";
export declare const REVOKE_PRIMARY_TYPE = "Revoke";
export declare const DOMAIN_TYPE: Attribute[];
export declare const ATTEST_TYPE: Attribute[];
export declare const REVOKE_TYPE: Attribute[];
export interface EIP712DomainTypedData {
    chainId: number;
    name: string;
    verifyingContract: string;
    version: string;
}
export interface EIP712AttestationTypedData {
    domain: EIP712DomainTypedData;
    primaryType: typeof ATTEST_PRIMARY_TYPE;
    types: {
        EIP712Domain: typeof DOMAIN_TYPE;
        Attest: typeof ATTEST_TYPE;
    };
    message: EIP712AttestationParams;
}
export interface EIP712RevocationTypedData {
    domain: EIP712DomainTypedData;
    primaryType: typeof REVOKE_PRIMARY_TYPE;
    types: {
        EIP712Domain: typeof DOMAIN_TYPE;
        Revoke: typeof REVOKE_TYPE;
    };
    message: EIP712RevocationParams;
}
export declare class Proxy {
    private eip712Config;
    constructor(eip712Config: EIP712Config);
    getDomainSeparator(): string;
    getDomainTypedData(): EIP712DomainTypedData;
    getAttestationRequest(params: EIP712AttestationParams, signMessage: SignMessage): Promise<EIP712AttestationRequest>;
    verifyAttestationRequest(attester: string, params: EIP712AttestationRequest, verifyMessage: VerifyMessage): Promise<boolean>;
    getAttestationTypedData(params: EIP712AttestationParams): EIP712AttestationTypedData;
    getRevocationRequest(params: EIP712RevocationParams, signMessage: SignMessage): Promise<EIP712RevocationRequest>;
    verifyRevocationRequest(attester: string, params: EIP712RevocationRequest, verifyMessage: VerifyMessage): Promise<boolean>;
    getRevocationTypedData(params: EIP712RevocationParams): EIP712RevocationTypedData;
    private getAttestationDigest;
    private getRevocationDigest;
}
