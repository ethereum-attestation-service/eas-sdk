"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegated = void 0;
const tslib_1 = require("tslib");
const omit_1 = tslib_1.__importDefault(require("lodash/omit"));
const semver_1 = tslib_1.__importDefault(require("semver"));
const typed_data_handler_1 = require("./typed-data-handler");
const versions_1 = require("./versions");
var DelegatedAttestationVersion;
(function (DelegatedAttestationVersion) {
    DelegatedAttestationVersion[DelegatedAttestationVersion["Legacy"] = 0] = "Legacy";
    DelegatedAttestationVersion[DelegatedAttestationVersion["Version1"] = 1] = "Version1";
    DelegatedAttestationVersion[DelegatedAttestationVersion["Version2"] = 2] = "Version2";
})(DelegatedAttestationVersion || (DelegatedAttestationVersion = {}));
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
        typedSignature: 
        // eslint-disable-next-line max-len
        'Attest(bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
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
        typedSignature: 
        // eslint-disable-next-line max-len
        'Attest(address attester,bytes32 schema,address recipient,uint64 expirationTime,bool revocable,bytes32 refUID,bytes data,uint256 value,uint256 nonce,uint64 deadline)',
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
    eas;
    constructor(config, eas) {
        let { version } = config;
        if (!version) {
            const { domainSeparator } = config;
            if (!domainSeparator) {
                throw new Error('Neither EIP712 version or domain separator were provided');
            }
            // If only the domain separator was provided, let's try to deduce the version accordingly.
            for (const eip712Version of versions_1.EIP712_VERSIONS) {
                if (domainSeparator ===
                    typed_data_handler_1.TypedDataHandler.getDomainSeparator({
                        address: config.address,
                        name: versions_1.EIP712_NAME,
                        version: eip712Version,
                        chainId: config.chainId
                    })) {
                    version = eip712Version;
                    break;
                }
            }
            if (!version) {
                throw new Error(`Unable to find version for domain separator: ${domainSeparator}`);
            }
        }
        super({ ...config, version, name: versions_1.EIP712_NAME });
        const fullVersion = semver_1.default.coerce(version);
        if (!fullVersion) {
            throw new Error(`Invalid version: ${version}`);
        }
        if (semver_1.default.lt(fullVersion, '1.2.0')) {
            this.version = DelegatedAttestationVersion.Legacy;
        }
        else if (semver_1.default.lt(fullVersion, '1.3.0')) {
            this.version = DelegatedAttestationVersion.Version1;
        }
        else {
            this.version = DelegatedAttestationVersion.Version2;
        }
        this.attestType = DELEGATED_ATTESTATION_TYPES[this.version];
        this.revokeType = DELEGATED_REVOCATION_TYPES[this.version];
        this.eas = eas;
    }
    async signDelegatedAttestation(params, signer) {
        let effectiveParams = {
            attester: await signer.getAddress(),
            ...params
        };
        // If nonce wasn't provided, try retrieving it onchain.
        effectiveParams.nonce ??= await this.eas.contract.getNonce(effectiveParams.attester);
        switch (this.version) {
            case DelegatedAttestationVersion.Legacy:
                effectiveParams = (0, omit_1.default)(effectiveParams, ['value', 'deadline']);
                break;
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
        // If nonce wasn't provided, try retrieving it onchain.
        effectiveParams.nonce ??= await this.eas.contract.getNonce(effectiveParams.revoker);
        switch (this.version) {
            case DelegatedAttestationVersion.Legacy:
                effectiveParams = (0, omit_1.default)(effectiveParams, ['value', 'deadline']);
                break;
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