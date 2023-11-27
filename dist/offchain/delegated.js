"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegated = exports.DelegatedAttestationVersion = exports.EIP712_NAME = void 0;
const tslib_1 = require("tslib");
const omit_1 = tslib_1.__importDefault(require("lodash/omit"));
const semver_1 = tslib_1.__importDefault(require("semver"));
const request_1 = require("../request");
const typed_data_handler_1 = require("./typed-data-handler");
exports.EIP712_NAME = 'EAS';
var DelegatedAttestationVersion;
(function (DelegatedAttestationVersion) {
    DelegatedAttestationVersion[DelegatedAttestationVersion["Legacy"] = 0] = "Legacy";
    DelegatedAttestationVersion[DelegatedAttestationVersion["Version1"] = 1] = "Version1";
    DelegatedAttestationVersion[DelegatedAttestationVersion["Version2"] = 2] = "Version2";
})(DelegatedAttestationVersion || (exports.DelegatedAttestationVersion = DelegatedAttestationVersion = {}));
const DELEGATED_ATTESTATION_TYPES = {
    [DelegatedAttestationVersion.Legacy]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 nonce)',
        primaryType: 'Attest',
        types: {
            Attest: [
                { name: 'schema', type: 'bytes32' },
                { name: 'recipient', type: 'address' },
                { name: 'expirationTime', type: 'uint64' },
                { name: 'revocable', type: 'bool' },
                { name: 'refUID', type: 'bytes32' },
                { name: 'data', type: 'bytes' },
                { name: 'nonce', type: 'uint256' }
            ]
        }
    },
    [DelegatedAttestationVersion.Version1]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Attest',
        types: {
            Attest: [
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
    },
    [DelegatedAttestationVersion.Version2]: {
        typedSignature: 'Attest(address attester,bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Attest',
        types: {
            Attest: [
                { name: 'attester', type: 'address' },
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
    }
};
const DELEGATED_REVOCATION_TYPES = {
    [DelegatedAttestationVersion.Legacy]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 nonce)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'schema', type: 'bytes32' },
                { name: 'uid', type: 'bytes32' },
                { name: 'nonce', type: 'uint256' }
            ]
        }
    },
    [DelegatedAttestationVersion.Version1]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'schema', type: 'bytes32' },
                { name: 'uid', type: 'bytes32' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint64' }
            ]
        }
    },
    [DelegatedAttestationVersion.Version2]: {
        typedSignature: 'Revoke(address revoker,bytes32 schema,bytes32 uid,uint256 value,uint256 nonce,uint64 deadline)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'revoker', type: 'address' },
                { name: 'schema', type: 'bytes32' },
                { name: 'uid', type: 'bytes32' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint64' }
            ]
        }
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
        else if (semver_1.default.lt(config.version, '1.3.0')) {
            this.version = DelegatedAttestationVersion.Version1;
        }
        else {
            this.version = DelegatedAttestationVersion.Version2;
        }
        this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
        this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];
    }
    async signDelegatedAttestation(params, signer) {
        let effectiveParams = {
            attester: await signer.getAddress(),
            ...params
        };
        if (this.version === DelegatedAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy attestations. Please specify 0 instead");
            }
            if (params.deadline !== request_1.NO_EXPIRATION) {
                throw new Error(`Committing to a deadline isn't supported for legacy attestations. Please specify ${request_1.NO_EXPIRATION} instead`);
            }
            effectiveParams = (0, omit_1.default)(params, ['value', 'deadline']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.attestType.primaryType,
            message: effectiveParams,
            types: this.attestType.types
        }, signer);
    }
    verifyDelegatedAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, { ...response, message: { attester, ...response.message } }, {
            primaryType: this.attestType.primaryType,
            types: this.attestType.types
        });
    }
    async signDelegatedRevocation(params, signer) {
        let effectiveParams = {
            revoker: await signer.getAddress(),
            ...params
        };
        if (this.version === DelegatedAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy revocations. Please specify 0 instead");
            }
            if (params.deadline !== request_1.NO_EXPIRATION) {
                throw new Error(`Committing to a deadline isn't supported for legacy revocations. Please specify ${request_1.NO_EXPIRATION} instead`);
            }
            effectiveParams = (0, omit_1.default)(params, ['value', 'deadline']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.revokeType.primaryType,
            message: effectiveParams,
            types: this.revokeType.types
        }, signer);
    }
    verifyDelegatedRevocationSignature(revoker, response) {
        return this.verifyTypedDataRequestSignature(revoker, { ...response, message: { revoker, ...response.message } }, {
            primaryType: this.revokeType.primaryType,
            types: this.revokeType.types
        });
    }
}
exports.Delegated = Delegated;
//# sourceMappingURL=delegated.js.map