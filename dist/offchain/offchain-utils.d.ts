import { SignedOffchainAttestation } from './offchain';
export interface SignedOffchainAttestationV1 extends Omit<SignedOffchainAttestation, 'signature'> {
    r: string;
    s: string;
    v: number;
}
export interface AttestationShareablePackageObject {
    /** Signed typed data with attestation object */
    sig: SignedOffchainAttestation;
    /** Address of the signer */
    signer: string;
}
export type CompactAttestationShareablePackageObject = [
    contractVersion: string,
    chainId: number,
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
    nonce: number,
    offchainVersion?: number
];
export declare function createOffchainURL(pkg: AttestationShareablePackageObject): string;
export declare function zipAndEncodeToBase64(pkg: AttestationShareablePackageObject): string;
export declare function decodeBase64ZippedBase64(base64: string): AttestationShareablePackageObject;
export declare function compactOffchainAttestationPackage(pkg: AttestationShareablePackageObject): CompactAttestationShareablePackageObject;
export declare function uncompactOffchainAttestationPackage(compacted: CompactAttestationShareablePackageObject): AttestationShareablePackageObject;
export declare function isSignedOffchainAttestationV1(attestation: SignedOffchainAttestation | SignedOffchainAttestationV1): attestation is SignedOffchainAttestationV1;
