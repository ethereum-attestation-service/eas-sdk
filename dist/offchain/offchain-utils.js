"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSignedOffchainAttestationV1 = exports.uncompactOffchainAttestationPackageV1 = exports.uncompactOffchainAttestationPackage = exports.compactOffchainAttestationPackage = exports.decodeBase64ZippedBase64 = exports.zipAndEncodeToBase64 = exports.createOffchainURL = void 0;
const tslib_1 = require("tslib");
const ethers_1 = require("ethers");
const Base64 = tslib_1.__importStar(require("js-base64"));
const pako_1 = tslib_1.__importDefault(require("pako"));
const offchain_1 = require("./offchain");
const createOffchainURL = (pkg) => {
    const base64 = (0, exports.zipAndEncodeToBase64)(pkg);
    return `/offchain/url/#attestation=${encodeURIComponent(base64)}`;
};
exports.createOffchainURL = createOffchainURL;
const zipAndEncodeToBase64 = (pkg) => {
    const compacted = (0, exports.compactOffchainAttestationPackage)(pkg);
    const jsoned = JSON.stringify(compacted, (_, value) => (typeof value === 'bigint' ? value.toString() : value));
    const gzipped = pako_1.default.deflate(jsoned, { level: 9 });
    return Base64.fromUint8Array(gzipped);
};
exports.zipAndEncodeToBase64 = zipAndEncodeToBase64;
const decodeBase64ZippedBase64 = (base64) => {
    const fromBase64 = Base64.toUint8Array(base64);
    const jsonStr = pako_1.default.inflate(fromBase64, { to: 'string' });
    const compacted = JSON.parse(jsonStr);
    return (0, exports.uncompactOffchainAttestationPackage)(compacted);
};
exports.decodeBase64ZippedBase64 = decodeBase64ZippedBase64;
const compactOffchainAttestationPackage = (pkg) => {
    const { sig, signer } = pkg;
    if (sig.message.version < offchain_1.OffChainAttestationVersion.Version2) {
        return compactOffchainAttestationPackageV1(pkg);
    }
    return {
        offchainVersion: sig.message.version,
        contractVersion: sig.domain.version,
        chainId: sig.domain.chainId,
        verifyingContract: sig.domain.verifyingContract,
        r: sig.signature.r,
        s: sig.signature.s,
        v: sig.signature.v,
        signer,
        uid: sig.uid,
        schema: sig.message.schema,
        recipient: sig.message.recipient === ethers_1.ZeroAddress ? '0' : sig.message.recipient,
        time: Number(sig.message.time),
        expirationTime: Number(sig.message.expirationTime),
        refUID: sig.message.refUID === ethers_1.ZeroHash ? '0' : sig.message.refUID,
        revocable: sig.message.revocable,
        data: sig.message.data,
        salt: sig.message.salt,
        nonce: Number(sig.message.nonce)
    };
};
exports.compactOffchainAttestationPackage = compactOffchainAttestationPackage;
const compactOffchainAttestationPackageV1 = (pkg) => {
    const { signer } = pkg;
    let { sig } = pkg;
    if ((0, exports.isSignedOffchainAttestationV1)(sig)) {
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
        sig.message.recipient === ethers_1.ZeroAddress ? '0' : sig.message.recipient,
        Number(sig.message.time),
        Number(sig.message.expirationTime),
        sig.message.refUID === ethers_1.ZeroHash ? '0' : sig.message.refUID,
        sig.message.revocable,
        sig.message.data,
        Number(sig.message.nonce),
        sig.message.version
    ];
};
const uncompactOffchainAttestationPackage = (compacted) => {
    if (!compacted.offchainVersion) {
        return (0, exports.uncompactOffchainAttestationPackageV1)(compacted);
    }
    if (compacted.offchainVersion < offchain_1.OffChainAttestationVersion.Version2) {
        throw new Error(`Invalid version: ${compacted.offchainVersion}`);
    }
    const attestTypes = {
        Attest: [
            {
                name: 'version',
                type: 'uint16'
            },
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
            },
            {
                name: 'salt',
                type: 'bytes32'
            }
        ]
    };
    return {
        sig: {
            version: compacted.offchainVersion,
            domain: {
                name: 'EAS Attestation',
                version: compacted.contractVersion,
                chainId: compacted.chainId,
                verifyingContract: compacted.verifyingContract
            },
            primaryType: 'Attest',
            types: attestTypes,
            signature: {
                r: compacted.r,
                s: compacted.s,
                v: compacted.v
            },
            uid: compacted.uid,
            message: {
                version: compacted.offchainVersion,
                schema: compacted.schema,
                recipient: compacted.recipient === '0' ? ethers_1.ZeroAddress : compacted.recipient,
                time: BigInt(compacted.time),
                expirationTime: BigInt(compacted.expirationTime),
                refUID: compacted.refUID === '0' ? ethers_1.ZeroHash : compacted.refUID,
                revocable: compacted.revocable,
                data: compacted.data,
                nonce: BigInt(compacted.nonce),
                salt: compacted.salt
            }
        },
        signer: compacted.signer
    };
};
exports.uncompactOffchainAttestationPackage = uncompactOffchainAttestationPackage;
const uncompactOffchainAttestationPackageV1 = (compacted) => {
    const version = compacted[16] ? compacted[16] : offchain_1.OffChainAttestationVersion.Legacy;
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
    if (version === offchain_1.OffChainAttestationVersion.Version1) {
        attestTypes.Attest = [
            {
                name: 'version',
                type: 'uint16'
            },
            ...attestTypes.Attest
        ];
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
            primaryType: version === 0 ? 'Attestation' : 'Attest',
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
                recipient: compacted[9] === '0' ? ethers_1.ZeroAddress : compacted[9],
                time: BigInt(compacted[10]),
                expirationTime: BigInt(compacted[11]),
                refUID: compacted[12] === '0' ? ethers_1.ZeroHash : compacted[12],
                revocable: compacted[13],
                data: compacted[14],
                nonce: BigInt(compacted[15])
            }
        },
        signer: compacted[6]
    };
};
exports.uncompactOffchainAttestationPackageV1 = uncompactOffchainAttestationPackageV1;
const isSignedOffchainAttestationV1 = (attestation) => {
    return 'v' in attestation && 'r' in attestation && 's' in attestation;
};
exports.isSignedOffchainAttestationV1 = isSignedOffchainAttestationV1;
function convertV1AttestationToV2(attestation) {
    const { v, r, s, ...rest } = attestation;
    return {
        ...rest,
        version: offchain_1.OffChainAttestationVersion.Version1,
        signature: {
            v,
            r,
            s
        }
    };
}
//# sourceMappingURL=offchain-utils.js.map