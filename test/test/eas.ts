import { EAS, NO_EXPIRATION } from '../../src/eas';
import { SchemaRegistry } from '../../src/schema-registry';
import { getSchemaUUID } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';
import { EIP712Utils } from './helpers/EIP712Utils';
import { duration, latest } from './helpers/time';
import { createWallet, Wallet } from './helpers/wallet';
import {
  EAS as EASContract,
  EIP712Verifier,
  SchemaRegistry as SchemaRegistryContract
} from '@ethereum-attestation-service/eas-contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish } from 'ethers';
import { ethers } from 'hardhat';

const { expect } = chai;

describe('EAS API', () => {
  let accounts: SignerWithAddress[];
  let sender: Wallet;
  let recipient: SignerWithAddress;
  let recipient2: SignerWithAddress;

  let registry: SchemaRegistryContract;
  let verifier: EIP712Verifier;
  let easContract: EASContract;
  let eip712Utils: EIP712Utils;

  let eas: EAS;
  let schemaRegistry: SchemaRegistry;

  before(async () => {
    accounts = await ethers.getSigners();

    [recipient, recipient2] = accounts;
  });

  beforeEach(async () => {
    sender = await createWallet();

    registry = await Contracts.SchemaRegistry.deploy();
    verifier = await Contracts.EIP712Verifier.deploy();
    eip712Utils = new EIP712Utils(verifier.address);

    easContract = await Contracts.EAS.deploy(registry.address, verifier.address);

    eas = new EAS(easContract.address);
    eas.connect(sender);

    schemaRegistry = new SchemaRegistry(registry.address);
    schemaRegistry.connect(sender);
  });

  interface Options {
    from?: Wallet;
    value?: BigNumberish;
    bump?: number;
  }

  describe('attesting', () => {
    let expirationTime: number;
    const data = '0x1234';

    beforeEach(async () => {
      expirationTime = (await latest()) + duration.days(30);
    });

    for (const delegation of [false, true]) {
      context(`${delegation ? 'via an EIP712 delegation' : 'directly'}`, () => {
        const expectAttestation = async (
          recipient: string,
          schema: string,
          expirationTime: number,
          refUUID: string,
          data: string,
          options?: Options
        ) => {
          const txSender = options?.from || sender;

          let uuid;

          if (!delegation) {
            uuid = await eas.connect(txSender).attest(recipient, schema, data, expirationTime, refUUID, {
              value: options?.value
            });
          } else {
            const signature = await eip712Utils.getAttestationSignature(
              recipient,
              schema,
              expirationTime,
              refUUID,
              data,
              await verifier.getNonce(txSender.address),
              Buffer.from(txSender.privateKey.slice(2), 'hex')
            );

            uuid = await eas
              .connect(txSender)
              .attestByDelegation(recipient, schema, data, txSender.address, signature, expirationTime, refUUID, {
                value: options?.value
              });
          }

          expect(await eas.isAttestationValid(uuid)).to.be.true;

          const now = await latest();

          const attestation = await eas.getAttestation(uuid);
          expect(attestation.uuid).to.equal(uuid);
          expect(attestation.schema).to.equal(schema);
          expect(attestation.recipient).to.equal(recipient);
          expect(attestation.attester).to.equal(txSender.address);
          expect(attestation.time).to.equal(now);
          expect(attestation.expirationTime).to.equal(expirationTime);
          expect(attestation.revocationTime).to.equal(0);
          expect(attestation.refUUID).to.equal(refUUID);
          expect(attestation.data).to.equal(data);

          return uuid;
        };

        context('with a registered schema', () => {
          const schema1 = 'S1';
          const schema2 = 'S2';
          const schema1Id = getSchemaUUID(schema1, ZERO_ADDRESS);
          const schema2Id = getSchemaUUID(schema2, ZERO_ADDRESS);

          beforeEach(async () => {
            await schemaRegistry.register(schema1, ZERO_ADDRESS);
            await schemaRegistry.register(schema2, ZERO_ADDRESS);
          });

          it('should allow attestation to an empty recipient', async () => {
            await expectAttestation(ZERO_ADDRESS, schema1Id, expirationTime, ZERO_BYTES32, data);
          });

          it('should allow self attestations', async () => {
            await expectAttestation(sender.address, schema2Id, expirationTime, ZERO_BYTES32, data, {
              from: sender
            });
          });

          it('should allow multiple attestations', async () => {
            await expectAttestation(recipient.address, schema1Id, expirationTime, ZERO_BYTES32, data);
            await expectAttestation(recipient2.address, schema1Id, expirationTime, ZERO_BYTES32, data);
          });

          it('should allow attestation without expiration time', async () => {
            await expectAttestation(recipient.address, schema1Id, NO_EXPIRATION, ZERO_BYTES32, data);
          });

          it('should allow attestation without any data', async () => {
            await expectAttestation(recipient.address, schema1Id, expirationTime, ZERO_BYTES32, ZERO_BYTES);
          });

          it('should store referenced attestation', async () => {
            const uuid = await eas.attest(recipient.address, schema1Id, data, expirationTime);

            await expectAttestation(recipient.address, schema1Id, expirationTime, uuid, data);
          });
        });
      });
    }
  });

  describe('revocation', () => {
    const schema1 = 'S1';
    const schema1Id = getSchemaUUID(schema1, ZERO_ADDRESS);
    let uuid: string;
    const data = '0x1234';

    beforeEach(async () => {
      await schemaRegistry.register(schema1, ZERO_ADDRESS);
    });

    for (const delegation of [false, true]) {
      const expectRevocation = async (uuid: string, options?: Options) => {
        const txSender = options?.from || sender;

        if (!delegation) {
          await eas.connect(txSender).revoke(uuid);
        } else {
          const signature = await eip712Utils.getRevocationSignature(
            uuid,
            await verifier.getNonce(txSender.address),
            Buffer.from(txSender.privateKey.slice(2), 'hex')
          );

          await eas.connect(txSender).revokeByDelegation(uuid, txSender.address, signature);
        }

        const now = await latest();

        const attestation = await eas.getAttestation(uuid);
        expect(attestation.revocationTime).to.equal(now);
      };

      context(`${delegation ? 'via an EIP712 delegation' : 'directly'}`, () => {
        beforeEach(async () => {
          uuid = await eas.attest(recipient.address, schema1Id, data);
        });

        it('should allow to revoke an existing attestation', async () => {
          await expectRevocation(uuid);
        });
      });
    }
  });
});
