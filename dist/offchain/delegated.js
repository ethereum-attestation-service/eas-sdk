"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegated = exports.DelegatedAttestationVersion = exports.EIP712_NAME = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const semver_1 = tslib_1.__importDefault(require("semver"));
const request_1 = require("../request");
const typed_data_handler_1 = require("./typed-data-handler");
exports.EIP712_NAME = 'EAS';
var DelegatedAttestationVersion;
(function (DelegatedAttestationVersion) {
    DelegatedAttestationVersion[DelegatedAttestationVersion["Legacy"] = 0] = "Legacy";
    DelegatedAttestationVersion[DelegatedAttestationVersion["Version1"] = 1] = "Version1";
})(DelegatedAttestationVersion || (exports.DelegatedAttestationVersion = DelegatedAttestationVersion = {}));
const DELEGATED_ATTESTATION_TYPES = {
    [DelegatedAttestationVersion.Legacy]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)',
        primaryType: 'Attest',
        types: [
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'expirationTime', type: 'uint64' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' },
            { name: 'nonce', type: 'uint256' }
        ]
    },
    [DelegatedAttestationVersion.Version1]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Attest',
        types: [
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'expirationTime', type: 'uint64' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint64' }
        ]
    }
};
const DELEGATED_REVOCATION_TYPES = {
    [DelegatedAttestationVersion.Legacy]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)',
        primaryType: 'Revoke',
        types: [
            { name: 'schema', type: 'bytes32' },
            { name: 'uid', type: 'bytes32' },
            { name: 'nonce', type: 'uint256' }
        ]
    },
    [DelegatedAttestationVersion.Version1]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Revoke',
        types: [
            { name: 'schema', type: 'bytes32' },
            { name: 'uid', type: 'bytes32' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint64' }
        ]
    }
};
class Delegated extends typed_data_handler_1.TypedDataHandler {
    version;
    attestType;
    revokeType;
    constructor(config) {
        super({ ...config, name: exports.EIP712_NAME });
        if (semver_1.default.lt(config.version, '1.2.0')) {
            this.version = DelegatedAttestationVersion.Legacy;
        }
        else {
            this.version = DelegatedAttestationVersion.Version1;
        }
        this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
        this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];
    }
    signDelegatedAttestation(params, signer) {
        let effectiveParams = params;
        if (this.version === DelegatedAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy attestations. Please specify 0 instead");
            }
            if (params.deadline !== request_1.NO_EXPIRATION) {
                throw new Error(`Committing to a deadline isn't supported for legacy attestations. Please specify ${request_1.NO_EXPIRATION} instead`);
            }
            effectiveParams = (0, lodash_1.omit)(params, ['value', 'deadline']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.attestType.primaryType,
            message: effectiveParams,
            types: {
                [this.attestType.primaryType]: this.attestType.types
            }
        }, signer);
    }
    verifyDelegatedAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
    signDelegatedRevocation(params, signer) {
        let effectiveParams = params;
        if (this.version === DelegatedAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy revocations. Please specify 0 instead");
            }
            if (params.deadline !== request_1.NO_EXPIRATION) {
                throw new Error(`Committing to a deadline isn't supported for legacy revocations. Please specify ${request_1.NO_EXPIRATION} instead`);
            }
            effectiveParams = (0, lodash_1.omit)(params, ['value', 'deadline']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.revokeType.primaryType,
            message: effectiveParams,
            types: {
                Revoke: this.revokeType.types
            }
        }, signer);
    }
    verifyDelegatedRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response);
    }
}
exports.Delegated = Delegated;
//# sourceMappingURL=delegated.js.map