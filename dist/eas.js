"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAS = exports.NO_EXPIRATION = void 0;
const base_1 = require("./base");
const utils_1 = require("./utils");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
const { hexlify } = ethers_1.utils;
exports.NO_EXPIRATION = 0;
class EAS extends base_1.Base {
    constructor(address) {
        super(new eas_contracts_1.EAS__factory(), address);
    }
    // Attests to a specific schema
    async attest(recipient, schema, data, expirationTime = exports.NO_EXPIRATION, refUUID = utils_1.ZERO_BYTES32, overrides = {}) {
        const res = await this.contract.attest(recipient, schema, expirationTime, refUUID, data, overrides);
        const receipt = await res.wait();
        const event = receipt.events?.find((e) => e.event === 'Attested');
        if (!event) {
            throw new Error('Unable to process attestation event');
        }
        return event.args?.uuid;
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation(recipient, schema, data, attester, signature, expirationTime = exports.NO_EXPIRATION, refUUID = utils_1.ZERO_BYTES32, overrides = {}) {
        const res = await this.contract.attestByDelegation(recipient, schema, expirationTime, refUUID, data, attester, signature.v, hexlify(signature.r), hexlify(signature.s), overrides);
        const receipt = await res.wait();
        const event = receipt.events?.find((e) => e.event === 'Attested');
        if (!event) {
            throw new Error('Unable to process attestation event');
        }
        return event.args?.uuid;
    }
    // Revokes an existing attestation
    revoke(uuid) {
        return this.contract.revoke(uuid);
    }
    // Revokes an existing attestation an EIP712 delegation request
    revokeByDelegation(uuid, attester, signature) {
        return this.contract.revokeByDelegation(uuid, attester, signature.v, hexlify(signature.r), hexlify(signature.s));
    }
    // Returns an existing schema by attestation UUID
    getAttestation(uuid) {
        return this.contract.getAttestation(uuid);
    }
    // Returns whether an attestation is valid
    isAttestationValid(uuid) {
        return this.contract.isAttestationValid(uuid);
    }
}
exports.EAS = EAS;
//# sourceMappingURL=eas.js.map