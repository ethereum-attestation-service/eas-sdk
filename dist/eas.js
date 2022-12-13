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
    async attest({ recipient, schema, data, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 }) {
        const res = await this.contract.attest(recipient, schema, expirationTime, revocable, refUUID, data, value, {
            value
        });
        const receipt = await res.wait();
        const event = receipt.events?.find((e) => e.event === 'Attested');
        if (!event) {
            throw new Error('Unable to process attestation event');
        }
        return event.args?.uuid;
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ recipient, schema, data, attester, signature, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 }) {
        const res = await this.contract.attestByDelegation(recipient, schema, expirationTime, revocable, refUUID, data, value, attester, signature.v, hexlify(signature.r), hexlify(signature.s), { value });
        const receipt = await res.wait();
        const event = receipt.events?.find((e) => e.event === 'Attested');
        if (!event) {
            throw new Error('Unable to process attestation event');
        }
        return event.args?.uuid;
    }
    // Revokes an existing attestation
    async revoke({ uuid, value = 0 }) {
        return this.contract.revoke(uuid, value, { value });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ uuid, attester, signature, value = 0 }) {
        return this.contract.revokeByDelegation(uuid, value, attester, signature.v, hexlify(signature.r), hexlify(signature.s), { value });
    }
    // Returns an existing schema by attestation UUID
    async getAttestation({ uuid }) {
        return this.contract.getAttestation(uuid);
    }
    // Returns whether an attestation is valid
    async isAttestationValid({ uuid }) {
        return this.contract.isAttestationValid(uuid);
    }
    // Returns whether an attestation has been revoked
    async isAttestationRevoked({ uuid }) {
        const attestation = await this.contract.getAttestation(uuid);
        if (attestation.uuid === utils_1.ZERO_BYTES32) {
            throw new Error('Invalid attestation');
        }
        return attestation.revocationTime != 0;
    }
}
exports.EAS = EAS;
//# sourceMappingURL=eas.js.map