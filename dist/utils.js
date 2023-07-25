"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimestampFromOffchainRevocationEvents = exports.getTimestampFromTimestampEvents = exports.getUIDsFromAttestEvents = exports.getUIDFromDelegatedProxyAttestReceipt = exports.getUIDFromDelegatedProxyAttestTx = exports.getUIDFromMultiDelegatedProxyAttestReceipt = exports.getUIDFromMultiDelegatedProxyAttestTx = exports.getUIDFromAttestTx = exports.getUIDsFromMultiAttestTx = exports.getOffchainUID = exports.getUID = exports.getSchemaUID = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
exports.ZERO_ADDRESS = ethers_1.ZeroAddress;
exports.ZERO_BYTES = '0x';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const getSchemaUID = (schema, resolverAddress, revocable) => (0, ethers_1.solidityPackedKeccak256)(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);
exports.getSchemaUID = getSchemaUID;
const getUID = (schema, recipient, attester, time, expirationTime, revocable, refUID, data, bump) => (0, ethers_1.solidityPackedKeccak256)(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [(0, ethers_1.hexlify)((0, ethers_1.toUtf8Bytes)(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]);
exports.getUID = getUID;
const getOffchainUID = (version, schema, recipient, time, expirationTime, revocable, refUID, data) => {
    switch (version) {
        case 0:
            return (0, ethers_1.solidityPackedKeccak256)(['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [(0, ethers_1.hexlify)((0, ethers_1.toUtf8Bytes)(schema)), recipient, exports.ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]);
        case 1:
            return (0, ethers_1.solidityPackedKeccak256)(['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'], [
                version,
                (0, ethers_1.hexlify)((0, ethers_1.toUtf8Bytes)(schema)),
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
    const tx = await res;
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error(`Unable to confirm: ${tx}`);
    }
    return (0, exports.getUIDsFromAttestEvents)(receipt.logs);
};
exports.getUIDsFromMultiAttestTx = getUIDsFromMultiAttestTx;
const getUIDFromAttestTx = async (res) => {
    return (await (0, exports.getUIDsFromMultiAttestTx)(res))[0];
};
exports.getUIDFromAttestTx = getUIDFromAttestTx;
const getUIDFromMultiDelegatedProxyAttestTx = async (res) => {
    const tx = await res;
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error(`Unable to confirm: ${tx}`);
    }
    return (0, exports.getUIDFromMultiDelegatedProxyAttestReceipt)(receipt);
};
exports.getUIDFromMultiDelegatedProxyAttestTx = getUIDFromMultiDelegatedProxyAttestTx;
const getUIDFromMultiDelegatedProxyAttestReceipt = async (res) => {
    const receipt = await res;
    if (!receipt) {
        throw new Error(`Unable to confirm: ${res}`);
    }
    // eslint-disable-next-line camelcase
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    const logs = [];
    for (const log of receipt.logs || []) {
        logs.push({
            log: 'Attested',
            fragment: {
                name: 'Attested'
            },
            args: eas.decodeEventLog('Attested', log.data, log.topics)
        });
    }
    return (0, exports.getUIDsFromAttestEvents)(logs);
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
const getUIDsFromAttestEvents = (logs) => {
    if (!logs) {
        return [];
    }
    const attestedLogs = logs.filter((l) => l.fragment?.name === 'Attested');
    if (attestedLogs.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    // eslint-disable-next-line camelcase
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    return attestedLogs.map((log) => log.args.uid ?? eas.decodeEventLog('Attested', log.data, log.topics).uid);
};
exports.getUIDsFromAttestEvents = getUIDsFromAttestEvents;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTimestampFromTimestampEvents = (logs) => {
    if (!logs) {
        return [];
    }
    const timestampedEvents = logs.filter((l) => l.fragment?.name === 'Timestamped');
    if (timestampedEvents.length === 0) {
        throw new Error('Unable to process attestation events');
    }
    // eslint-disable-next-line camelcase
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    return timestampedEvents.map((log) => log.args.uid ?? eas.decodeEventLog('Timestamped', log.data, log.topics).timestamp);
};
exports.getTimestampFromTimestampEvents = getTimestampFromTimestampEvents;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTimestampFromOffchainRevocationEvents = (logs) => {
    if (!logs) {
        return [];
    }
    const revocationEvents = logs.filter((l) => l.fragment?.name === 'RevokedOffchain');
    if (revocationEvents.length === 0) {
        throw new Error('Unable to process offchain revocation events');
    }
    // eslint-disable-next-line camelcase
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    return revocationEvents.map((log) => log.args.uid ?? eas.decodeEventLog('RevokedOffchain', log.data, log.topics).timestamp);
};
exports.getTimestampFromOffchainRevocationEvents = getTimestampFromOffchainRevocationEvents;
//# sourceMappingURL=utils.js.map