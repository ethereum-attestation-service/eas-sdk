import {
  AttestationRequestData,
  EAS,
  MultiAttestationRequest,
  MultiDelegatedAttestationRequest,
  MultiDelegatedProxyAttestationRequest,
  MultiDelegatedProxyRevocationRequest,
  MultiDelegatedRevocationRequest,
  MultiRevocationRequest,
  NO_EXPIRATION,
  RevocationRequestData
} from '../../../src/eas';
import {
  EIP712AttestationParams,
  EIP712MessageTypes,
  EIP712Response,
  EIP712RevocationParams
} from '../../../src/offchain/delegated';
import { EIP712AttestationProxyParams, EIP712RevocationProxyParams } from '../../../src/offchain/delegated-proxy';
import { getOffchainUID } from '../../../src/utils';
import { ZERO_BYTES, ZERO_BYTES32 } from '../../utils/Constants';
import { EIP712ProxyUtils } from './eip712-proxy-utils';
import { EIP712Utils } from './eip712-utils';
import { OffchainUtils } from './offchain-utils';
import { latest } from './time';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumberish, Wallet } from 'ethers';

export enum SignatureType {
  Direct = 'direct',
  Delegated = 'delegated',
  DelegatedProxy = 'delegated-proxy',
  Offchain = 'offchain'
}

export interface RequestContracts {
  eas: EAS;
  eip712Utils?: EIP712Utils;
  offchainUtils?: OffchainUtils;
  eip712ProxyUtils?: EIP712ProxyUtils;
}

export interface AttestationOptions {
  signatureType?: SignatureType;
  from: Wallet | SignerWithAddress;
  deadline?: number;
  value?: BigNumberish;
  bump?: number;
}

export interface RevocationOptions {
  signatureType?: SignatureType;
  deadline?: number;
  from: Wallet | SignerWithAddress;
  value?: BigNumberish;
}

export const expectAttestation = async (
  contracts: RequestContracts,
  schema: string,
  request: AttestationRequestData,
  options: AttestationOptions
) => {
  const { eas, eip712Utils, eip712ProxyUtils, offchainUtils } = contracts;
  const {
    recipient,
    expirationTime = NO_EXPIRATION,
    revocable = true,
    refUID = ZERO_BYTES32,
    data = ZERO_BYTES,
    value = 0
  } = request;
  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  let uid;

  switch (signatureType) {
    case SignatureType.Direct: {
      uid = await (
        await eas
          .connect(txSender)
          .attest({ schema, data: { recipient, expirationTime, revocable, refUID, data, value } })
      ).wait();

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils) {
        throw new Error('Invalid verifier');
      }

      const response = await eip712Utils.signDelegatedAttestation(
        txSender,
        schema,
        recipient,
        expirationTime,
        revocable,
        refUID,
        data,
        await eas.getNonce(txSender.address)
      );

      expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, response)).to.be.true;

      uid = await (
        await eas.connect(txSender).attestByDelegation({
          schema,
          data: { recipient, expirationTime, revocable, refUID, data, value },
          signature: response.signature,
          attester: txSender.address
        })
      ).wait();

      break;
    }

    case SignatureType.DelegatedProxy: {
      if (!eip712ProxyUtils) {
        throw new Error('Invalid proxy');
      }

      const response = await eip712ProxyUtils.signDelegatedProxyAttestation(
        txSender,
        schema,
        recipient,
        expirationTime,
        revocable,
        refUID,
        data,
        deadline
      );

      expect(await eip712ProxyUtils.verifyDelegatedProxyAttestationSignature(txSender.address, response)).to.be.true;

      uid = await (
        await eas.connect(txSender).attestByDelegationProxy({
          schema,
          data: { recipient, expirationTime, revocable, refUID, data, value },
          signature: response.signature,
          attester: txSender.address,
          deadline
        })
      ).wait();

      break;
    }

    case SignatureType.Offchain: {
      if (!offchainUtils) {
        throw new Error('Invalid offchain utils');
      }

      const now = await latest();
      const uid = getOffchainUID(schema, recipient, now, expirationTime, revocable, refUID, data);
      const response = await offchainUtils.signAttestation(
        txSender,
        schema,
        recipient,
        now,
        expirationTime,
        revocable,
        refUID,
        data
      );
      expect(response.uid).to.equal(uid);
      expect(await offchainUtils.verifyAttestation(txSender.address, response)).to.be.true;

      return uid;
    }
  }

  expect(await eas.isAttestationValid(uid)).to.be.true;

  return uid;
};

export const expectMultiAttestations = async (
  contracts: RequestContracts,
  requests: MultiAttestationRequest[],
  options: AttestationOptions
) => {
  const { eas, eip712Utils, eip712ProxyUtils } = contracts;

  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  let uids: string[] = [];

  switch (signatureType) {
    case SignatureType.Direct: {
      const tx = await eas.connect(txSender).multiAttest(requests);
      uids = await tx.wait();

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils) {
        throw new Error('Invalid verifier');
      }

      const multiDelegatedAttestationRequests: MultiDelegatedAttestationRequest[] = [];

      let nonce = await eas.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>[] = [];

        for (const request of data) {
          const response = await eip712Utils.signDelegatedAttestation(
            txSender,
            schema,
            request.recipient,
            request.expirationTime ?? NO_EXPIRATION,
            request.revocable ?? true,
            request.refUID ?? ZERO_BYTES32,
            request.data,
            nonce
          );

          expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, response)).to.be.true;

          responses.push(response);

          nonce = nonce.add(1);
        }

        multiDelegatedAttestationRequests.push({
          schema,
          data,
          signatures: responses.map((r) => r.signature),
          attester: txSender.address
        });
      }

      const tx = await eas.connect(txSender).multiAttestByDelegation(multiDelegatedAttestationRequests);
      uids = await tx.wait();

      break;
    }

    case SignatureType.DelegatedProxy: {
      if (!eip712ProxyUtils) {
        throw new Error('Invalid proxy');
      }

      const multiDelegatedProxyAttestationRequests: MultiDelegatedProxyAttestationRequest[] = [];

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>[] = [];

        for (const request of data) {
          const response = await eip712ProxyUtils.signDelegatedProxyAttestation(
            txSender,
            schema,
            request.recipient,
            request.expirationTime ?? NO_EXPIRATION,
            request.revocable ?? true,
            request.refUID ?? ZERO_BYTES32,
            request.data,
            deadline
          );

          expect(await eip712ProxyUtils.verifyDelegatedProxyAttestationSignature(txSender.address, response)).to.be
            .true;

          responses.push(response);
        }

        multiDelegatedProxyAttestationRequests.push({
          schema,
          data,
          signatures: responses.map((r) => r.signature),
          attester: txSender.address,
          deadline
        });
      }

      const tx = await eas.connect(txSender).multiAttestByDelegationProxy(multiDelegatedProxyAttestationRequests);
      uids = await tx.wait();

      break;
    }

    case SignatureType.Offchain: {
      throw new Error('Offchain batch attestations are unsupported');
    }
  }

  for (const uid of uids) {
    expect(await eas.isAttestationValid(uid)).to.be.true;
  }
};

export const expectRevocation = async (
  contracts: RequestContracts,
  schema: string,
  request: RevocationRequestData,
  options: RevocationOptions
) => {
  const { eas, eip712Utils, eip712ProxyUtils } = contracts;
  const { uid, value = 0 } = request;
  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).revoke({ schema, data: { uid, value } });

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils) {
        throw new Error('Invalid verifier');
      }

      const { signature } = await eip712Utils.signDelegatedRevocation(
        txSender,
        schema,
        uid,
        await eas.getNonce(txSender.address)
      );

      await (
        await eas.connect(txSender).revokeByDelegation({
          schema,
          data: { uid, value },
          signature,
          revoker: txSender.address
        })
      ).wait();

      break;
    }

    case SignatureType.DelegatedProxy: {
      if (!eip712ProxyUtils) {
        throw new Error('Invalid proxy');
      }

      const { signature } = await eip712ProxyUtils.signDelegatedProxyRevocation(
        txSender,
        schema,
        uid,
        await eas.getNonce(txSender.address)
      );

      await (
        await eas.connect(txSender).revokeByDelegationProxy({
          schema,
          data: { uid, value },
          signature,
          revoker: txSender.address,
          deadline
        })
      ).wait();

      break;
    }
  }

  expect(await eas.isAttestationRevoked(uid)).to.be.true;
};

export const expectMultiRevocations = async (
  contracts: RequestContracts,
  requests: MultiRevocationRequest[],
  options: RevocationOptions
) => {
  const { eas, eip712Utils, eip712ProxyUtils } = contracts;

  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).multiRevoke(requests);

      break;
    }

    case SignatureType.Delegated: {
      if (!eip712Utils) {
        throw new Error('Invalid verifier');
      }

      const multiDelegatedRevocationRequests: MultiDelegatedRevocationRequest[] = [];

      let nonce = await eas.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>[] = [];

        for (const request of data) {
          const response = await eip712Utils.signDelegatedRevocation(txSender, schema, request.uid, nonce);

          expect(await eip712Utils.verifyDelegatedRevocationSignature(txSender.address, response)).to.be.true;

          responses.push(response);

          nonce = nonce.add(1);
        }

        multiDelegatedRevocationRequests.push({
          schema,
          data,
          signatures: responses.map((r) => r.signature),
          revoker: txSender.address
        });
      }

      await eas.connect(txSender).multiRevokeByDelegation(multiDelegatedRevocationRequests);

      break;
    }

    case SignatureType.DelegatedProxy: {
      if (!eip712ProxyUtils) {
        throw new Error('Invalid proxy');
      }

      const multiDelegatedProxyRevocationRequests: MultiDelegatedProxyRevocationRequest[] = [];

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>[] = [];

        for (const request of data) {
          const response = await eip712ProxyUtils.signDelegatedProxyRevocation(txSender, schema, request.uid, deadline);

          expect(await eip712ProxyUtils.verifyDelegatedProxyRevocationSignature(txSender.address, response)).to.be.true;

          responses.push(response);
        }

        multiDelegatedProxyRevocationRequests.push({
          schema,
          data,
          signatures: responses.map((r) => r.signature),
          revoker: txSender.address,
          deadline
        });
      }

      await eas.connect(txSender).multiRevokeByDelegationProxy(multiDelegatedProxyRevocationRequests);

      break;
    }
  }

  for (const data of requests) {
    for (const { uid } of data.data) {
      expect(await eas.isAttestationValid(uid)).to.be.true;
      expect(await eas.isAttestationRevoked(uid)).to.be.true;
    }
  }
};
