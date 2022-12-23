import { EAS } from '../../../src/eas';
import {
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Request,
  EIP712RevocationParams
} from '../../../src/offchain/delegated';
import { getOffchainUUID } from '../../../src/utils';
import { ZERO_BYTES32 } from '../../utils/Constants';
import { EIP712Utils } from './EIP712Utils';
import { OffchainUtils } from './offchain-utils';
import { latest } from './time';
import { EIP712Verifier, SchemaRegistry, SchemaResolver } from '@ethereum-attestation-service/eas-contracts';
import {
  AttestationStructOutput,
  MultiDelegatedAttestationRequestStruct,
  MultiDelegatedRevocationRequestStruct
} from '@ethereum-attestation-service/eas-contracts/dist/typechain-types/contracts/IEAS';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber, BigNumberish, ContractTransaction, utils, Wallet } from 'ethers';

const { solidityKeccak256, hexlify, toUtf8Bytes } = utils;

export const getSchemaUUID = (schema: string, resolverAddress: string, revocable: boolean) =>
  solidityKeccak256(['string', 'address', 'bool'], [schema, resolverAddress, revocable]);

export const getUUID = (
  schema: string,
  recipient: string,
  attester: string,
  time: number,
  expirationTime: number,
  revocable: boolean,
  refUUID: string,
  data: string,
  bump: number
) =>
  solidityKeccak256(
    ['bytes', 'address', 'address', 'uint32', 'uint32', 'bool', 'bytes32', 'bytes', 'uint32'],
    [hexlify(toUtf8Bytes(schema)), recipient, attester, time, expirationTime, revocable, refUUID, data, bump]
  );

export const registerSchema = async (
  schema: string,
  registry: SchemaRegistry,
  resolver: SchemaResolver | string,
  revocable: boolean
) => {
  const address = typeof resolver === 'string' ? resolver : resolver.address;
  await registry.register(schema, address, revocable);

  return getSchemaUUID(schema, address, revocable);
};

export const getUUIDFromAttestTx = async (res: Promise<ContractTransaction> | ContractTransaction) => {
  const receipt = await (await res).wait();
  const event = receipt.events?.find((e) => e.event === 'Attested');
  if (!event) {
    throw new Error('Unable to process attestation event');
  }
  return event.args?.uuid;
};

export const getUUIDFromMultiAttestTx = async (res: Promise<ContractTransaction> | ContractTransaction) => {
  const receipt = await (await res).wait();
  const events = receipt.events?.filter((e) => e.event === 'Attested');
  if (!events || events?.length === 0) {
    throw new Error('Unable to process attestation event');
  }

  return events.map((event) => event.args?.uuid);
};

export enum SignatureType {
  Direct = 'direct',
  Delegated = 'delegated',
  Offchain = 'offchain'
}

export interface RequestContracts {
  eas: EAS;
  verifier?: EIP712Verifier;
  eip712Utils?: EIP712Utils;
  offchainUtils?: OffchainUtils;
}

export interface AttestationOptions {
  signatureType?: SignatureType;
  from: Wallet | SignerWithAddress;
  value?: BigNumberish;
  bump?: number;
}

export interface AttestationRequestData {
  recipient: string;
  expirationTime: number;
  revocable?: boolean;
  refUUID?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  value?: BigNumberish;
}

export interface MultiAttestationRequest {
  schema: string;
  requests: AttestationRequestData[];
}

export interface MultiDelegateAttestationRequest {
  schema: string;
  data: AttestationRequestData[];
  signatures: EIP712Request<EIP712MessageTypes, EIP712AttestationParams>[];
  attester: string;
}

export interface RevocationOptions {
  signatureType?: SignatureType;
  from: Wallet | SignerWithAddress;
  value?: BigNumberish;
}

export interface RevocationRequestData {
  uuid: string;
  value?: BigNumberish;
}

export interface MultiRevocationRequest {
  schema: string;
  requests: RevocationRequestData[];
}

export interface MultiDelegateRevocationRequest {
  schema: string;
  data: RevocationRequestData[];
  signatures: EIP712Request<EIP712MessageTypes, EIP712RevocationParams>[];
  attester: string;
}

export const expectAttestation = async (
  contracts: RequestContracts,
  schema: string,
  request: AttestationRequestData,
  options: AttestationOptions
) => {
  const { eas, verifier, eip712Utils, offchainUtils } = contracts;
  const {
    recipient,
    expirationTime,
    revocable = true,
    refUUID = ZERO_BYTES32,
    data = ZERO_BYTES32,
    value = 0
  } = request;
  const { from: txSender, signatureType = SignatureType.Direct } = options;

  let uuid;

  switch (signatureType) {
    case SignatureType.Direct: {
      uuid = await eas
        .connect(txSender)
        .attest({ schema, data: { recipient, expirationTime, revocable, refUUID, data, value } });

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const signature = await eip712Utils.signDelegatedAttestation(
        txSender,
        schema,
        recipient,
        expirationTime,
        revocable,
        refUUID,
        data,
        await verifier.getNonce(txSender.address)
      );

      expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, signature)).to.be.true;

      uuid = await eas.connect(txSender).attestByDelegation({
        schema,
        data: { recipient, expirationTime, revocable, refUUID, data, value },
        signature,
        attester: txSender.address
      });

      break;
    }

    case SignatureType.Offchain: {
      if (!offchainUtils) {
        throw new Error('Invalid offchain utils');
      }

      const now = await latest();
      const uuid = getOffchainUUID(schema, recipient, now, expirationTime, revocable, refUUID, data);
      const request = await offchainUtils.signAttestation(
        txSender,
        schema,
        recipient,
        now,
        expirationTime,
        revocable,
        refUUID,
        data
      );
      expect(request.uuid).to.equal(uuid);
      expect(await offchainUtils.verifyAttestation(txSender.address, request)).to.be.true;

      return;
    }
  }

  expect(await eas.isAttestationValid({ uuid })).to.be.true;
};

// export const expectMultiAttestations = async (
//   contracts: RequestContracts,
//   requests: MultiAttestationRequest[],
//   options: AttestationOptions
// ) => {
//   const { eas, verifier, eip712Utils } = contracts;

//   const multiAttestationRequests = requests.map((r) => ({
//     schema: r.schema,
//     data: r.requests.map((d) => ({
//       recipient: d.recipient,
//       expirationTime: d.expirationTime,
//       revocable: d.revocable ?? true,
//       refUUID: d.refUUID ?? ZERO_BYTES32,
//       data: d.data ?? ZERO_BYTES32,
//       value: d.value ?? 0
//     }))
//   }));

//   const { from: txSender, signatureType = SignatureType.Direct } = options;

//   const prevBalance = await getBalance(txSender.address);

//   const requestedValue = multiAttestationRequests.reduce((res, { data }) => {
//     const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));
//     return res.add(total);
//   }, BigNumber.from(0));
//   const msgValue = options.value ?? requestedValue;

//   let uuids: string[] = [];
//   let res: ContractTransaction;

//   switch (signatureType) {
//     case SignatureType.Direct: {
//       const args = [
//         multiAttestationRequests,
//         {
//           value: msgValue
//         }
//       ] as const;

//       const returnedUuids = await eas.connect(txSender).multiAttest(...args);
//       res = await eas.connect(txSender).multiAttest(...args);

//       uuids = await getUUIDFromMultiAttestTx(res);
//       expect(uuids).to.deep.equal(returnedUuids);

//       break;
//     }

//     case SignatureType.Delegated: {
//       if (!eip712Utils || !verifier) {
//         throw new Error('Invalid verifier');
//       }

//       const multiDelegatedAttestationRequests: MultiDelegatedAttestationRequestStruct[] = [];

//       let nonce = await verifier.getNonce(txSender.address);

//       for (const { schema, data } of multiAttestationRequests) {
//         const signatures: EIP712Request<EIP712MessageTypes, EIP712AttestationParams>[] = [];

//         for (const request of data) {
//           const signature = await eip712Utils.signDelegatedAttestation(
//             txSender,
//             schema,
//             request.recipient,
//             request.expirationTime,
//             request.revocable,
//             request.refUUID,
//             request.data,
//             nonce
//           );

//           expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, signature)).to.be.true;

//           signatures.push(signature);

//           nonce = nonce.add(1);
//         }

//         multiDelegatedAttestationRequests.push({ schema, data, signatures, attester: txSender.address });
//       }

//       const args = [multiDelegatedAttestationRequests, { value: msgValue }] as const;

//       const returnedUuids = await eas.connect(txSender).callStatic.multiAttestByDelegation(...args);
//       res = await eas.connect(txSender).multiAttestByDelegation(...args);

//       uuids = await getUUIDFromMultiAttestTx(res);
//       expect(uuids).to.deep.equal(returnedUuids);

//       break;
//     }

//     case SignatureType.Offchain: {
//       throw new Error('Offchain batch attestations are unsupported');
//     }
//   }

//   if (!options.skipBalanceCheck) {
//     const transactionCost = await getTransactionCost(res);

//     expect(await getBalance(txSender.address)).to.equal(prevBalance.sub(requestedValue).sub(transactionCost));
//   }

//   let i = 0;
//   for (const { schema, data } of multiAttestationRequests) {
//     for (const request of data) {
//       const uuid = uuids[i++];

//       await expect(res).to.emit(eas, 'Attested').withArgs(request.recipient, txSender.address, uuid, schema);

//       expect(await eas.isAttestationValid(uuid)).to.be.true;

//       const attestation = await eas.getAttestation(uuid);
//       expect(attestation.uuid).to.equal(uuid);
//       expect(attestation.schema).to.equal(schema);
//       expect(attestation.recipient).to.equal(request.recipient);
//       expect(attestation.attester).to.equal(txSender.address);
//       expect(attestation.time).to.equal(await latest());
//       expect(attestation.expirationTime).to.equal(request.expirationTime);
//       expect(attestation.revocationTime).to.equal(0);
//       expect(attestation.revocable).to.equal(request.revocable);
//       expect(attestation.refUUID).to.equal(request.refUUID);
//       expect(attestation.data).to.equal(request.data);
//     }
//   }

//   return { uuids, res };
// };

export const expectRevocation = async (
  contracts: RequestContracts,
  schema: string,
  request: RevocationRequestData,
  options: RevocationOptions
) => {
  const { eas, verifier, eip712Utils } = contracts;
  const { uuid, value = 0 } = request;
  const { from: txSender, signatureType = SignatureType.Direct } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).revoke({ schema, data: { uuid, value } });

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils || !verifier) {
        throw new Error('Invalid verifier');
      }

      const signature = await eip712Utils.signDelegatedRevocation(
        txSender,
        schema,
        uuid,
        await verifier.getNonce(txSender.address)
      );

      await eas.connect(txSender).revokeByDelegation({
        schema,
        data: { uuid, value },
        signature,
        revoker: txSender.address
      });

      break;
    }
  }

  expect(await eas.isAttestationRevoked({ uuid })).to.be.true;
};

// export const expectMultiRevocations = async (
//   contracts: RequestContracts,
//   requests: MultiRevocationRequest[],
//   options: RevocationOptions
// ) => {
//   const { eas, verifier, eip712Utils } = contracts;

//   const multiRevocationRequests = requests.map((r) => ({
//     schema: r.schema,
//     data: r.requests.map((d) => ({
//       uuid: d.uuid,
//       value: d.value ?? 0
//     }))
//   }));

//   const { from: txSender, signatureType = SignatureType.Direct } = options;

//   const prevBalance = await getBalance(txSender.address);
//   const attestations: Record<string, AttestationStructOutput> = {};
//   for (const data of requests) {
//     for (const request of data.requests) {
//       attestations[request.uuid] = await eas.getAttestation(request.uuid);
//     }
//   }

//   const requestedValue = multiRevocationRequests.reduce((res, { data }) => {
//     const total = data.reduce((res, r) => res.add(r.value), BigNumber.from(0));

//     return res.add(total);
//   }, BigNumber.from(0));
//   const msgValue = options.value ?? requestedValue;

//   let res: ContractTransaction;

//   switch (signatureType) {
//     case SignatureType.Direct: {
//       res = await eas.connect(txSender).multiRevoke(multiRevocationRequests, {
//         value: msgValue
//       });

//       break;
//     }

//     case SignatureType.Delegated: {
//       if (!eip712Utils || !verifier) {
//         throw new Error('Invalid verifier');
//       }

//       const multiDelegatedRevocationRequests: MultiDelegatedRevocationRequestStruct[] = [];

//       let nonce = await verifier.getNonce(txSender.address);

//       for (const { schema, data } of multiRevocationRequests) {
//         const signatures: EIP712Request<EIP712MessageTypes, EIP712RevocationParams>[] = [];

//         for (const request of data) {
//           const signature = await eip712Utils.signDelegatedRevocation(txSender, schema, request.uuid, nonce);

//           expect(await eip712Utils.verifyDelegatedRevocationSignature(txSender.address, signature)).to.be.true;

//           signatures.push(signature);

//           nonce = nonce.add(1);
//         }

//         multiDelegatedRevocationRequests.push({ schema, data, signatures, revoker: txSender.address });
//       }

//       res = await eas.connect(txSender).multiRevokeByDelegation(multiDelegatedRevocationRequests, { value: msgValue });

//       break;
//     }
//   }

//   if (!options.skipBalanceCheck) {
//     const transactionCost = await getTransactionCost(res);

//     expect(await getBalance(txSender.address)).to.equal(prevBalance.sub(requestedValue).sub(transactionCost));
//   }

//   for (const data of requests) {
//     for (const request of data.requests) {
//       const attestation = attestations[request.uuid];
//       await expect(res)
//         .to.emit(eas, 'Revoked')
//         .withArgs(attestation.recipient, txSender.address, request.uuid, attestation.schema);

//       expect(await eas.isAttestationValid(request.uuid)).to.be.true;

//       const attestation2 = await eas.getAttestation(request.uuid);
//       expect(attestation2.revocationTime).to.equal(await latest());
//     }
//   }

//   return res;
// };
