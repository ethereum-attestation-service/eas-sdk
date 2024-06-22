import { ethers } from 'ethers';
import { MerkleValue, PrivateData } from '../../src/private-data';
import chai from './helpers/chai';

const { expect } = chai;

describe('PrivateData', () => {
  describe('construction', () => {
    it('should properly construct a PrivateData instance', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      const privateData = new PrivateData(values);
      expect(privateData).to.be.instanceOf(PrivateData);
    });

    it('should throw an error for invalid input types', () => {
      const invalidValues = [
        { type: 'invalid', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      expect(() => new PrivateData(invalidValues)).to.throw();
    });
  });

  describe('getFullTree', () => {
    it('should return a valid FullMerkleDataTree', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();

      expect(fullTree).to.have.property('root');
      expect(fullTree.root).to.be.a('string');
      expect(fullTree).to.have.property('values');
      expect(fullTree.values).to.be.an('array');
      expect(fullTree.values).to.have.lengthOf(2);
      expect(fullTree.values[0]).to.have.property('salt');
      expect(fullTree.values[1]).to.have.property('salt');
    });
  });

  describe('generateMultiProof', () => {
    it('should generate a valid multi-proof', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 },
        { type: 'bool', name: 'isStudent', value: true }
      ];
      const privateData = new PrivateData(values);
      const proof = privateData.generateMultiProof([0, 2]);

      expect(proof).to.have.property('leaves');
      expect(proof.leaves).to.be.an('array');
      expect(proof.leaves).to.have.lengthOf(2);
      expect(proof).to.have.property('proof');
      expect(proof.proof).to.be.an('array');
      expect(proof).to.have.property('proofFlags');
      expect(proof.proofFlags).to.be.an('array');
    });

    it('should throw an error for invalid indexes', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      const privateData = new PrivateData(values);
      expect(() => privateData.generateMultiProof([0, 2])).to.throw();
    });
  });

  describe('verifyMultiProof', () => {
    it('should verify a valid multi-proof', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 },
        { type: 'bool', name: 'isStudent', value: true }
      ];
      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();
      const proof = privateData.generateMultiProof([0, 2]);

      const isValid = PrivateData.verifyMultiProof(fullTree.root, proof);
      expect(isValid).to.be.true;
    });

    it('should reject an invalid multi-proof', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 },
        { type: 'bool', name: 'isStudent', value: true }
      ];
      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();
      const proof = privateData.generateMultiProof([0, 2]);

      // find the leaf in which the name exists and change its name
      const leafIndex = proof.leaves.findIndex((leaf) => leaf.name === 'name');
      proof.leaves[leafIndex].name = 'invalid';

      const isValid = PrivateData.verifyMultiProof(fullTree.root, proof);
      expect(isValid).to.be.false;
    });
  });

  describe('verifyFullTree', () => {
    it('should verify a valid full tree', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();

      const calculatedRoot = PrivateData.verifyFullTree(fullTree);
      expect(calculatedRoot).to.equal(fullTree.root);
    });

    it('should reject an invalid full tree', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 }
      ];
      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();

      // find the leaf in which the name exists and change its name
      const leafIndex = fullTree.values.findIndex((leaf) => leaf.name === 'name');
      fullTree.values[leafIndex].name = 'invalid';

      const calculatedRoot = PrivateData.verifyFullTree(fullTree);
      expect(calculatedRoot).to.not.equal(fullTree.root);
    });
  });

  describe('integration', () => {
    it('should create, prove, and verify complex data structures', () => {
      const values: MerkleValue[] = [
        { type: 'string', name: 'name', value: 'John Doe' },
        { type: 'uint256', name: 'age', value: 30 },
        { type: 'bool', name: 'isStudent', value: true },
        { type: 'address', name: 'wallet', value: '0x1234567890123456789012345678901234567890' },
        { type: 'bytes32', name: 'dataHash', value: ethers.id('some data') }
      ];

      const privateData = new PrivateData(values);
      const fullTree = privateData.getFullTree();

      // Generate proof for subset of data
      const proof = privateData.generateMultiProof([1, 2, 4]);

      // Verify the proof
      const isValid = PrivateData.verifyMultiProof(fullTree.root, proof);
      expect(isValid).to.be.true;

      // Verify the full tree
      const calculatedRoot = PrivateData.verifyFullTree(fullTree);
      expect(calculatedRoot).to.equal(fullTree.root);
    });
  });
});
