/// <reference types="node" />
export declare const ATTEST_TYPE = "Attest(address recipient,uint256 ao,uint256 expirationTime,bytes32 refUUID,bytes data,uint256 nonce)";
export declare const REVOKE_TYPE = "Revoke(byte32 uuid,uint256 nonce)";
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
    data: string;
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
export declare class Proxy {
    private eip712Config;
    constructor(eip712Config: EIP712Config);
    getDomainSeparator(): string;
    getAttestationRequest(params: EIP712AttestationParams, signMessage: SignMessage): Promise<EIP712AttestationRequest>;
    verifyAttestationRequest(attester: string, params: EIP712AttestationRequest, verifyMessage: VerifyMessage): Promise<boolean>;
    getRevocationRequest(params: EIP712RevocationParams, signMessage: SignMessage): Promise<EIP712RevocationRequest>;
    verifyRevocationRequest(attester: string, params: EIP712RevocationRequest, verifyMessage: VerifyMessage): Promise<boolean>;
    private getAttestationDigest;
    private getRevocationDigest;
}
