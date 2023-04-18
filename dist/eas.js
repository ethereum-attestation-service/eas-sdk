import { Base, Transaction } from './transaction';
import { getTimestampFromOffchainRevocationEvents, getTimestampFromTimestampEvents, getUIDFromDelegatedProxyAttestReceipt, getUIDFromMultiDelegatedProxyAttestReceipt, getUIDsFromAttestEvents, ZERO_BYTES32 } from './utils';
import { EAS__factory, EIP712Proxy__factory } from '@ethereum-attestation-service/eas-contracts';
import { BigNumber } from 'ethers';
export const NO_EXPIRATION = 0;
export class EAS extends Base {
    proxy;
    constructor(address, options) {
        const { signerOrProvider, proxy } = options || {};
        super(new EAS__factory(), address, signerOrProvider);
        if (proxy) {
            this.proxy = new Base(new EIP712Proxy__factory(), proxy, signerOrProvider);
        }
    }
    // Returns the version of the contract
    getVersion() {
        return this.contract.VERSION();
    }
    // Returns an existing schema by attestation UID
    getAttestation(uid) {
        return this.contract.getAttestation(uid);
    }
    // Returns whether an attestation is valid
    isAttestationValid(uid) {
        return this.contract.isAttestationValid(uid);
    }
    // Returns whether an attestation has been revoked
    async isAttestationRevoked(uid) {
        const attestation = await this.contract.getAttestation(uid);
        if (attestation.uid === ZERO_BYTES32) {
            throw new Error('Invalid attestation');
        }
        return !attestation.revocationTime.isZero();
    }
    // Returns the timestamp that the specified data was timestamped with.
    getTimestamp(data) {
        return this.contract.getTimestamp(data);
    }
    // Returns the timestamp that the specified data was timestamped with.
    getRevocationOffchain(user, uid) {
        return this.contract.getRevokeOffchain(user, uid);
    }
    // Attests to a specific schema
    async attest({ schema, data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 } }) {
        const tx = await this.contract.attest({ schema, data: { recipient, expirationTime, revocable, refUID, data, value } }, {
            value
        });
        return new Transaction(tx, async (receipt) => (await getUIDsFromAttestEvents(receipt.events))[0]);
    }
    // Attests to a specific schema via an EIP712 delegation request
    async attestByDelegation({ schema, data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 }, attester, signature }) {
        const tx = await this.contract.attestByDelegation({
            schema,
            data: {
                recipient,
                expirationTime,
                revocable,
                refUID,
                data,
                value
            },
            signature,
            attester
        }, { value });
        return new Transaction(tx, async (receipt) => (await getUIDsFromAttestEvents(receipt.events))[0]);
    }
    // Multi-attests to multiple schemas
    async multiAttest(requests) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
                expirationTime: d.expirationTime ?? NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUID: d.refUID ?? ZERO_BYTES32,
                data: d.data ?? ZERO_BYTES32,
                value: d.value ?? 0
            }))
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.contract.multiAttest(multiAttestationRequests, {
            value: requestedValue
        });
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getUIDsFromAttestEvents(receipt.events));
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests
    async multiAttestByDelegation(requests) {
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
                expirationTime: d.expirationTime ?? NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUID: d.refUID ?? ZERO_BYTES32,
                data: d.data ?? ZERO_BYTES32,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            attester: r.attester
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.contract.multiAttestByDelegation(multiAttestationRequests, {
            value: requestedValue
        });
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getUIDsFromAttestEvents(receipt.events));
    }
    // Revokes an existing attestation
    async revoke({ schema, data: { uid, value = 0 } }) {
        const tx = await this.contract.revoke({ schema, data: { uid, value } }, { value });
        return new Transaction(tx, async () => { });
    }
    // Revokes an existing attestation an EIP712 delegation request
    async revokeByDelegation({ schema, data: { uid, value = 0 }, signature, revoker }) {
        const tx = await this.contract.revokeByDelegation({
            schema,
            data: {
                uid,
                value
            },
            signature,
            revoker
        }, { value });
        return new Transaction(tx, async () => { });
    }
    // Multi-revokes multiple attestations
    async multiRevoke(requests) {
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uid: d.uid,
                value: d.value ?? 0
            }))
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.contract.multiRevoke(multiRevocationRequests, {
            value: requestedValue
        });
        return new Transaction(tx, async () => { });
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests
    async multiRevokeByDelegation(requests) {
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uid: d.uid,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            revoker: r.revoker
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.contract.multiRevokeByDelegation(multiRevocationRequests, {
            value: requestedValue
        });
        return new Transaction(tx, async () => { });
    }
    // Attests to a specific schema via an EIP712 delegation request using an external EIP712 proxy
    async attestByDelegationProxy({ schema, data: { recipient, data, expirationTime = NO_EXPIRATION, revocable = true, refUID = ZERO_BYTES32, value = 0 }, attester, signature, deadline }) {
        if (!this.proxy) {
            throw new Error("Proxy wasn't set");
        }
        const tx = await this.proxy.contract.attestByDelegation({
            schema,
            data: {
                recipient,
                expirationTime,
                revocable,
                refUID,
                data,
                value
            },
            signature,
            attester,
            deadline
        }, { value });
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getUIDFromDelegatedProxyAttestReceipt(receipt));
    }
    // Multi-attests to multiple schemas via an EIP712 delegation requests using an external EIP712 proxy
    async multiAttestByDelegationProxy(requests) {
        if (!this.proxy) {
            throw new Error("Proxy wasn't set");
        }
        const multiAttestationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                recipient: d.recipient,
                expirationTime: d.expirationTime ?? NO_EXPIRATION,
                revocable: d.revocable ?? true,
                refUID: d.refUID ?? ZERO_BYTES32,
                data: d.data ?? ZERO_BYTES32,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            attester: r.attester,
            deadline: r.deadline
        }));
        const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.proxy.contract.multiAttestByDelegation(multiAttestationRequests, {
            value: requestedValue
        });
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getUIDFromMultiDelegatedProxyAttestReceipt(receipt));
    }
    // Revokes an existing attestation an EIP712 delegation request using an external EIP712 proxy
    async revokeByDelegationProxy({ schema, data: { uid, value = 0 }, signature, revoker, deadline }) {
        if (!this.proxy) {
            throw new Error("Proxy wasn't set");
        }
        const tx = await this.proxy.contract.revokeByDelegation({
            schema,
            data: {
                uid,
                value
            },
            signature,
            revoker,
            deadline
        }, { value });
        return new Transaction(tx, async () => { });
    }
    // Multi-revokes multiple attestations via an EIP712 delegation requests using an external EIP712 proxy
    async multiRevokeByDelegationProxy(requests) {
        if (!this.proxy) {
            throw new Error("Proxy wasn't set");
        }
        const multiRevocationRequests = requests.map((r) => ({
            schema: r.schema,
            data: r.data.map((d) => ({
                uid: d.uid,
                value: d.value ?? 0
            })),
            signatures: r.signatures,
            revoker: r.revoker,
            deadline: r.deadline
        }));
        const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
            const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
            return res.add(total);
        }, BigNumber.from(0));
        const tx = await this.proxy.contract.multiRevokeByDelegation(multiRevocationRequests, {
            value: requestedValue
        });
        return new Transaction(tx, async () => { });
    }
    // Timestamps the specified bytes32 data.
    async timestamp(data) {
        const tx = await this.contract.timestamp(data);
        return new Transaction(tx, async (receipt) => (await getTimestampFromTimestampEvents(receipt.events))[0]);
    }
    // Timestamps the specified multiple bytes32 data.
    async multiTimestamp(data) {
        const tx = await this.contract.multiTimestamp(data);
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getTimestampFromTimestampEvents(receipt.events));
    }
    // Revokes the specified offchain attestation UID.
    async revokeOffchain(uid) {
        const tx = await this.contract.revokeOffchain(uid);
        return new Transaction(tx, async (receipt) => (await getTimestampFromOffchainRevocationEvents(receipt.events))[0]);
    }
    // Revokes the specified multiple offchain attestation UIDs.
    async multiRevokeOffchain(uids) {
        const tx = await this.contract.multiRevokeOffchain(uids);
        // eslint-disable-next-line require-await
        return new Transaction(tx, async (receipt) => getTimestampFromOffchainRevocationEvents(receipt.events));
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
//# sourceMappingURL=eas.js.map