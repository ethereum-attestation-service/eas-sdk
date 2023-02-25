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
    { name: 'time', type: 'uint64' },
    { name: 'expirationTime', type: 'uint64' },
    { name: 'revocable', type: 'bool' },
    { name: 'refUID', type: 'bytes32' },
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
    async signOffchainAttestation(params, signer) {
        const uid = Offchain.getOffchainUID(params);
        const signedRequest = await this.signTypedDataRequest(params, {
            domain: this.getDomainTypedData(),
            primaryType: exports.ATTESTATION_PRIMARY_TYPE,
            message: params,
            types: {
                Attest: exports.ATTESTATION_TYPE
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
        return (0, utils_1.getOffchainUID)(params.schema, params.recipient, params.time, params.expirationTime, params.revocable, params.refUID, params.data);
    }
}
exports.Offchain = Offchain;
//# sourceMappingURL=offchain.js.map