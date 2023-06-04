"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimestampFromOffchainRevocationEvents = exports.getTimestampFromTimestampEvents = exports.getUIDsFromAttestEvents = exports.getUIDFromDelegatedProxyAttestReceipt = exports.getUIDFromDelegatedProxyAttestTx = exports.getUIDFromMultiDelegatedProxyAttestReceipt = exports.getUIDFromMultiDelegatedProxyAttestTx = exports.getUIDFromAttestTx = exports.getUIDsFromMultiAttestTx = exports.getOffchainUID = exports.getUID = exports.getSchemaUID = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const abi_1 = require("@ethersproject/abi");
const ethers_1 = require("ethers");
const { solidityKeccak256, hexlify, toUtf8Bytes } = ethers_1.utils;
const { AddressZero } = ethers_1.constants;
exports.ZERO_ADDRESS = AddressZero;
exports.ZERO_BYTES = '0x';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const getSchemaUID = (schema, resolverAddress, revocable) => solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
exports.getSchemaUID = getSchemaUID;
const getUID = (schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump) => solidityKeccak256(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]);
exports.getUID = getUID;
const getOffchainUID = (version, schema, recipient, time, expirationTime, revocable, refUID, data) => {
    switch (version) {
        case 0:
            return solidityKeccak256(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [hexlify(toUtf8Bytes(schema)), recipient, exports.ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]);
        case 1:
            return solidityKeccak256(['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [
                version,
                hexlify(toUtf8Bytes(schema)),
                recipient,
                exports.ZERO_ADDRESS,
                time,
                expirationTime,
                revocable,
                refUID,
                data,
                0
            ]);
        default:
            throw new Error('Unsupported version');
    }
};
exports.getOffchainUID = getOffchainUID;
const getUIDsFromMultiAttestTx = async (res) => {
    const receipt = await (await res).wait();
    return (0, exports.getUIDsFromAttestEvents)(receipt.events);
};
exports.getUIDsFromMultiAttestTx = getUIDsFromMultiAttestTx;
const getUIDFromAttestTx = async (res) => {
    return (await (0, exports.getUIDsFromMultiAttestTx)(res))[0];
};
exports.getUIDFromAttestTx = getUIDFromAttestTx;
const getUIDFromMultiDelegatedProxyAttestTx = async (res) => {
    return (0, exports.getUIDFromMultiDelegatedProxyAttestReceipt)((await res).wait());
};
exports.getUIDFromMultiDelegatedProxyAttestTx = getUIDFromMultiDelegatedProxyAttestTx;
const getUIDFromMultiDelegatedProxyAttestReceipt = async (res) => {
    const receipt = await res;
    // eslint-disable-next-line camelcase
    const eas = new abi_1.Interface(eas_contracts_1.EAS__factory.abi);
    const events = [];
    for (const event of receipt.events || []) {
        events.push({
            event: 'Attested',
            args: await eas.decodeEventLog('Attested', event.data, event.topics)
        });
    }
    return (0, exports.getUIDsFromAttestEvents)(events);
};
exports.getUIDFromMultiDelegatedProxyAttestReceipt = getUIDFromMultiDelegatedProxyAttestReceipt;
const getUIDFromDelegatedProxyAttestTx = async (res) => {
    return (await (0, exports.getUIDFromMultiDelegatedProxyAttestTx)(res))[0];
};
exports.getUIDFromDelegatedProxyAttestTx = getUIDFromDelegatedProxyAttestTx;
const getUIDFromDelegatedProxyAttestReceipt = async (res) => {
    return (await (0, exports.getUIDFromMultiDelegatedProxyAttestReceipt)(res))[0];
};
exports.getUIDFromDelegatedProxyAttestReceipt = getUIDFromDelegatedProxyAttestReceipt;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUIDsFromAttestEvents = (events) => {
    if (!events) {
        return [];
    }
    const attestedEvents = events.filter((e) => e.event === 'Attested');
    if (attestedEvents.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    return attestedEvents.map((event) => event.args?.uid);
};
exports.getUIDsFromAttestEvents = getUIDsFromAttestEvents;
const getTimestampFromTimestampEvents = (events) => {
    if (!events) {
        return [];
    }
    const timestampedEvents = events.filter((e) => e.event === 'Timestamped');
    if (timestampedEvents.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    return timestampedEvents.map((event) => event.args?.timestamp);
};
exports.getTimestampFromTimestampEvents = getTimestampFromTimestampEvents;
const getTimestampFromOffchainRevocationEvents = (events) => {
    if (!events) {
        return [];
    }
    const revocationEvents = events.filter((e) => e.event === 'RevokedOffchain');
    if (revocationEvents.length === 0) {
        throw new Error('Unable to process offchain revocation events');
    }
    return revocationEvents.map((event) => event.args?.timestamp);
};
exports.getTimestampFromOffchainRevocationEvents = getTimestampFromOffchainRevocationEvents;
//# sourceMappingURL=utils.js.map