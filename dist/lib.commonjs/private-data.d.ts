export type FullMerkleDataTree = {
    root: string;
    values: MerkleValueWithSalt[];
};
export interface MerkleMultiProof {
    leaves: Leaf[];
    proof: string[];
    proofFlags: boolean[];
}
export interface Leaf {
    type: string;
    name: string;
    value: unknown;
    salt: string;
}
export interface MerkleValue {
    type: string;
    name: string;
    value: unknown;
}
export type MerkleValueWithSalt = MerkleValue & {
    salt: string;
};
export type EncodedMerkleValue = [string, string, string, string];
export declare class PrivateData {
    private tree;
    private values;
    constructor(values: MerkleValue[] | MerkleValueWithSalt[]);
    private encodeValuesToMerkleTree;
    private encodeMerkleValues;
    private decodeMerkleValues;
    getFullTree(): FullMerkleDataTree;
    generateMultiProof(indexes: number[]): MerkleMultiProof;
    static verifyMultiProof(root: string, proof: MerkleMultiProof): boolean;
    private static encodeMerkleValues;
    static verifyFullTree(tree: FullMerkleDataTree): string;
}
