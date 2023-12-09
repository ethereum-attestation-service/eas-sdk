import {
  AttestationShareablePackageObject,
  createOffchainURL,
  decodeBase64ZippedBase64,
  EAS,
  Offchain,
  OffChainAttestationVersion,
  zipAndEncodeToBase64
} from '../../src';
import { ZERO_ADDRESS } from '../utils/Constants';
import chai from './helpers/chai';

const { expect } = chai;

const testAttestation: AttestationShareablePackageObject = {
  sig: {
    version: OffChainAttestationVersion.Version2,
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
      version: OffChainAttestationVersion.Version2,
      schema: '0x33e9094830a5cba5554d1954310e4fbed2ef5f859ec1404619adea4207f391fd',
      recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      time: 1690299812n,
      expirationTime: 1692891810n,
      revocable: true,
      refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
      data: '0x',
      salt: '0x0000000000000000000000000000000000000000000000000000000000000123',
      nonce: 0n
    }
  },
  signer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
};

const testEncoded =
  'eNqlks1OHEEMhN9lzgi13X9ublnISNyT3N1uG0aCWTQMiCjKu8e7m+QepY9211cuyz+mo5k88rJ+0+11Oa7TDV5Nclz3jWX/W5vgOl6HyTunr/fDKxFirF55122x78v6cPtb5L3wUQw/JzwcEtSi7VONGZn6TEQFcz5om+MdDogO2M6CQCUjGXM3KcomIRWpALnWXkK0ABi1tkgxlcaddYxmVkUjBdcNB72eQYgClmKlmnLN3WpqsXAdwABJKjVDzo4ajYqgpGJcQi86Uhw+Jpwi+RLIecvDqpfpLLZ5FM3APIjmMifRwgcirFibmM29IZbi4rdlnCWU0yDF0rH3IdFzmLtLGWgZEDOZSOsN3J0yNcqMUCSoZSyqhKdA8qjPfKbFqC20RDFwls45Ox1aThGCJus60IVGualA8tVB46GcMFQfHc7r2VSWl0XX/V8T7cuzTjdQWsDWCPw+9ONl2Xj30/jyp4fUgCCcbOzr/d3J4+z5fhTuT/5n3970ahq8XwKd4vHTZZbwP8/vwlnrcRU3CT9/AU+pxEI=';
const testURL =
  '/offchain/url/#attestation=eNqlks1OHEEMhN9lzgi13X9ublnISNyT3N1uG0aCWTQMiCjKu8e7m%2BQepY9211cuyz%2Bmo5k88rJ%2B0%2B11Oa7TDV5Nclz3jWX%2FW5vgOl6HyTunr%2FfDKxFirF55122x78v6cPtb5L3wUQw%2FJzwcEtSi7VONGZn6TEQFcz5om%2BMdDogO2M6CQCUjGXM3KcomIRWpALnWXkK0ABi1tkgxlcaddYxmVkUjBdcNB72eQYgClmKlmnLN3WpqsXAdwABJKjVDzo4ajYqgpGJcQi86Uhw%2BJpwi%2BRLIecvDqpfpLLZ5FM3APIjmMifRwgcirFibmM29IZbi4rdlnCWU0yDF0rH3IdFzmLtLGWgZEDOZSOsN3J0yNcqMUCSoZSyqhKdA8qjPfKbFqC20RDFwls45Ox1aThGCJus60IVGualA8tVB46GcMFQfHc7r2VSWl0XX%2FV8T7cuzTjdQWsDWCPw%2B9ONl2Xj30%2Fjyp4fUgCCcbOzr%2Fd3J4%2Bz5fhTuT%2F5n3970ahq8XwKd4vHTZZbwP8%2FvwlnrcRU3CT9%2FAU%2BpxEI%3D';

describe('offchain utils', () => {
  describe('encode', () => {
    it('should zip and encode an offchain attestation object', () => {
      const encoded = zipAndEncodeToBase64(testAttestation);
      expect(encoded).to.equal(testEncoded);
    });

    it('should encode into url', () => {
      const url = createOffchainURL(testAttestation);
      expect(url).to.equal(testURL);
    });
  });

  describe('decode', () => {
    it('should unzip and decode an an encoded attestation string', () => {
      const decoded = decodeBase64ZippedBase64(testEncoded);
      expect(decoded).to.not.be.null;

      const offchain = new Offchain(
        {
          chainId: testAttestation.sig.domain.chainId,
          address: testAttestation.sig.domain.verifyingContract,
          version: testAttestation.sig.domain.version
        },
        OffChainAttestationVersion.Version2,
        new EAS(ZERO_ADDRESS)
      );

      const verified = offchain.verifyOffchainAttestationSignature(testAttestation.signer, decoded.sig);

      expect(verified).to.be.true;
    });
  });
});
