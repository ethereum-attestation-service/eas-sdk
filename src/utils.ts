import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import {
  hexlify,
  Interface,
  keccak256,
  solidityPackedKeccak256,
  toUtf8Bytes,
  TransactionReceipt,
  TransactionResponse,
  ZeroAddress
} from 'ethers';
import { OffchainAttestationVersion } from './offchain';

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

export const getSchemaUID = (schema: string, resolverAddress: string, revocable: boolean) =>
  solidityPackedKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);

export const getUID = (
  schema: string,
  recipient: string,
  attester: string,
  time: bigint,
  expirationTime: bigint,
  revocable: boolean,
  refUID: string,
  data: string,
  bump: number
) =>
  solidityPackedKeccak256(
    ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
    [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUID, data, bump]
  );

export const getOffchainUID = (
  version: number,
  schema: string,
  recipient: string,
  time: bigint,
  expirationTime: bigint,
  revocable: boolean,
  refUID: string,
  data: string,
  salt?: string
) => {
  switch (version) {
    case OffchainAttestationVersion.Legacy:
      return solidityPackedKeccak256(
        ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
        [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]
      );

    case OffchainAttestationVersion.Version1:
      return solidityPackedKeccak256(
        ['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
        [
          version,
          hexlify(toUtf8Bytes(schema)),
          recipient,
          ZERO_ADDRESS,
          time,
          expirationTime,
          revocable,
          refUID,
          data,
          0
        ]
      );

    case OffchainAttestationVersion.Version2:
      return solidityPackedKeccak256(
        ['uint16', 'bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'bytes32', 'uint32'],
        [
          version,
          hexlify(toUtf8Bytes(schema)),
          recipient,
          ZERO_ADDRESS,
          time,
          expirationTime,
          revocable,
          refUID,
          data,
          salt,
          0
        ]
      );

    default:
      throw new Error('Unsupported version');
  }
};

const getDataFromReceipt = (receipt: TransactionReceipt, event: Event, attribute: string): string[] => {
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
