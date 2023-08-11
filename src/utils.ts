import { EAS__factory } from '@ethereum-attestation-service/eas-contracts';
import {
  hexlify,
  toUtf8Bytes,
  TransactionReceipt,
  ZeroAddress,
  TransactionResponse,
  Interface,
  solidityPackedKeccak256
} from 'ethers';

export const ZERO_ADDRESS = ZeroAddress;
export const ZERO_BYTES = '0x';
export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

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
  data: string
) => {
  switch (version) {
    case 0:
      return solidityPackedKeccak256(
        ['bytes', 'address', 'address', 'uint64', 'uint64', 'bool', 'bytes32', 'bytes', 'uint32'],
        [hexlify(toUtf8Bytes(schema)), recipient, ZERO_ADDRESS, time, expirationTime, revocable, refUID, data, 0]
      );

    case 1:
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

    default:
      throw new Error('Unsupported version');
  }
};

export const getUIDsFromMultiAttestTx = async (
  res: Promise<TransactionResponse> | TransactionResponse
): Promise<string[]> => {
  const tx = await res;
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error(`Unable to confirm: ${tx}`);
  }

  return getUIDsFromAttestEvents(receipt.logs);
};

export const getUIDFromAttestTx = async (res: Promise<TransactionResponse> | TransactionResponse): Promise<string> => {
  return (await getUIDsFromMultiAttestTx(res))[0];
};

export const getUIDFromMultiDelegatedProxyAttestTx = async (
  res: Promise<TransactionResponse> | TransactionResponse
): Promise<string[]> => {
  const tx = await res;
  const receipt = await tx.wait();
  if (!receipt) {
    throw new Error(`Unable to confirm: ${tx}`);
  }

  return getUIDFromMultiDelegatedProxyAttestReceipt(receipt);
};

export const getUIDFromMultiDelegatedProxyAttestReceipt = async (
  res: Promise<TransactionReceipt> | TransactionReceipt
): Promise<string[]> => {
  const receipt = await res;
  if (!receipt) {
    throw new Error(`Unable to confirm: ${res}`);
  }

  // eslint-disable-next-line camelcase
  const eas = new Interface(EAS__factory.abi);
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

  return getUIDsFromAttestEvents(logs);
};

export const getUIDFromDelegatedProxyAttestTx = async (
  res: Promise<TransactionResponse> | TransactionResponse
): Promise<string> => {
  return (await getUIDFromMultiDelegatedProxyAttestTx(res))[0];
};

export const getUIDFromDelegatedProxyAttestReceipt = async (
  res: Promise<TransactionReceipt> | TransactionReceipt
): Promise<string> => {
  return (await getUIDFromMultiDelegatedProxyAttestReceipt(res))[0];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUIDsFromAttestEvents = (logs?: ReadonlyArray<any>): string[] => {
  if (!logs) {
    return [];
  }

  const attestedLogs = logs.filter((l) => l.fragment?.name === 'Attested');
  if (attestedLogs.length === 0) {
    throw new Error('Unable to process attestation events');
  }

  // eslint-disable-next-line camelcase
  const eas = new Interface(EAS__factory.abi);
  return attestedLogs.map((log) => log.args.uid ?? eas.decodeEventLog('Attested', log.data, log.topics).uid);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTimestampFromTimestampEvents = (logs?: ReadonlyArray<any>): bigint[] => {
  if (!logs) {
    return [];
  }

  const timestampedEvents = logs.filter((l) => l.fragment?.name === 'Timestamped');
  if (timestampedEvents.length === 0) {
    throw new Error('Unable to process attestation events');
  }

  // eslint-disable-next-line camelcase
  const eas = new Interface(EAS__factory.abi);
  return timestampedEvents.map(
    (log) => log.args.uid ?? eas.decodeEventLog('Timestamped', log.data, log.topics).timestamp
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTimestampFromOffchainRevocationEvents = (logs?: ReadonlyArray<any>): bigint[] => {
  if (!logs) {
    return [];
  }

  const revocationEvents = logs.filter((l) => l.fragment?.name === 'RevokedOffchain');
  if (revocationEvents.length === 0) {
    throw new Error('Unable to process offchain revocation events');
  }

  // eslint-disable-next-line camelcase
  const eas = new Interface(EAS__factory.abi);
  return revocationEvents.map(
    (log) => log.args.uid ?? eas.decodeEventLog('RevokedOffchain', log.data, log.topics).timestamp
  );
};
