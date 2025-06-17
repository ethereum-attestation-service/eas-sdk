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
    DelegatedProxyAttestationVersion[DelegatedProxyAttestationVersion["Version2"] = 2] = "Version2";
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
    },
    [DelegatedProxyAttestationVersion.Version2]: {
        typedSignature: 
        // eslint-disable-next-line max-len
        'Attest(address attester,bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint64 deadline)',
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
    },
    [DelegatedProxyAttestationVersion.Version2]: {
        typedSignature: 'Revoke(address revoker,bytes32 schema,bytes32 uid,uint256 value,uint64 deadline)',
        primaryType: 'Revoke',
        types: {
            Revoke: [
                { name: 'revoker', type: 'address' },
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
        const fullVersion = semver_1.default.coerce(config.version);
        if (!fullVersion) {
            throw new Error(`Invalid version: ${config.version}`);
        }
        if (semver_1.default.lt(fullVersion, '1.2.0')) {
            this.version = DelegatedProxyAttestationVersion.Legacy;
        }
        else if (semver_1.default.lt(fullVersion, '1.3.0')) {
            this.version = DelegatedProxyAttestationVersion.Version1;
        }
        else {
            this.version = DelegatedProxyAttestationVersion.Version2;
        }
        this.attestType = DELEGATED_PROXY_ATTESTATION_TYPES[this.version];
        this.revokeType = DELEGATED_PROXY_REVOCATION_TYPES[this.version];
    }
    async signDelegatedProxyAttestation(params, signer) {
        let effectiveParams = {
            attester: await signer.getAddress(),
            ...params
        };
        if (this.version === DelegatedProxyAttestationVersion.Legacy) {
            // Committing to a value isn't supported for legacy attestations, therefore it will be ignored
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
        return this.verifyTypedDataRequestSignature(attester, { ...response, message: { attester, ...response.message } }, {
            primaryType: this.attestType.primaryType,
            types: this.attestType.types
        });
    }
    async signDelegatedProxyRevocation(params, signer) {
        let effectiveParams = {
            revoker: await signer.getAddress(),
            ...params
        };
        if (this.version === DelegatedProxyAttestationVersion.Legacy) {
            // Committing to a value isn't supported for legacy revocations, therefore it will be ignored
            effectiveParams = (0, omit_1.default)(params, ['value']);
        }
        return this.signTypedDataRequest(effectiveParams, {
            domain: this.getDomainTypedData(),
            primaryType: this.revokeType.primaryType,
            message: effectiveParams,
            types: this.revokeType.types
        }, signer);
    }
    verifyDelegatedProxyRevocationSignature(revoker, response) {
        return this.verifyTypedDataRequestSignature(revoker, { ...response, message: { revoker, ...response.message } }, {
            primaryType: this.revokeType.primaryType,
            types: this.revokeType.types
        });
    }
}
exports.DelegatedProxy = DelegatedProxy;
//# sourceMappingURL=delegated-proxy.js.map