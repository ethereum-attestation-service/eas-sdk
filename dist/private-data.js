"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateData = void 0;
const merkle_tree_1 = require("@openzeppelin/merkle-tree");
const ethers_1 = require("ethers");
const merkleValueAbiEncoding = ['string', 'string', 'bytes', 'bytes32'];
class PrivateData {
    tree;
    values;
    constructor(values) {
        if (values.some((v) => Object.prototype.hasOwnProperty.call(v, 'salt'))) {
            this.values = values;
        }
        else {
            this.values = values.map((v) => ({
                ...v,
                salt: ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32))
            }));
        }
        this.tree = this.encodeValuesToMerkleTree(this.values);
    }
    encodeValuesToMerkleTree(values) {
        const encodedValues = this.encodeMerkleValues(values);
        return merkle_tree_1.StandardMerkleTree.of(encodedValues, merkleValueAbiEncoding);
    }
    encodeMerkleValues(values) {
        return values.map((v) => [v.type, v.name, ethers_1.ethers.AbiCoder.defaultAbiCoder().encode([v.type], [v.value]), v.salt]);
    }
    decodeMerkleValues(values) {
        return values.map((v) => ({
            type: v[0],
            name: v[1],
            value: ethers_1.ethers.AbiCoder.defaultAbiCoder().decode([v[0]], v[2])[0],
            salt: v[3]
        }));
    }
    getFullTree() {
        return {
            root: this.tree.root,
            values: this.values
        };
    }
    generateMultiProof(indexes) {
        const multiProof = this.tree.getMultiProof(indexes);
        return {
            ...multiProof,
            leaves: this.decodeMerkleValues(multiProof.leaves)
        };
    }
    static verifyMultiProof(root, proof) {
        const encodedProof = {
            ...proof,
            leaves: this.encodeMerkleValues(proof.leaves)
        };
        return merkle_tree_1.StandardMerkleTree.verifyMultiProof(root, merkleValueAbiEncoding, encodedProof);
    }
    static encodeMerkleValues(values) {
        return values.map((v) => [v.type, v.name, ethers_1.ethers.AbiCoder.defaultAbiCoder().encode([v.type], [v.value]), v.salt]);
    }
    static verifyFullTree(tree) {
        const encodedValues = this.encodeMerkleValues(tree.values);
        const merkleTree = merkle_tree_1.StandardMerkleTree.of(encodedValues, merkleValueAbiEncoding);
        return merkleTree.root;
    }
}
exports.PrivateData = PrivateData;
//# sourceMappingURL=private-data.js.map