"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimestampFromOffchainRevocationReceipt = exports.getTimestampFromTimestampReceipt = exports.getUIDsFromAttestReceipt = exports.getUIDsFromMultiAttestTx = exports.getUIDFromAttestTx = exports.ZERO_BYTES32 = exports.ZERO_BYTES = exports.ZERO_ADDRESS = void 0;
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
const TOPICS = {
    [Event.Attested]: (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)('Attested(address,address,bytes32,bytes32)')),
    [Event.Timestamped]: (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)('Timestamped(bytes32,uint64)')),
    [Event.RevokedOffchain]: (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)('RevokedOffchain(address,bytes32,uint64)'))
};
const getDataFromReceipt = (receipt, event, attribute) => {
    // eslint-disable-next-line camelcase
    const eas = new ethers_1.Interface(eas_contracts_1.EAS__factory.abi);
    const logs = [];
    for (const log of receipt.logs.filter((l) => l.topics[0] === TOPICS[event]) || []) {
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
const getUIDFromAttestTx = async (res) => {
    return (await (0, exports.getUIDsFromMultiAttestTx)(res))[0];
};
exports.getUIDFromAttestTx = getUIDFromAttestTx;
const getUIDsFromMultiAttestTx = async (res) => {
    const tx = await res;
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error(`Unable to confirm: ${tx}`);
    }
    return (0, exports.getUIDsFromAttestReceipt)(receipt);
};
exports.getUIDsFromMultiAttestTx = getUIDsFromMultiAttestTx;
const getUIDsFromAttestReceipt = (receipt) => getDataFromReceipt(receipt, Event.Attested, 'uid');
exports.getUIDsFromAttestReceipt = getUIDsFromAttestReceipt;
const getTimestampFromTimestampReceipt = (receipt) => getDataFromReceipt(receipt, Event.Timestamped, 'timestamp').map((s) => BigInt(s));
exports.getTimestampFromTimestampReceipt = getTimestampFromTimestampReceipt;
const getTimestampFromOffchainRevocationReceipt = (receipt) => getDataFromReceipt(receipt, Event.RevokedOffchain, 'timestamp').map((s) => BigInt(s));
exports.getTimestampFromOffchainRevocationReceipt = getTimestampFromOffchainRevocationReceipt;
//# sourceMappingURL=utils.js.map