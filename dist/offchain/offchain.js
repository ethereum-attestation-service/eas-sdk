"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offchain = exports.OFFCHAIN_ATTESTATION_TYPES = exports.OFFCHAIN_ATTESTATION_VERSION = void 0;
const utils_1 = require("../utils");
const delegated_1 = require("./delegated");
const typed_data_handler_1 = require("./typed-data-handler");
const ethers_1 = require("ethers");
exports.OFFCHAIN_ATTESTATION_VERSION = 1;
const LEGACY_OFFCHAIN_ATTESTATION_VERSION = 0;
exports.OFFCHAIN_ATTESTATION_TYPES = {
    0: {
        domainName: 'EAS Attestation',
        primaryType: 'Attestation',
        types: [
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint64' },
            { name: 'expirationTime', type: 'uint64' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' }
        ]
    },
    1: {
        domainName: 'EAS Attestation',
        primaryType: 'Attest',
        types: [
            { name: 'version', type: 'uint16' },
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint64' },
            { name: 'expirationTime', type: 'uint64' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' }
        ]
    }
};
class Offchain extends typed_data_handler_1.TypedDataHandler {
    version;
    type;
    constructor(config, version) {
        if (version > exports.OFFCHAIN_ATTESTATION_VERSION) {
            throw new Error('Unsupported version');
        }
        super({ ...config, name: delegated_1.EIP712_NAME });
        this.version = version;
        this.type = exports.OFFCHAIN_ATTESTATION_TYPES[this.version];
    }
    getDomainSeparator() {
        return (0, ethers_1.keccak256)(ethers_1.AbiCoder.defaultAbiCoder().encode(['bytes32', 'bytes32', 'uint256', 'address'], [
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.type.domainName)),
            (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(this.config.version)),
            this.config.chainId,
            this.config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: this.type.domainName,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    async signOffchainAttestation(params, signer) {
        const uid = Offchain.getOffchainUID(params);
        const signedRequest = await this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: this.type.primaryType,
            message: params,
            types: {
                Attest: this.type.types
            }
        }, signer);
        return {
            ...signedRequest,
            uid
        };
    }
    verifyOffchainAttestationSignature(attester, request) {
        return (request.uid === Offchain.getOffchainUID(request.message) &&
            this.verifyTypedDataRequestSignature(attester, request));
    }
    static getOffchainUID(params) {
        return (0, utils_1.getOffchainUID)(params.version ?? LEGACY_OFFCHAIN_ATTESTATION_VERSION, params.schema, params.recipient, params.time, params.expirationTime, params.revocable, params.refUID, params.data);
    }
}
exports.Offchain = Offchain;
//# sourceMappingURL=offchain.js.map