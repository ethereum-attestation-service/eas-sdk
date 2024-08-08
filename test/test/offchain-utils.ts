import {
  AttestationShareablePackageObject,
  createOffchainURL,
  decodeBase64ZippedBase64,
  EAS,
  Offchain,
  OffchainAttestationVersion,
  SignedOffchainAttestation,
  zipAndEncodeToBase64
} from '../../src';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

interface Spec {
  attestation: AttestationShareablePackageObject;
  encoded: string;
  url: string;
}

const TEST_ATTESTATIONS: Spec[] = [
  {
    attestation: {
      sig: {
        version: OffchainAttestationVersion.Version2,
        domain: {
          name: 'EAS Attestation',
          version: '1.3.0',
          chainId: 31337n,
          verifyingContract: '0x6f2E42BB4176e9A7352a8bF8886255Be9F3D2d13'
        },
        primaryType: 'Attest',
        types: {
          Attest: [
            { name: 'version', type: 'uint16' },
            {
              name: 'schema',
              type: 'bytes32'
            },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint64' },
            {
              name: 'expirationTime',
              type: 'uint64'
            },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            {
              name: 'data',
              type: 'bytes'
            },
            {
              name: 'salt',
              type: 'bytes32'
            }
          ]
        },
        signature: {
          v: 28,
          r: '0x086528faabfc6eafc046c711577b603f0123e79383469abaedd9ff7ce38028fd',
          s: '0x22c1f437874575bf74936a7d1a114c789f2a53e7d986c2c46fa60b6ed43d7351'
        },
        uid: '0x854d8e26b2bbdc3577fc78c6d2f512258fcc9b91a60858985a216c0ef526ee82',
        message: {
          version: OffchainAttestationVersion.Version2,
          schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          time: 1690299812n,
          expirationTime: 1692891810n,
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x',
          salt: '0x0000000000000000000000000000000000000000000000000000000000000123'
        }
      },
      signer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    },
    encoded:
      // eslint-disable-next-line max-len
      'eNqlkUtuJTEIRfdS41JkvoZhnpLaRKsH2IYFRImU5cevlAW01ExgAOde4M8BL/TSjvMgIOo7t28tfGd8PBi6pr92Egwbl5kpijzSL3rDBXQ3N1NBq4hRUzNqNtbZAaT3oY2qAVJ2JyNWjxG5llf1mWRtz60bgjihmLp1li6jOjtp9AUBwLObF4ZszHLTiZO1QtvQXExr24PjRHtyivxamgIRy+zSi2dqPMywY/dZdQ1HVL1FTXhZog4cY03ahmtLTV1YAohiNacPhy1lYm4SCDpblqBmGt4QovTmbNRC5giRDQUXJmjJNXLh7i8Tzwm8TwMeK4Ox9e0Vftf/d9ug3tDdAJ8lmoNB24jj/Pz4yifrONuJ92P+J/bTjr8/dNmG8A==',
    // eslint-disable-next-line max-len
    url: '/offchain/url/#attestation=eNqlkUtuJTEIRfdS41JkvoZhnpLaRKsH2IYFRImU5cevlAW01ExgAOde4M8BL%2FTSjvMgIOo7t28tfGd8PBi6pr92Egwbl5kpijzSL3rDBXQ3N1NBq4hRUzNqNtbZAaT3oY2qAVJ2JyNWjxG5llf1mWRtz60bgjihmLp1li6jOjtp9AUBwLObF4ZszHLTiZO1QtvQXExr24PjRHtyivxamgIRy%2BzSi2dqPMywY%2FdZdQ1HVL1FTXhZog4cY03ahmtLTV1YAohiNacPhy1lYm4SCDpblqBmGt4QovTmbNRC5giRDQUXJmjJNXLh7i8Tzwm8TwMeK4Ox9e0Vftf%2Fd9ug3tDdAJ8lmoNB24jj%2FPz4yifrONuJ92P%2BJ%2FbTjr8%2FdNmG8A%3D%3D'
  },
  {
    attestation: {
      sig: {
        domain: {
          name: 'EAS Attestation',
          version: '1.0.0',
          chainId: 31337n,
          verifyingContract: '0x6f2E42BB4176e9A7352a8bF8886255Be9F3D2d13'
        },
        primaryType: 'Attest',
        types: {
          Attest: [
            { name: 'version', type: 'uint16' },
            {
              name: 'schema',
              type: 'bytes32'
            },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint64' },
            {
              name: 'expirationTime',
              type: 'uint64'
            },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            {
              name: 'data',
              type: 'bytes'
            }
          ]
        },
        signature: {
          v: 27,
          r: '0x657d547ea6cd0833572aad8005d00e38f7ed179ab98f76af03209abc1b547445',
          s: '0x39057cca4f279d3665882bb41087f281f4c82f8bc7289bd8692d1489516bbcfa'
        },
        uid: '0x35bcdfc396e713ace4513fb166b2ac2e5613f12e4aed5d5cdb637051750f6e0b',
        message: {
          version: OffchainAttestationVersion.Version1,
          schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          time: 1690299812n,
          expirationTime: 1692891810n,
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x'
        }
      } as unknown as SignedOffchainAttestation,
      signer: '0x8f80b8f45cA0F036da46fFA4D9e5e42D086fB302'
    },
    encoded:
      // eslint-disable-next-line max-len
      'eNolkLuKHEEMRf+l42bRu6RwmnH/hHFQDylaHBgv+PNdsxPpXpCO4Pw88AM+4DgPRua2J/yzoh9C1yXYLOPRWKn7uN3dSPXKuPlJC/m9rG2ptOw2FzizNup9OYAugGSvlgtb9BE7Wi9ggt0mjn0lot8QDtA2Z5eiFovN1J3GEARvRY4l06l8zEYeY7nF/i8eijbGrH6c1F4cL4fhJTofcAPb6mJ1P+QZqSn0BLe6GOj9VMdcNTksG3KfKYpcA80G9UmptitSSs+lS+caxg0Um0JZwnhDOANCnKHrHF1VZWGoMEJKjVyUpeUaOVFADKOv7ELQigNrfUN2vJel4suc33bLTOvXdtC2j1l1jyAyO060AIpwpFfcMtARNuI4//75yhfrOOHE8/fX5+ev/ziaeyQ=',
    // eslint-disable-next-line max-len
    url: '/offchain/url/#attestation=eNolkLuKHEEMRf%2Bl42bRu6RwmnH%2FhHFQDylaHBgv%2BPNdsxPpXpCO4Pw88AM%2B4DgPRua2J%2Fyzoh9C1yXYLOPRWKn7uN3dSPXKuPlJC%2Fm9rG2ptOw2FzizNup9OYAugGSvlgtb9BE7Wi9ggt0mjn0lot8QDtA2Z5eiFovN1J3GEARvRY4l06l8zEYeY7nF%2Fi8eijbGrH6c1F4cL4fhJTofcAPb6mJ1P%2BQZqSn0BLe6GOj9VMdcNTksG3KfKYpcA80G9UmptitSSs%2BlS%2Bcaxg0Um0JZwnhDOANCnKHrHF1VZWGoMEJKjVyUpeUaOVFADKOv7ELQigNrfUN2vJel4suc33bLTOvXdtC2j1l1jyAyO060AIpwpFfcMtARNuI4%2F%2F75yhfrOOHE8%2FfX5%2Bev%2FziaeyQ%3D'
  }
];

describe('offchain utils', () => {
  for (const { attestation, encoded, url } of TEST_ATTESTATIONS) {
    context(`version ${attestation.sig.message.version}`, () => {
      describe('encode', () => {
        it('should zip and encode an offchain attestation object', () => {
          expect(zipAndEncodeToBase64(attestation)).to.equal(encoded);
        });

        it('should encode into a URL', () => {
          expect(createOffchainURL(attestation)).to.equal(url);
        });
      });

      describe('decode', () => {
        it('should unzip and decode an an encoded attestation string', () => {
          const decoded = decodeBase64ZippedBase64(encoded);
          expect(decoded).to.not.be.null;

          const offchain = new Offchain(
            {
              chainId: attestation.sig.domain.chainId,
              address: attestation.sig.domain.verifyingContract,
              version: attestation.sig.domain.version
            },
            attestation.sig.message.version,
            new EAS(ZERO_ADDRESS)
          );

          expect(
            offchain.verifyOffchainAttestationSignature(attestation.signer, decoded.sig as SignedOffchainAttestation)
          ).to.be.true;
        });
      });
    });
  }
});
