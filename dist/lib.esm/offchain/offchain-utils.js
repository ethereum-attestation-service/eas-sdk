import { ZeroAddress, ZeroHash } from 'ethers';
import * as Base64 from 'js-base64';
import pako from 'pako';
import { OffchainAttestationVersion } from './offchain';
export const createOffchainURL = (pkg) => {
    const base64 = zipAndEncodeToBase64(pkg);
    return `/offchain/url/#attestation=${encodeURIComponent(base64)}`;
};
export const zipAndEncodeToBase64 = (pkg) => {
    const compacted = compactOffchainAttestationPackage(pkg);
    const jsoned = JSON.stringify(compacted, (_, value) => (typeof value === 'bigint' ? value.toString() : value));
    const gzipped = pako.deflate(jsoned, { level: 9 });
    return Base64.fromUint8Array(gzipped);
};
export const decodeBase64ZippedBase64 = (base64) => {
    const fromBase64 = Base64.toUint8Array(base64);
    const jsonStr = pako.inflate(fromBase64, { to: 'string' });
    const compacted = JSON.parse(jsonStr);
    return uncompactOffchainAttestationPackage(compacted);
};
export const compactOffchainAttestationPackage = (pkg) => {
    const { signer } = pkg;
    let { sig } = pkg;
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
        0,
        sig.message.version,
        sig.message.salt
    ];
};
export const uncompactOffchainAttestationPackage = (compacted) => {
    const version = compacted[16] ? compacted[16] : OffchainAttestationVersion.Legacy;
    const attestTypes = {
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
    switch (version) {
        case OffchainAttestationVersion.Legacy:
            break;
        case OffchainAttestationVersion.Version1:
            attestTypes.Attest = [
                {
                    name: 'version',
                    type: 'uint16'
                },
                ...attestTypes.Attest
            ];
            break;
        case OffchainAttestationVersion.Version2:
            attestTypes.Attest = [
                {
                    name: 'version',
                    type: 'uint16'
                },
                ...attestTypes.Attest,
                {
                    name: 'salt',
                    type: 'bytes32'
                }
            ];
            break;
        default:
            throw new Error(`Unsupported version: ${version}`);
    }
    return {
        sig: {
            version,
            domain: {
                name: 'EAS Attestation',
                version: compacted[0],
                chainId: BigInt(compacted[1]),
                verifyingContract: compacted[2]
            },
            primaryType: version === OffchainAttestationVersion.Legacy ? 'Attestation' : 'Attest',
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
                salt: compacted[17]
            }
        },
        signer: compacted[6]
    };
};
export const isSignedOffchainAttestationV1 = (attestation) => {
    return 'v' in attestation && 'r' in attestation && 's' in attestation;
};
const convertV1AttestationToV2 = (attestation) => {
    const { v, r, s, ...rest } = attestation;
    return {
        ...rest,
        version: OffchainAttestationVersion.Version1,
        signature: {
            v,
            r,
            s
        }
    };
};
//# sourceMappingURL=offchain-utils.js.map