import { ZeroAddress, ZeroHash } from 'ethers';
import * as Base64 from 'js-base64';
import pako from 'pako';
import { EIP712MessageTypes, OffChainAttestationVersion, SignedOffchainAttestation } from './offchain';

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
  nonce: number,
  offchainVersion?: OffChainAttestationVersion
];

export const createOffchainURL = (pkg: AttestationShareablePackageObject) => {
  const base64 = zipAndEncodeToBase64(pkg);
  return `/offchain/url/#attestation=${encodeURIComponent(base64)}`;
};

export const zipAndEncodeToBase64 = (pkg: AttestationShareablePackageObject) => {
  const compacted = compactOffchainAttestationPackage(pkg);

  const jsoned = JSON.stringify(compacted, (_, value) => (typeof value === 'bigint' ? value.toString() : value));

  const gzipped = pako.deflate(jsoned, { level: 9 });
  return Base64.fromUint8Array(gzipped);
};

export const decodeBase64ZippedBase64 = (base64: string): AttestationShareablePackageObject => {
  const fromBase64 = Base64.toUint8Array(base64);

  const jsonStr = pako.inflate(fromBase64, { to: 'string' });

  const compacted: CompactAttestationShareablePackageObject = JSON.parse(jsonStr);

  return uncompactOffchainAttestationPackage(compacted);
};

export const compactOffchainAttestationPackage = (
  pkg: AttestationShareablePackageObject
): CompactAttestationShareablePackageObject => {
  const signer = pkg.signer;
  let sig = pkg.sig;

  if (isSignedOffchainAttestationV1(sig)) {
    sig = convertV1AttestationToV2(sig);
  }

  return [
    sig.domain.version,
    sig.domain.chainId,
    sig.domain.verifyingContract,
    sig.signature.r,
    sig.signature.s,
    sig.signature.v,
    signer,
    sig.uid,
    sig.message.schema,
    sig.message.recipient === ZeroAddress ? '0' : sig.message.recipient,
    Number(sig.message.time),
    Number(sig.message.expirationTime),
    sig.message.refUID === ZeroHash ? '0' : sig.message.refUID,
    sig.message.revocable,
    sig.message.data,
    Number(sig.message.nonce),
    sig.message.version
  ];
};

export const uncompactOffchainAttestationPackage = (
  compacted: CompactAttestationShareablePackageObject
): AttestationShareablePackageObject => {
  const version = compacted[16] ? compacted[16] : 0;

  const attestTypes: EIP712MessageTypes = {
    Attest: [
      {
        name: 'schema',
        type: 'bytes32'
      },
      {
        name: 'recipient',
        type: 'address'
      },
      {
        name: 'time',
        type: 'uint64'
      },
      {
        name: 'expirationTime',
        type: 'uint64'
      },
      {
        name: 'revocable',
        type: 'bool'
      },
      {
        name: 'refUID',
        type: 'bytes32'
      },
      {
        name: 'data',
        type: 'bytes'
      }
    ]
  };

  if (version >= OffChainAttestationVersion.Version1) {
    attestTypes.Attest.unshift({
      name: 'version',
      type: 'uint16'
    });
  }

  return {
    sig: {
      domain: {
        name: 'EAS Attestation',
        version: compacted[0],
        chainId: BigInt(compacted[1]),
        verifyingContract: compacted[2]
      },
      primaryType: version === OffChainAttestationVersion.Legacy ? 'Attestation' : 'Attest',
      types: attestTypes,
      signature: {
        r: compacted[3],
        s: compacted[4],
        v: compacted[5]
      },
      uid: compacted[7],
      message: {
        version,
        schema: compacted[8],
        recipient: compacted[9] === '0' ? ZeroAddress : compacted[9],
        time: BigInt(compacted[10]),
        expirationTime: BigInt(compacted[11]),
        refUID: compacted[12] === '0' ? ZeroHash : compacted[12],
        revocable: compacted[13],
        data: compacted[14],
        nonce: BigInt(compacted[15])
      }
    },
    signer: compacted[6]
  };
};

export const isSignedOffchainAttestationV1 = (
  attestation: SignedOffchainAttestation | SignedOffchainAttestationV1
): attestation is SignedOffchainAttestationV1 => {
  return 'v' in attestation && 'r' in attestation && 's' in attestation;
};

function convertV1AttestationToV2(attestation: SignedOffchainAttestationV1): SignedOffchainAttestation {
  const { v, r, s, ...rest } = attestation;
  return {
    ...rest,
    signature: {
      v,
      r,
      s
    }
  };
}
