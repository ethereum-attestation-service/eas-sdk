"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelegatedProxy = exports.DelegatedProxyAttestationVersion = void 0;
const tslib_1 = require("tslib");
const omit_1 = tslib_1.__importDefault(require("lodash/omit"));
const semver_1 = tslib_1.__importDefault(require("semver"));
const typed_data_handler_1 = require("./typed-data-handler");
var DelegatedProxyAttestationVersion;
(function (DelegatedProxyAttestationVersion) {
    DelegatedProxyAttestationVersion[DelegatedProxyAttestationVersion["Legacy"] = 0] = "Legacy";
    DelegatedProxyAttestationVersion[DelegatedProxyAttestationVersion["Version1"] = 1] = "Version1";
})(DelegatedProxyAttestationVersion || (exports.DelegatedProxyAttestationVersion = DelegatedProxyAttestationVersion = {}));
const DELEGATED_PROXY_ATTESTATION_TYPES = {
    [DelegatedProxyAttestationVersion.Legacy]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint64 deadline)',
        primaryType: 'Attest',
        types: {
            Attest: [
                { name: 'schema', type: 'bytes32' },
                { name: 'recipient', type: 'address' },
                { name: 'expirationTime', type: 'uint64' },
                { name: 'revocable', type: 'bool' },
                { name: 'refUID', type: 'bytes32' },
                { name: 'data', type: 'bytes' },
                { name: 'deadline', type: 'uint64' }
            ]
        }
    },
    [DelegatedProxyAttestationVersion.Version1]: {
        typedSignature: 'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint64 deadline)',
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
                { name: 'deadline', type: 'uint64' }
            ]
        }
    }
};
const DELEGATED_PROXY_REVOCATION_TYPES = {
    [DelegatedProxyAttestationVersion.Legacy]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint64 deadline)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'schema', type: 'bytes32' },
                { name: 'uid', type: 'bytes32' },
                { name: 'deadline', type: 'uint64' }
            ]
        }
    },
    [DelegatedProxyAttestationVersion.Version1]: {
        typedSignature: 'Revoke(bytes32 schema,bytes32 uid,uint256 value,uint64 deadline)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'schema', type: 'bytes32' },
                { name: 'uid', type: 'bytes32' },
                { name: 'value', type: 'uint256' },
                { name: 'deadline', type: 'uint64' }
            ]
        }
    }
};
class DelegatedProxy extends typed_data_handler_1.TypedDataHandler {
    version;
    attestType;
    revokeType;
    constructor(config) {
        super(config);
        if (semver_1.default.lt(config.version, '1.2.0')) {
            this.version = DelegatedProxyAttestationVersion.Legacy;
        }
        else {
            this.version = DelegatedProxyAttestationVersion.Version1;
        }
        this.attestType = DELEGATED_PROXY_ATTESTATION_TYPES[this.version];
        this.revokeType = DELEGATED_PROXY_REVOCATION_TYPES[this.version];
    }
    signDelegatedProxyAttestation(params, signer) {
        let effectiveParams = params;
        if (this.version === DelegatedProxyAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy attestations. Please specify 0 instead");
            }
            effectiveParams = (0, omit_1.default)(params, ['value']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.attestType.primaryType,
            message: effectiveParams,
            types: this.attestType.types
        }, signer);
    }
    verifyDelegatedProxyAttestationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response, {
            primaryType: this.attestType.primaryType,
            types: this.attestType.types
        });
    }
    signDelegatedProxyRevocation(params, signer) {
        let effectiveParams = params;
        if (this.version === DelegatedProxyAttestationVersion.Legacy) {
            if (params.value !== 0n) {
                throw new Error("Committing to a value isn't supported for legacy revocations. Please specify 0 instead");
            }
            effectiveParams = (0, omit_1.default)(params, ['value']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.revokeType.primaryType,
            message: effectiveParams,
            types: this.revokeType.types
        }, signer);
    }
    verifyDelegatedProxyRevocationSignature(attester, response) {
        return this.verifyTypedDataRequestSignature(attester, response, {
            primaryType: this.revokeType.primaryType,
            types: this.revokeType.types
        });
    }
}
exports.DelegatedProxy = DelegatedProxy;
//# sourceMappingURL=delegated-proxy.js.map