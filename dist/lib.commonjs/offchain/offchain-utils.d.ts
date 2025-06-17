import { SignedOffchainAttestation } from './offchain';
export interface SignedOffchainAttestationV1 extends Omit<SignedOffchainAttestation, 'signature' | 'version'> {
    r: string;
    s: string;
    v: number;
}
export interface AttestationShareablePackageObject {
    sig: SignedOffchainAttestation;
    signer: string;
}
export type CompactAttestationShareablePackageObject = [
    contractVersion: string,
    chainId: bigint,
    verifyingContract: string,
    r: string,
    s: string,
    v: number,
    signer: string,
    uid: string,
    schema: string,
    recipient: string,
    time: number,
    expirationTime: number,
    refUID: string,
    revocable: boolean,
    data: string,
    reserved: number,
    offchainVersion?: number,
    salt?: string
];
export declare const createOffchainURL: (pkg: AttestationShareablePackageObject) => string;
export declare const zipAndEncodeToBase64: (pkg: AttestationShareablePackageObject) => string;
export declare const decodeBase64ZippedBase64: (base64: string) => AttestationShareablePackageObject;
export declare const compactOffchainAttestationPackage: (pkg: AttestationShareablePackageObject) => CompactAttestationShareablePackageObject;
export declare const uncompactOffchainAttestationPackage: (compacted: CompactAttestationShareablePackageObject) => AttestationShareablePackageObject;
export declare const isSignedOffchainAttestationV1: (attestation: SignedOffchainAttestation | SignedOffchainAttestationV1) => attestation is SignedOffchainAttestationV1;
