import { BaseWallet } from 'ethers';
import { EIP712MessageTypes, EIP712Params, EIP712Response, PartialTypedDataConfig, TypedData, TypedDataHandler } from './typed-data-handler';
export { EIP712MessageTypes, EIP712TypedData, EIP712Request, EIP712Response, PartialTypedDataConfig } from './typed-data-handler';
export declare const EIP712_NAME = "EAS";
export declare const ATTEST_TYPED_SIGNATURE = "Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)";
export declare const REVOKE_TYPED_SIGNATURE = "Revoke(bytes32 schema,bytes32 uid,uint256 nonce)";
export declare const ATTEST_PRIMARY_TYPE = "Attest";
export declare const REVOKE_PRIMARY_TYPE = "Revoke";
export declare const ATTEST_TYPE: TypedData[];
export declare const REVOKE_TYPE: TypedData[];
export type EIP712AttestationParams = EIP712Params & {
    schema: string;
    recipient: string;
    expirationTime: bigint;
    revocable: boolean;
    refUID: string;
    data: string;
};
export type EIP712RevocationParams = EIP712Params & {
    schema: string;
    uid: string;
};
export declare class Delegated extends TypedDataHandler {
    constructor(config: PartialTypedDataConfig);
    signDelegatedAttestation(params: EIP712AttestationParams, signer: BaseWallet): Promise<EIP712Response<EIP712MessageTypes, EIP712AttestationParams>>;
    verifyDelegatedAttestationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>): boolean;
    signDelegatedRevocation(params: EIP712RevocationParams, signer: BaseWallet): Promise<EIP712Response<EIP712MessageTypes, EIP712RevocationParams>>;
    verifyDelegatedRevocationSignature(attester: string, response: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>): boolean;
}
