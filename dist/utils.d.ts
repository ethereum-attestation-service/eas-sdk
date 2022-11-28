export declare const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare const ZERO_BYTES = "0x";
export declare const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
export declare const getSchemaUUID: (schema: string, resolverAddress: string) => string;
export declare const getUUID: (schema: string, recipient: string, attester: string, time: number, expirationTime: number, revocable: boolean, refUUID: string, data: string, bump: number) => string;
export declare const getOffchainUUID: (schema: string, recipient: string, time: number, expirationTime: number, revocable: boolean, refUUID: string, data: string) => string;
