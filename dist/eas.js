"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAS = exports.NO_EXPIRATION = void 0;
const transaction_1 = require("./transaction");
const utils_1 = require("./utils");
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
exports.NO_EXPIRATION = 0;
class EAS extends transaction_1.Base {
    constructor(address, signerOrProvider) {
        super(new eas_contracts_1.EAS__factory(), address, signerOrProvider);
    }
    // Returns the version of the contract
    getVersion() {
        return this.contract.VERSION();
    }
    // Returns an existing schema by attestation UUID
    getAttestation(uuid) {
        return this.contract.getAttestation(uuid);
    }
    // Returns whether an attestation is valid
    isAttestationValid(uuid) {
        return this.contract.isAttestationValid(uuid);
    }
    // Returns whether an attestation has been revoked
    async isAttestationRevoked(uuid) {
        const attestation = await this.contract.getAttestation(uuid);
        if (attestation.uuid === utils_1.ZERO_BYTES32) {
            throw new Error('Invalid attestation');
        }
        return !attestation.revocationTime.isZero();
    }
    // Returns the timestamp that the specified data was timestamped with.
    getTimestamp(data) {
        return this.contract.getTimestamp(data);
    }
    // Attests to a specific schema
    async attest({ schema, data: { recipient, data, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 } }) {
        const tx = await this.contract.attest({ schema, data: { recipient, expirationTime, revocable, refUUID, data, value } }, {
            value
        });
        return new transaction_1.Transaction(tx, async (receipt) => (await (0, utils_1.getUUIDsFromAttestEvents)(receipt.events))[0]);
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ schema, data: { recipient, data, expirationTime = exports.NO_EXPIRATION, revocable = true, refUUID = utils_1.ZERO_BYTES32, value = 0 }, attester, signature }) {
        const tx = await this.contract.attestByDelegation({
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
        return new transaction_1.Transaction(tx, async (receipt) => (await (0, utils_1.getUUIDsFromAttestEvents)(receipt.events))[0]);
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
        const tx = await this.contract.multiAttest(multiAttestationRequests, {
            value: requestedValue
        });
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (receipt) => (0, utils_1.getUUIDsFromAttestEvents)(receipt.events));
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
        const tx = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
            value: requestedValue
        });
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (receipt) => (0, utils_1.getUUIDsFromAttestEvents)(receipt.events));
    }
    // Revokes an existing attestation
    async revoke({ schema, data: { uuid, value = 0 } }) {
        const tx = await this.contract.revoke({ schema, data: { uuid, value } }, { value });
        return new transaction_1.Transaction(tx, async () => { });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ schema, data: { uuid, value = 0 }, signature, revoker }) {
        const tx = await this.contract.revokeByDelegation({
            schema,
            data: {
                uuid,
                value
            },
            signature,
            revoker
        }, { value });
        return new transaction_1.Transaction(tx, async () => { });
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
        const tx = await this.contract.multiRevoke(multiRevocationRequests, {
            value: requestedValue
        });
        return new transaction_1.Transaction(tx, async () => { });
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
        const tx = await this.contract.multiRevokeByDelegation(multiRevocationRequests, {
            value: requestedValue
        });
        return new transaction_1.Transaction(tx, async () => { });
    }
    // Timestamps the specified bytes32 data.
    async timestamp(data) {
        const tx = await this.contract.timestamp(data);
        return new transaction_1.Transaction(tx, async (receipt) => (await (0, utils_1.getTimestampFromTimestampEvents)(receipt.events))[0]);
    }
    // Timestamps the specified multiple bytes32 data.
    async multiTimestamp(data) {
        const tx = await this.contract.multiTimestamp(data);
        // eslint-disable-next-line require-await
        return new transaction_1.Transaction(tx, async (receipt) => (0, utils_1.getTimestampFromTimestampEvents)(receipt.events));
    }
    // Returns the domain separator used in the encoding of the signatures for attest, and revoke.
    getDomainSeparator() {
        return this.contract.getDomainSeparator();
    }
    // Returns the current nonce per-account.
    getNonce(address) {
        return this.contract.getNonce(address);
    }
    // Returns the EIP712 type hash for the attest function.
    getAttestTypeHash() {
        return this.contract.getAttestTypeHash();
    }
    // Returns the EIP712 type hash for the revoke function.
    getRevokeTypeHash() {
        return this.contract.getRevokeTypeHash();
    }
}
exports.EAS = EAS;
//# sourceMappingURL=eas.js.map