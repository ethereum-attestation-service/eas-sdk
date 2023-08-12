"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUIDFromDelegatedProxyAttestReceipt = exports.getUIDFromDelegatedProxyAttestTx = exports.getUIDFromMultiDelegatedProxyAttestReceipt = exports.getUIDFromMultiDelegatedProxyAttestTx = exports.getUIDFromAttestTx = exports.getUIDsFromMultiAttestTx = exports.getTimestampFromOffchainRevocationReceipt = exports.getTimestampFromTimestampReceipt = exports.getUIDsFromAttestReceipt = exports.getOffchainUID = exports.getUID = exports.getSchemaUID = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
const eas_contracts_1 = require("@ethereum-attestation-service/eas-contracts");
const ethers_1 = require("ethers");
exports.ZERO_ADDRESS = ethers_1.ZeroAddress;
exports.ZERO_BYTES = '0x';
exports.ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
var Event;
(function (Event) {
    Event["Attested"] = "Attested";
    Event["Timestamped"] = "Timestamped";
    Event["RevokedOffchain"] = "RevokedOffchain";
})(Event || (Event = {}));
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
const getDataFromReceipt = (receipt, event, attribute) => {
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    const logs = [];
    for (const log of receipt.logs || []) {
        logs.push({
            ...log,
            log: event,
            fragment: {
                name: event
            },
            args: eas.decodeEventLog(event, log.data, log.topics)
        });
    }
    if (!logs) {
        return [];
    }
    const filteredLogs = logs.filter((l) => l.fragment?.name === event);
    if (filteredLogs.length === 0) {
        throw new Error(`Unable to process ${event} events`);
    }
    return filteredLogs.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (log) => eas.decodeEventLog(event, log.data, log.topics)[attribute]);
};
const getUIDsFromAttestReceipt = (receipt) => getDataFromReceipt(receipt, Event.Attested, 'uid');
exports.getUIDsFromAttestReceipt = getUIDsFromAttestReceipt;
const getTimestampFromTimestampReceipt = (receipt) => getDataFromReceipt(receipt, Event.Timestamped, 'timestamp').map((s) => BigInt(s));
exports.getTimestampFromTimestampReceipt = getTimestampFromTimestampReceipt;
const getTimestampFromOffchainRevocationReceipt = (receipt) => getDataFromReceipt(receipt, Event.RevokedOffchain, 'timestamp').map((s) => BigInt(s));
exports.getTimestampFromOffchainRevocationReceipt = getTimestampFromOffchainRevocationReceipt;
const getUIDsFromMultiAttestTx = async (res) => {
    const tx = await res;
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error(`Unable to confirm: ${tx}`);
    }
    return (0, exports.getUIDsFromAttestReceipt)(receipt);
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
    return (0, exports.getUIDsFromAttestReceipt)(receipt);
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
//# sourceMappingURL=utils.js.map