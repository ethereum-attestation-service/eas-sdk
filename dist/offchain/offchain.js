"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Offchain = exports.DOMAIN_NAME = exports.ATTESTATION_TYPE = exports.ATTESTATION_PRIMARY_TYPE = void 0;
const utils_1 = require("../utils");
const typed_data_handler_1 = require("./typed-data-handler");
const ethers_1 = require("ethers");
const { keccak256, toUtf8Bytes, defaultAbiCoder } = ethers_1.utils;
exports.ATTESTATION_PRIMARY_TYPE = 'Attestation';
exports.ATTESTATION_TYPE = [
    { name: 'schema', type: 'bytes32' },
    { name: 'recipient', type: 'address' },
    { name: 'time', type: 'uint32' },
    { name: 'expirationTime', type: 'uint32' },
    { name: 'refUUID', type: 'bytes32' },
    { name: 'data', type: 'bytes' }
];
exports.DOMAIN_NAME = 'EAS Attestation';
class Offchain extends typed_data_handler_1.TypedDataHandler {
    constructor(config) {
        super(config);
    }
    getDomainSeparator() {
        return keccak256(defaultAbiCoder.encode(['bytes32', 'bytes32', 'uint256', 'address'], [
            keccak256(toUtf8Bytes(exports.DOMAIN_NAME)),
            keccak256(toUtf8Bytes(this.config.version)),
            this.config.chainId,
            this.config.address
        ]));
    }
    getDomainTypedData() {
        return {
            name: exports.DOMAIN_NAME,
            version: this.config.version,
            chainId: this.config.chainId,
            verifyingContract: this.config.address
        };
    }
    getTypedData(_type, params) {
        return {
            domain: this.getDomainTypedData(),
            primaryType: exports.ATTESTATION_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: exports.ATTESTATION_TYPE
            }
        };
    }
    async signOffchainAttestation(params, signer) {
        const uuid = (0, utils_1.getOffchainUUID)(params.schema, params.recipient, params.time, params.expirationTime, params.refUUID, params.data);
        return { ...(await this.signTypedDataRequest(exports.ATTESTATION_PRIMARY_TYPE, params, signer)), uuid };
    }
    async verifyOffchainAttestationSignature(attester, request) {
        return this.verifyTypedDataRequestSignature(attester, request);
    }
}
exports.Offchain = Offchain;
//# sourceMappingURL=offchain.js.map