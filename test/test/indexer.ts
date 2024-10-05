import {
  EAS as EASContract,
  Indexer as IndexerContract,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { EAS, NO_EXPIRATION } from '../../src/eas';
import { Indexer } from '../../src/indexer';
import { SchemaRegistry } from '../../src/schema-registry';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

describe('Indexer API', () => {
  let registry: SchemaRegistryContract;
  let eas: EAS;
  let easContract: EASContract;
  let indexerContract: IndexerContract;
  let indexer: Indexer;

  let sender: Signer;
  let recipient: Signer;

  before(async () => {
    [sender, recipient] = await ethers.getSigners();
  });

  beforeEach(async () => {
    registry = await Contracts.SchemaRegistry.deploy();
    easContract = await Contracts.EAS.deploy(await registry.getAddress());

    eas = new EAS(await easContract.getAddress(), { signer: sender });
    indexerContract = await Contracts.Indexer.deploy(await easContract.getAddress());
    indexer = new Indexer(await indexerContract.getAddress(), { signer: sender });
  });

  describe('construction', () => {
    it('should properly create an Indexer API', async () => {
      expect(await indexer.getVersion()).to.equal(await indexerContract.version());

      expect(await indexer.getEAS()).to.equal(await easContract.getAddress());
    });
  });

  describe('indexing', () => {
    context('with attestations', () => {
      const schema = 'bool liked';
      const schemaId = SchemaRegistry.getSchemaUID(schema, ZERO_ADDRESS, true);
      let uids: string[] = [];

      beforeEach(async () => {
        await registry.register(schema, ZERO_ADDRESS, true);
      });

      beforeEach(async () => {
        uids = [];

        for (let i = 0; i < 3; i++) {
          const uid = await (
            await eas.attest({
              schema: schemaId,
              data: {
                recipient: await recipient.getAddress(),
                expirationTime: NO_EXPIRATION,
                revocable: true,
                refUID: ZERO_BYTES32,
                data: ZERO_BYTES
              }
            })
          ).wait();
          uids.push(uid);
        }
      });

      interface UIDInfo {
        receivedAttestationsCount: bigint;
        receivedAttestations: string[];
        sentAttestationsCount: bigint;
        sentAttestations: string[];
        schemaAttesterRecipientAttestationCount: bigint;
        schemaAttesterRecipientAttestations: string[];
        schemaAttestationUIDCount: bigint;
        schemaAttestationUIDs: string[];
      }

      const expectIndexedAttestations = async (uids: string[]) => {
        const infos: Record<string, UIDInfo> = {};

        for (const uid of uids) {
          const info: UIDInfo = {
            receivedAttestationsCount: 0n,
            receivedAttestations: [],
            sentAttestationsCount: 0n,
            sentAttestations: [],
            schemaAttesterRecipientAttestationCount: 0n,
            schemaAttesterRecipientAttestations: [],
            schemaAttestationUIDCount: 0n,
            schemaAttestationUIDs: []
          };

          expect(await indexer.isAttestationIndexed({ uid })).to.be.false;

          info.receivedAttestationsCount = await indexer.getReceivedAttestationUIDCount({
            recipient: await recipient.getAddress(),
            schema: schemaId
          });
          info.receivedAttestations = await indexer.getReceivedAttestationUIDs({
            recipient: await recipient.getAddress(),
            schema: schemaId,
            start: 0n,
            length: info.receivedAttestationsCount,
            reverseOrder: false
          });

          expect(info.receivedAttestations).not.to.include(uid);

          info.sentAttestationsCount = await indexer.getSentAttestationUIDCount({
            attester: await sender.getAddress(),
            schema: schemaId
          });
          info.sentAttestations = await indexer.getSentAttestationUIDs({
            attester: await sender.getAddress(),
            schema: schemaId,
            start: 0n,
            length: info.sentAttestationsCount,
            reverseOrder: false
          });

          expect(info.sentAttestations).not.to.include(uid);

          info.schemaAttesterRecipientAttestationCount = await indexer.getSchemaAttesterRecipientAttestationUIDCount({
            schema: schemaId,
            attester: await sender.getAddress(),
            recipient: await recipient.getAddress()
          });
          info.schemaAttesterRecipientAttestations = await indexer.getSchemaAttesterRecipientAttestationUIDs({
            schema: schemaId,
            attester: await sender.getAddress(),
            recipient: await recipient.getAddress(),
            start: 0n,
            length: info.schemaAttesterRecipientAttestationCount,
            reverseOrder: false
          });

          expect(info.schemaAttesterRecipientAttestations).not.to.include(uid);

          info.schemaAttestationUIDCount = await indexer.getSchemaAttestationUIDCount({ schema: schemaId });
          info.schemaAttestationUIDs = await indexer.getSchemaAttestationUIDs({
            schema: schemaId,
            start: 0n,
            length: info.schemaAttestationUIDCount,
            reverseOrder: false
          });

          expect(info.schemaAttestationUIDs).not.to.include(uid);

          infos[uid] = info;
        }

        const tx =
          uids.length === 1
            ? await indexer.indexAttestation({ uid: uids[0] })
            : await indexer.indexAttestations({ uids });
        await tx.wait();

        for (const uid of uids) {
          const info = infos[uid];

          expect(await indexer.isAttestationIndexed({ uid })).to.be.true;

          const receivedAttestationsCount = await indexer.getReceivedAttestationUIDCount({
            recipient: await recipient.getAddress(),
            schema: schemaId
          });
          expect(receivedAttestationsCount).to.equal(info.receivedAttestationsCount + BigInt(uids.length));
          expect(
            await indexer.getReceivedAttestationUIDs({
              recipient: await recipient.getAddress(),
              schema: schemaId,
              start: 0n,
              length: receivedAttestationsCount,
              reverseOrder: false
            })
          ).to.include(uid);

          const sentAttestationsCount = await indexer.getSentAttestationUIDCount({
            attester: await sender.getAddress(),
            schema: schemaId
          });
          expect(sentAttestationsCount).to.equal(info.sentAttestationsCount + BigInt(uids.length));
          expect(
            await indexer.getSentAttestationUIDs({
              attester: await sender.getAddress(),
              schema: schemaId,
              start: 0n,
              length: sentAttestationsCount,
              reverseOrder: false
            })
          ).to.include(uid);

          const schemaAttesterRecipientAttestationCount = await indexer.getSchemaAttesterRecipientAttestationUIDCount({
            schema: schemaId,
            attester: await sender.getAddress(),
            recipient: await recipient.getAddress()
          });
          expect(schemaAttesterRecipientAttestationCount).to.equal(
            info.schemaAttesterRecipientAttestationCount + BigInt(uids.length)
          );
          expect(
            await indexer.getSchemaAttesterRecipientAttestationUIDs({
              schema: schemaId,
              attester: await sender.getAddress(),
              recipient: await recipient.getAddress(),
              start: 0n,
              length: schemaAttesterRecipientAttestationCount,
              reverseOrder: false
            })
          ).to.include(uid);

          const schemaAttestationUIDCount = await indexer.getSchemaAttestationUIDCount({ schema: schemaId });
          expect(schemaAttestationUIDCount).to.equal(info.schemaAttestationUIDCount + BigInt(uids.length));
          expect(
            await indexer.getSchemaAttestationUIDs({
              schema: schemaId,
              start: 0n,
              length: schemaAttestationUIDCount,
              reverseOrder: false
            })
          ).to.include(uid);
        }
      };

      const expectIndexedAttestation = (uid: string) => expectIndexedAttestations([uid]);

      it('should index an attestation', async () => {
        for (const uid of uids) {
          await expectIndexedAttestation(uid);
        }
      });

      it('should index multiple attestations', async () => {
        await expectIndexedAttestations(uids);
      });
    });
  });
});
