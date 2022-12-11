import { EAS, NO_EXPIRATION } from '../../src/eas';
import { SchemaRegistry } from '../../src/schema-registry';
import { getOffchainUUID, getSchemaUUID } from '../../src/utils';
import Contracts from '../components/Contracts';
import { ZERO_ADDRESS, ZERO_BYTES, ZERO_BYTES32 } from '../utils/Constants';
import chai from './helpers/chai';
import { EIP712Utils } from './helpers/eip712-utils';
import { OffchainUtils } from './helpers/offchain-utils';
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
  let offchainUtils: OffchainUtils;

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
    offchainUtils = new OffchainUtils(verifier.address);

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

  enum SignatureType {
    Direct = 'direct',
    Delegated = 'delegated',
    Offchain = 'offchain'
  }

  describe('attesting', () => {
    let expirationTime: number;
    const data = '0x1234';

    beforeEach(async () => {
      expirationTime = (await latest()) + duration.days(30);
    });

    for (const signatureType of [SignatureType.Direct, SignatureType.Delegated, SignatureType.Offchain]) {
      context(`via ${signatureType} attestation`, () => {
        const expectAttestation = async (
          recipient: string,
          schema: string,
          expirationTime: number,
          revocable: boolean,
          refUUID: string,
          data: string,
          options?: Options
        ) => {
          const txSender = options?.from || sender;

          let uuid: string;

          switch (signatureType) {
            case SignatureType.Direct: {
              uuid = await eas.connect(txSender).attest({
                recipient,
                schema,
                data,
                expirationTime,
                revocable,
                refUUID,
                overrides: {
                  value: options?.value
                }
              });

              break;
            }

            case SignatureType.Delegated: {
              const request = await eip712Utils.signDelegatedAttestation(
                txSender,
                recipient,
                schema,
                expirationTime,
                revocable,
                refUUID,
                data,
                await verifier.getNonce(txSender.address)
              );

              expect(await eip712Utils.verifyDelegatedAttestationSignature(txSender.address, request)).to.be.true;

              uuid = await eas.connect(txSender).attestByDelegation({
                recipient,
                schema,
                data,
                attester: txSender.address,
                signature: request,
                expirationTime,
                revocable,
                refUUID,
                overrides: {
                  value: options?.value
                }
              });

              break;
            }

            case SignatureType.Offchain: {
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

          const now = await latest();

          const attestation = await eas.getAttestation({ uuid });
          expect(attestation.uuid).to.equal(uuid);
          expect(attestation.schema).to.equal(schema);
          expect(attestation.recipient).to.equal(recipient);
          expect(attestation.attester).to.equal(txSender.address);
          expect(attestation.time).to.equal(now);
          expect(attestation.expirationTime).to.equal(expirationTime);
          expect(attestation.revocationTime).to.equal(0);
          expect(attestation.revocable).to.equal(revocable);
          expect(attestation.refUUID).to.equal(refUUID);
          expect(attestation.data).to.equal(data);

          return uuid;
        };

        for (const revocable of [true, false]) {
          context(`with a ${revocable ? 'revocable' : 'irrevocable'} registered schema`, () => {
            const schema = 'bool like';
            const schemaId = getSchemaUUID(schema, ZERO_ADDRESS, revocable);

            beforeEach(async () => {
              await schemaRegistry.register({ schema: schema, revocable });
            });

            it('should allow attestation to an empty recipient', async () => {
              await expectAttestation(ZERO_ADDRESS, schemaId, expirationTime, revocable, ZERO_BYTES32, data);
            });

            it('should allow self attestations', async () => {
              await expectAttestation(sender.address, schemaId, expirationTime, revocable, ZERO_BYTES32, data, {
                from: sender
              });
            });

            it('should allow multiple attestations', async () => {
              await expectAttestation(recipient.address, schemaId, expirationTime, revocable, ZERO_BYTES32, data);
              await expectAttestation(recipient2.address, schemaId, expirationTime, revocable, ZERO_BYTES32, data);
            });

            it('should allow attestation without expiration time', async () => {
              await expectAttestation(recipient.address, schemaId, NO_EXPIRATION, revocable, ZERO_BYTES32, data);
            });

            it('should allow attestation without any data', async () => {
              await expectAttestation(recipient.address, schemaId, expirationTime, revocable, ZERO_BYTES32, ZERO_BYTES);
            });

            it('should store referenced attestation', async () => {
              const uuid = await eas.attest({
                recipient: recipient.address,
                schema: schemaId,
                revocable,
                data,
                expirationTime
              });

              await expectAttestation(recipient.address, schemaId, expirationTime, revocable, uuid, data);
            });

            if (signatureType === SignatureType.Offchain) {
              it('should verify the uuid of an offchain attestation', async () => {
                const request = await offchainUtils.signAttestation(
                  sender,
                  schemaId,
                  recipient,
                  await latest(),
                  expirationTime,
                  revocable,
                  ZERO_BYTES32,
                  data
                );

                expect(await offchainUtils.verifyAttestation(sender.address, request)).to.be.true;

                const request2 = await offchainUtils.signAttestation(
                  sender,
                  schemaId,
                  recipient,
                  await latest(),
                  expirationTime,
                  revocable,
                  ZERO_BYTES32,
                  data,
                  '1234'
                );

                expect(await offchainUtils.verifyAttestation(sender.address, request2)).to.be.false;
              });
            }
          });
        }
      });
    }
  });

  describe('revocation', () => {
    const schema1 = 'bool like';
    const schema1Id = getSchemaUUID(schema1, ZERO_ADDRESS, true);
    let uuid: string;
    const data = '0x1234';

    beforeEach(async () => {
      await schemaRegistry.register({ schema: schema1 });
    });

    for (const signatureType of [SignatureType.Direct, SignatureType.Delegated]) {
      context(`via ${signatureType} attestation`, () => {
        const expectRevocation = async (uuid: string, options?: Options) => {
          const txSender = options?.from || sender;

          switch (signatureType) {
            case SignatureType.Direct: {
              await eas.connect(txSender).revoke({ uuid });

              break;
            }

            case SignatureType.Delegated: {
              const request = await eip712Utils.signDelegatedRevocation(
                txSender,
                uuid,
                await verifier.getNonce(txSender.address)
              );

              expect(await eip712Utils.verifyDelegatedRevocationSignature(txSender.address, request)).to.be.true;

              await eas.connect(txSender).revokeByDelegation({ uuid, attester: txSender.address, signature: request });

              break;
            }
          }

          const now = await latest();

          const attestation = await eas.getAttestation({ uuid });
          expect(attestation.revocationTime).to.equal(now);
        };

        beforeEach(async () => {
          uuid = await eas.attest({ recipient: recipient.address, schema: schema1Id, data });
        });

        it('should allow to revoke an existing attestation', async () => {
          await expectRevocation(uuid);
        });
      });
    }
  });
});
