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
  eas: EAS,
  schema: string,
  request: AttestationRequestData,
  options: AttestationOptions
) => {
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
      const delegated = await eas.getDelegated();
      const response = await delegated.signDelegatedAttestation(
        {
          schema,
          recipient,
          expirationTime,
          revocable,
          refUID,
          data,
          nonce: await eas.getNonce(txSender.address)
        },
        txSender
      );

      expect(await delegated.verifyDelegatedAttestationSignature(txSender.address, response)).to.be.true;

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
      const proxy = await eas.getEIP712Proxy();
      if (!proxy) {
        throw new Error('Invalid proxy');
      }
      const delegated = await proxy?.getDelegated();

      const response = await delegated.signDelegatedProxyAttestation(
        {
          schema,
          recipient,
          expirationTime,
          revocable,
          refUID,
          data,
          deadline
        },
        txSender
      );

      expect(await delegated.verifyDelegatedProxyAttestationSignature(txSender.address, response)).to.be.true;

      uid = await (
        await eas.connect(txSender).attestByDelegationProxy({
          schema,
          data: { recipient, expirationTime, revocable, refUID, data, value },
          signature: response.signature,
          attester: txSender.address,
          deadline
        })
      ).wait();

      expect(await eas.getEIP712Proxy()?.getAttester(uid)).to.equal(txSender.address);

      break;
    }

    case SignatureType.Offchain: {
      const offchain = await eas.getOffchain();

      const now = await latest();
      const uid = getOffchainUID(schema, recipient, now, expirationTime, revocable, refUID, data);
      const response = await offchain.signOffchainAttestation(
        {
          schema,
          recipient,
          time: now,
          expirationTime,
          revocable,
          refUID,
          data
        },
        txSender
      );
      expect(response.uid).to.equal(uid);
      expect(await offchain.verifyOffchainAttestationSignature(txSender.address, response)).to.be.true;

      return uid;
    }
  }

  expect(await eas.isAttestationValid(uid)).to.be.true;

  return uid;
};

export const expectMultiAttestations = async (
  eas: EAS,
  requests: MultiAttestationRequest[],
  options: AttestationOptions
) => {
  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  let uids: string[] = [];

  switch (signatureType) {
    case SignatureType.Direct: {
      const tx = await eas.connect(txSender).multiAttest(requests);
      uids = await tx.wait();

      break;
    }

    case SignatureType.Delegated: {
      const multiDelegatedAttestationRequests: MultiDelegatedAttestationRequest[] = [];

      let nonce = await eas.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712AttestationParams>[] = [];

        for (const request of data) {
          const delegated = await eas.getDelegated();
          const response = await delegated.signDelegatedAttestation(
            {
              schema,
              recipient: request.recipient,
              expirationTime: request.expirationTime ?? NO_EXPIRATION,
              revocable: request.revocable ?? true,
              refUID: request.refUID ?? ZERO_BYTES32,
              data: request.data,
              nonce
            },
            txSender
          );

          expect(await delegated.verifyDelegatedAttestationSignature(txSender.address, response)).to.be.true;

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
      const proxy = await eas.getEIP712Proxy();
      if (!proxy) {
        throw new Error('Invalid proxy');
      }
      const delegated = await proxy?.getDelegated();

      const multiDelegatedProxyAttestationRequests: MultiDelegatedProxyAttestationRequest[] = [];

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712AttestationProxyParams>[] = [];

        for (const request of data) {
          const response = await delegated.signDelegatedProxyAttestation(
            {
              schema,
              recipient: request.recipient,
              expirationTime: request.expirationTime ?? NO_EXPIRATION,
              revocable: request.revocable ?? true,
              refUID: request.refUID ?? ZERO_BYTES32,
              data: request.data,
              deadline
            },
            txSender
          );

          expect(await delegated.verifyDelegatedProxyAttestationSignature(txSender.address, response)).to.be.true;

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

      for (const uid of uids) {
        expect(await eas.getEIP712Proxy()?.getAttester(uid)).to.equal(txSender.address);
      }

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
  eas: EAS,
  schema: string,
  request: RevocationRequestData,
  options: RevocationOptions
) => {
  const { uid, value = 0 } = request;
  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).revoke({ schema, data: { uid, value } });

      break;
    }

    case SignatureType.Delegated: {
      const delegated = await eas.getDelegated();
      const response = await delegated.signDelegatedRevocation(
        { schema, uid, nonce: await eas.getNonce(txSender.address) },
        txSender
      );

      expect(await delegated.verifyDelegatedRevocationSignature(txSender.address, response)).to.be.true;

      await (
        await eas.connect(txSender).revokeByDelegation({
          schema,
          data: { uid, value },
          signature: response.signature,
          revoker: txSender.address
        })
      ).wait();

      break;
    }

    case SignatureType.DelegatedProxy: {
      const proxy = await eas.getEIP712Proxy();
      if (!proxy) {
        throw new Error('Invalid proxy');
      }
      const delegated = await proxy?.getDelegated();

      const response = await delegated.signDelegatedProxyRevocation({ schema, uid, deadline }, txSender);

      expect(await delegated.verifyDelegatedProxyRevocationSignature(txSender.address, response)).to.be.true;

      await (
        await eas.connect(txSender).revokeByDelegationProxy({
          schema,
          data: { uid, value },
          signature: response.signature,
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
  eas: EAS,
  requests: MultiRevocationRequest[],
  options: RevocationOptions
) => {
  const { from: txSender, signatureType = SignatureType.Direct, deadline = NO_EXPIRATION } = options;

  switch (signatureType) {
    case SignatureType.Direct: {
      await eas.connect(txSender).multiRevoke(requests);

      break;
    }

    case SignatureType.Delegated: {
      const multiDelegatedRevocationRequests: MultiDelegatedRevocationRequest[] = [];

      let nonce = await eas.getNonce(txSender.address);

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712RevocationParams>[] = [];

        for (const request of data) {
          const delegated = await eas.getDelegated();
          const response = await delegated.signDelegatedRevocation({ schema, uid: request.uid, nonce }, txSender);

          expect(await delegated.verifyDelegatedRevocationSignature(txSender.address, response)).to.be.true;

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
      const proxy = await eas.getEIP712Proxy();
      if (!proxy) {
        throw new Error('Invalid proxy');
      }
      const delegated = await proxy?.getDelegated();

      const multiDelegatedProxyRevocationRequests: MultiDelegatedProxyRevocationRequest[] = [];

      for (const { schema, data } of requests) {
        const responses: EIP712Response<EIP712MessageTypes, EIP712RevocationProxyParams>[] = [];

        for (const request of data) {
          const response = await delegated.signDelegatedProxyRevocation(
            { schema, uid: request.uid, deadline },
            txSender
          );

          expect(await delegated.verifyDelegatedProxyRevocationSignature(txSender.address, response)).to.be.true;

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
