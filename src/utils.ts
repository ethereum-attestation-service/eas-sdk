import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import { Interface, keccak256, toUtf8Bytes, TransactionReceipt, TransactionResponse, ZeroAddress } from 'ethers';

export const ZERO_ADDRESS = ZeroAddress;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

enum Event {
  Attested = 'Attested',
  Timestamped = 'Timestamped',
  RevokedOffchain = 'RevokedOffchain'
}

const TOPICS = {
  [Event.Attested]: keccak256(toUtf8Bytes('Attested(address,address,bytes32,bytes32)')),
  [Event.Timestamped]: keccak256(toUtf8Bytes('Timestamped(bytes32,uint64)')),
  [Event.RevokedOffchain]: keccak256(toUtf8Bytes('RevokedOffchain(address,bytes32,uint64)'))
};

const getDataFromReceipt = (receipt: TransactionReceipt, event: Event, attribute: string): string[] => {
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
    (log: any) => eas.decodeEventLog(event, log.data, log.topics)[attribute]
  );
};

export const getUIDFromAttestTx = async (res: Promise<TransactionResponse> | TransactionResponse): Promise<string> => {
  return (await getUIDsFromMultiAttestTx(res))[0];
};

export const getUIDsFromMultiAttestTx = async (
  res: Promise<TransactionResponse> | TransactionResponse
): Promise<string[]> => {
  const tx = await res;
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error(`Unable to confirm: ${tx}`);
  }

  return getUIDsFromAttestReceipt(receipt);
};

export const getUIDsFromAttestReceipt = (receipt: TransactionReceipt): string[] =>
  getDataFromReceipt(receipt, Event.Attested, 'uid');

export const getTimestampFromTimestampReceipt = (receipt: TransactionReceipt): bigint[] =>
  getDataFromReceipt(receipt, Event.Timestamped, 'timestamp').map((s) => BigInt(s));

export const getTimestampFromOffchainRevocationReceipt = (receipt: TransactionReceipt): bigint[] =>
  getDataFromReceipt(receipt, Event.RevokedOffchain, 'timestamp').map((s) => BigInt(s));
