import chai from './helpers/chai';
import {
  AttestationShareablePackageObject,
  createOffchainURL,
  decodeBase64ZippedBase64, Offchain,
  zipAndEncodeToBase64
} from '../../src';


const {expect} = chai;

const testAttestation: AttestationShareablePackageObject = {
  'sig': {
    'domain': {
      'name': 'EAS Attestation',
      'version': '0.26',
      'chainId': 1,
      'verifyingContract': '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587'
    },
    'primaryType': 'Attest',
    'types': {
      'Attest': [{'name': 'version', 'type': 'uint16'}, {
        'name': 'schema',
        'type': 'bytes32'
      }, {'name': 'recipient', 'type': 'address'}, {'name': 'time', 'type': 'uint64'}, {
        'name': 'expirationTime',
        'type': 'uint64'
      }, {'name': 'revocable', 'type': 'bool'}, {'name': 'refUID', 'type': 'bytes32'}, {
        'name': 'data',
        'type': 'bytes'
      }]
    },
    'signature': {
      'r': '0x11fd0b669ccef1798b492e3939866325a97713c8d55c5b90fcdbc6b589a3f476',
      's': '0x1ef3760b352ccbe8d4ed4acc01e6fb3fca95bc903c837407d9e279d3b699a095',
      'v': 27
    },
    'uid': '0x8847eaeb52de42adb574c9f73e04376e0e89c55f0ff9cdebe8c1518960a0ad56',
    'message': {
      'version': 1,
      'schema': '0x85500e806cf1e74844d51a20a6d893fe1ed6f6b0738b50e43d774827d08eca61',
      'recipient': '0x0000000000000000000000000000000000000000',
      'time': 1687899010,
      'expirationTime': 0,
      'refUID': '0x0000000000000000000000000000000000000000000000000000000000000000',
      'revocable': true,
      'data': '0x0000000000000000000000000000000000000000000000000000000000000001',
      'nonce': 0
    }
  }, 'signer': '0x0fb166cDdF1387C5b63fFa25721299fD7b068f3f'
};

const testEncoded = 'eNqlkEtuJEEIBe9S69IIkuS3HLvdl7C8SEg4gOWR5viubh/BLNFTELz3A/4MOU48D/j/FwfonV5e1hjzbaQnpdx43YVuUIFs47XY9HiEEXtDiHhmNapbTB9FTm4iNHi5KlLaZk4Oh84dKcHmi3qq/ECqSQWCeGRG2Z6158oELOmgzuUc6XBxSCfo9hrqm0LcFzgf59AHBzpQJG/7jmT6yiHU9zVYBw73vmmAWFM/j5pNrVXBY9ccawfrTG+lgnnZFJR5Mjd0e+66tBIZzQUWrM0/5sYMVxAkG0unzbkZ14Al25y6sLa0BChZMNSkrVdq6AarXIIPyFW7mJo7IJzwXHx9/qvnQ7+bCw8nfnwDdQN4HA==';
const testURL = '/offchain/url/#attestation=eNqlkEtuJEEIBe9S69IIkuS3HLvdl7C8SEg4gOWR5viubh%2FBLNFTELz3A%2F4MOU48D%2Fj%2FFwfonV5e1hjzbaQnpdx43YVuUIFs47XY9HiEEXtDiHhmNapbTB9FTm4iNHi5KlLaZk4Oh84dKcHmi3qq%2FECqSQWCeGRG2Z6158oELOmgzuUc6XBxSCfo9hrqm0LcFzgf59AHBzpQJG%2F7jmT6yiHU9zVYBw73vmmAWFM%2Fj5pNrVXBY9ccawfrTG%2BlgnnZFJR5Mjd0e%2B66tBIZzQUWrM0%2F5sYMVxAkG0unzbkZ14Al25y6sLa0BChZMNSkrVdq6AarXIIPyFW7mJo7IJzwXHx9%2FqvnQ7%2BbCw8nfnwDdQN4HA%3D%3D';

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

      const offchain = new Offchain({
        address: testAttestation.sig.domain.verifyingContract,
        version: testAttestation.sig.domain.version,
        chainId: testAttestation.sig.domain.chainId
      }, 1);

      const verified = offchain.verifyOffchainAttestationSignature(testAttestation.signer, decoded.sig);

      expect(verified).to.be.true;
    });
  });

});
