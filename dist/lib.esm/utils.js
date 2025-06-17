import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import { Interface, keccak256, toUtf8Bytes, ZeroAddress } from 'ethers';
export const ZERO_ADDRESS = ZeroAddress;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
var Event;
(function (Event) {
    Event["Attested"] = "Attested";
    Event["Timestamped"] = "Timestamped";
    Event["RevokedOffchain"] = "RevokedOffchain";
})(Event || (Event = {}));
const TOPICS = {
    [Event.Attested]: keccak256(toUtf8Bytes('Attested(address,address,bytes32,bytes32)')),
    [Event.Timestamped]: keccak256(toUtf8Bytes('Timestamped(bytes32,uint64)')),
    [Event.RevokedOffchain]: keccak256(toUtf8Bytes('RevokedOffchain(address,bytes32,uint64)'))
};
const getDataFromReceipt = (receipt, event, attribute) => {
    // eslint-disable-next-line camelcase
    const eas = new Interface(EAS__factory.abi);
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
export const getUIDFromAttestTx = async (res) => {
    return (await getUIDsFromMultiAttestTx(res))[0];
};
export const getUIDsFromMultiAttestTx = async (res) => {
    const tx = await res;
    const receipt = await tx.wait();
    if (!receipt) {
        throw new Error(`Unable to confirm: ${tx}`);
    }
    return getUIDsFromAttestReceipt(receipt);
};
export const getUIDsFromAttestReceipt = (receipt) => getDataFromReceipt(receipt, Event.Attested, 'uid');
export const getTimestampFromTimestampReceipt = (receipt) => getDataFromReceipt(receipt, Event.Timestamped, 'timestamp').map((s) => BigInt(s));
export const getTimestampFromOffchainRevocationReceipt = (receipt) => getDataFromReceipt(receipt, Event.RevokedOffchain, 'timestamp').map((s) => BigInt(s));
//# sourceMappingURL=utils.js.map