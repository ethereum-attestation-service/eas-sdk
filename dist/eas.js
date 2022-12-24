"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAS = exports.NO_EXPIRATION = void 0;
const base_1 = require("./base");
const utils_1 = require("./utils");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
exports.NO_EXPIRATION = 0;
class EAS extends base_1.Base {
    constructor(address, signerOrProvider) {
        super(new eas_contracts_1.EAS__factory(), address, signerOrProvider);
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
    // Attests to a specific schema
    async attest({ schema, data: { recipient, data, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 } }) {
        const res = await this.contract.attest({ schema, data: { recipient, expirationTime, revocable, refUUID, data, value } }, {
            value
        });
        return (0, utils_1.getUUIDFromAttestTx)(res);
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ schema, data: { recipient, data, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 }, attester, signature }) {
        const res = await this.contract.attestByDelegation({
            schema,
            data: {
                recipient,
                expirationTime,
                revocable,
                refUUID,
                data,
                value
            },
            signature,
            attester
        }, { value });
        return (0, utils_1.getUUIDFromAttestTx)(res);
    }
    // Multi-attests to multiple schemas
    async multiAttest(requests) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
                expirationTime: d.expirationTime ?? exports.NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUUID: d.refUUID ?? utils_1.ZERO_BYTES32,
                data: d.data ?? utils_1.ZERO_BYTES32,
                value: d.value ?? 0
            }))
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), ethers_1.BigNumber.from(0));
            return res.add(total);
        }, ethers_1.BigNumber.from(0));
        const res = await this.contract.multiAttest(multiAttestationRequests, {
            value: requestedValue
        });
        return (0, utils_1.getUUIDFromMultiAttestTx)(res);
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests
    async multiAttestByDelegation(requests) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
                expirationTime: d.expirationTime ?? exports.NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUUID: d.refUUID ?? utils_1.ZERO_BYTES32,
                data: d.data ?? utils_1.ZERO_BYTES32,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            attester: r.attester
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), ethers_1.BigNumber.from(0));
            return res.add(total);
        }, ethers_1.BigNumber.from(0));
        const res = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
            value: requestedValue
        });
        return (0, utils_1.getUUIDFromMultiAttestTx)(res);
    }
    // Revokes an existing attestation
    async revoke({ schema, data: { uuid, value = 0 } }) {
        return this.contract.revoke({ schema, data: { uuid, value } }, { value });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ schema, data: { uuid, value = 0 }, signature, revoker }) {
        return this.contract.revokeByDelegation({
            schema,
            data: {
                uuid,
                value
            },
            signature,
            revoker
        }, { value });
    }
    // Multi-revokes multiple attestations
    async multiRevoke(requests) {
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uuid: d.uuid,
                value: d.value ?? 0
            }))
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), ethers_1.BigNumber.from(0));
            return res.add(total);
        }, ethers_1.BigNumber.from(0));
        return this.contract.multiRevoke(multiRevocationRequests, {
            value: requestedValue
        });
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests
    async multiRevokeByDelegation(requests) {
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uuid: d.uuid,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            revoker: r.revoker
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), ethers_1.BigNumber.from(0));
            return res.add(total);
        }, ethers_1.BigNumber.from(0));
        return this.contract.multiRevokeByDelegation(multiRevocationRequests, {
            value: requestedValue
        });
    }
}
exports.EAS = EAS;
//# sourceMappingURL=eas.js.map