# Ethereum Attestation Service - TypeScript/JavaScript SDK

[![Docs](https://img.shields.io/badge/docs-%F0%9F%93%84-blue)](https://eas.eth.link)
[![NPM Package](https://img.shields.io/npm/v/@ethereum-attestation-service/eas-sdk.svg)](https://www.npmjs.org/package/@ethereum-attestation-service/eas-sdk)
[![Test](https://github.com/ethereum-attestation-service/eas-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/ethereum-attestation-service/eas-sdk/actions/workflows/ci.yml)

This repository contains the Ethereum Attestation Service SDK, used to interact with the Ethereum Attestation Service Protocol.

## Installing the EAS SDK

To install the EAS SDK, run the following command within your project directory:

```sh
yarn add @ethereum-attestation-service/eas-sdk
```

OR

```sh
npm install @ethereum-attestation-service/eas-sdk
```

OR

```sh
pnpm add @ethereum-attestation-service/eas-sdk
```

## Using the EAS SDK

Import and initialize the library

```javascript
import { EAS, Offchain, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

export const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

// Initialize the sdk with the address of the EAS Schema contract address
const eas = new EAS(EASContractAddress);

// Gets a default provider (in production use something else like infura/alchemy)
const provider = ethers.getDefaultProvider(
  "sepolia"
);

// Connects an ethers style provider/signingProvider to perform read/write functions.
// MUST be a signer to do write operations!
eas.connect(provider);
```

### Getting an Attestation

The `getAttestation` function allows you to retrieve an on-chain attestation for a given UID. This function returns an attestation object containing information about the attestation, such as the schema, recipient, attester, and more.

#### Usage

```javascript
import { EAS } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const uid = "0xff08bbf3d3e6e0992fc70ab9b9370416be59e87897c3d42b20549901d2cccc3e";

const attestation = await eas.getAttestation(uid);

console.log(attestation);
```

#### Output

The `getAttestation` function returns an attestation object with the following properties:

- `uid`: The unique identifier of the attestation.
- `schema`: The schema identifier associated with the attestation.
- `refUID`: The reference UID of the attestation, if any.
- `time`: The Unix timestamp when the attestation was created.
- `expirationTime`: The Unix timestamp when the attestation expires (0 for no expiration).
- `revocationTime`: The Unix timestamp when the attestation was revoked, if applicable.
- `recipient`: The Ethereum address of the recipient of the attestation.
- `attester`: The Ethereum address of the attester who created the attestation.
- `revocable`: A boolean indicating whether the attestation is revocable or not.
- `data`: The attestation data in bytes format.

Example output:

```javascript
{
    uid: '0x5134f511e0533f997e569dac711952dde21daf14b316f3cce23835defc82c065',
    schema: '0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a',
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    time: 1671219600,
    expirationTime: 0,
    revocationTime: 1671219636,
    recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
    attester: '0x1e3de6aE412cA218FD2ae3379750388D414532dc',
    revocable: true,
    data: '0x0000000000000000000000000000000000000000000000000000000000000000'
}
```

### Creating Onchain Attestations

The `attest` function allows you to create an on-chain attestation for a specific schema. This function takes an object with the following properties:

- `schema`: The UID of the schema for which the attestation is being created.
- `data`: An object containing the following properties:
  - `recipient`: The Ethereum address of the recipient of the attestation.
  - `expirationTime`: A Unix timestamp representing the expiration time of the attestation. Use `0` for no expiration.
  - `revocable`: A boolean indicating whether the attestation is revocable or not.
  - `refUID`: (Optional) The UID of a referenced attestation. Use `ZERO_BYTES32` if there is no reference.
  - `data`: The encoded data for the attestation, which should be generated using the `SchemaEncoder` class.

The function returns a Promise that resolves to the UID of the newly created attestation.

### Example

```javascript
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(signer);

// Initialize SchemaEncoder with the schema string
const schemaEncoder = new SchemaEncoder("uint256 eventId, uint8 voteIndex");
const encodedData = schemaEncoder.encodeData([
  { name: "eventId", value: 1, type: "uint256" },
  { name: "voteIndex", value: 1, type: "uint8" },
]);

const schemaUID = "0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995";

const tx = await eas.attest({
  schema: schemaUID,
  data: {
    recipient: "0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165",
    expirationTime: 0,
    revocable: true, // Be aware that if your schema is not revocable, this MUST be false
    data: encodedData,
  },
});

const newAttestationUID = await tx.wait();

console.log("New attestation UID:", newAttestationUID);

console.log("Transaction receipt:", tx.receipt);
```

### Creating Offchain Attestations

To create an offchain attestation, you can use the `signOffchainAttestation` function provided by the Offchain class in the EAS SDK. Here's an example:

```javascript
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

// Initialize EAS with the EAS contract address on whichever chain where your schema is defined
const eas = new EAS(EASContractAddress);

const offchain = await eas.getOffchain();

// Initialize SchemaEncoder with the schema string
// Note these values are sample values and should be filled with actual values
// Code samples can be found when viewing each schema on easscan.org
const schemaEncoder = new SchemaEncoder("uint256 eventId, uint8 voteIndex");
const encodedData = schemaEncoder.encodeData([
  { name: "eventId", value: 1, type: "uint256" },
  { name: "voteIndex", value: 1, type: "uint8" },
]);

// Signer is an ethers.js Signer instance
const signer = new ethers.Wallet(privateKey, provider);

const offchainAttestation = await offchain.signOffchainAttestation({
  recipient: '0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165',
  expirationTime: 0n, // Unix timestamp of when attestation expires. (0 for no expiration)
  time: BigInt(Math.floor(Date.now() / 1000)), // Unix timestamp of current time
  revocable: true, // Be aware that if your schema is not revocable, this MUST be false
  schema: "0xb16fa048b0d597f5a821747eba64efa4762ee5143e9a80600d0005386edfc995",
  refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
  data: encodedData,
}, signer);
```

This function will return a signed offchain attestation object containing the UID, signature, and attestation data. You can then share this object with the intended recipient or store it for future use.

#### Versioning

Since the offchain attestation protocol is being constantly evolved and improved, we've recently added versioning to help the applications to support both older and newer types of attestation. Starting from version `1`, we have added a `version` field to its typed data, which is seamlessly supported by both `signOffchainAttestation` and `verifyOffchainAttestationSignature` function.

Please note that using the `getOffchainUID` function for the previous legacy version, requires passing `{ version: 0 }` explicitly.

### Revoking Onchain Attestations

```javascript
const transaction = await eas.revoke({
  schema: "0x85500e806cf1e74844d51a20a6d893fe1ed6f6b0738b50e43d774827d08eca61",
  data: { uid: "0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a" }
});

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Creating Timestamps

To create a timestamp for a single piece of data, you can use the `timestamp` function provided by the EAS SDK. Here's an example:

```javascript
import { EAS } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data = ethers.encodeBytes32String('0x1234');

const transaction = await eas.timestamp(data);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

To create timestamps for multiple pieces of data, you can use the `multiTimestamp` function:

```javascript
import { EAS } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data1 = ethers.encodeBytes32String('0x3e23b395b2bd2d37dd0f6e4148ac6b9e7ed22f2215107958f95cc1489e4e6289');
const data2 = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');

const transaction = await eas.multiTimestamp([data1, data2]);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Revoking Offchain Attestations

To revoke an offchain attestation, you can use the `revokeOffchain` function provided by the EAS SDK. Here's an example:

```javascript
import { EAS } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');

const transaction = await eas.revokeOffchain(data);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

To revoke multiple offchain attestations, you can use the `multiRevokeOffchain` function:

```javascript
import { EAS } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EASContractAddress);
eas.connect(provider);

const data1 = ethers.encodeBytes32String('0x6776de8122c352b4d671003e58ca112aedb99f34c629a1d1fe3b332504e2943a');
const data2 = ethers.encodeBytes32String('0x3e23b395b2bd2d37dd0f6e4148ac6b9e7ed22f2215107958f95cc1489e4e6289');

const transaction = await eas.multiRevokeOffchain([data1, data2]);

// Optional: Wait for transaction to be validated
await transaction.wait();
```

### Verify an Offchain Attestation

To verify an offchain attestation, you can use the `verifyOffchainAttestationSignature` function provided by the EAS SDK. Here's an example:

```javascript
import { OffchainAttestationVersion, Offchain, OffchainConfig } from "@ethereum-attestation-service/eas-sdk";

const attestation = {
  // your offchain attestation
  sig: {
    domain: {
      name: "EAS Attestation",
      version: "0.26",
      chainId: 1,
      verifyingContract: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
    },
    primaryType: "Attest",
    types: {
      Attest: [],
    },
    signature: {
      r: "",
      s: "",
      v: 28,
    },
    uid: "0x5134f511e0533f997e569dac711952dde21daf14b316f3cce23835defc82c065",
    message: {
      version: OffchainAttestationVersion.Version2,
      schema: "0x27d06e3659317e9a4f8154d1e849eb53d43d91fb4f219884d1684f86d797804a",
      refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
      time: 1671219600,
      expirationTime: 0,
      recipient: "0xFD50b031E778fAb33DfD2Fc3Ca66a1EeF0652165",
      attester: "0x1e3de6aE412cA218FD2ae3379750388D414532dc",
      revocable: true,
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
  },
  signer: "0x1e3de6aE412cA218FD2ae3379750388D414532dc",
};

const EAS_CONFIG: OffchainConfig = {
  address: attestation.sig.domain.verifyingContract,
  version: attestation.sig.domain.version,
  chainId: attestation.sig.domain.chainId,
};
const offchain = new Offchain(EAS_CONFIG, OffchainAttestationVersion.Version2);
const isValidAttestation = offchain.verifyOffchainAttestationSignature(
  attestation.signer,
  attestation.sig
);
```

### Registering a Schema

To register a new schema, you can use the `register` function provided by the EAS SDK. This function takes an object with the following properties:

- `schema`: The schema string that defines the structure of the data to be attested.
- `resolverAddress`: The Ethereum address of the resolver responsible for managing the schema.
- `revocable`: A boolean value indicating whether attestations created with this schema can be revoked.

Here's an example of how to register a new schema:

```javascript
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { ethers } from 'ethers';

const schemaRegistryContractAddress = "0xYourSchemaRegistryContractAddress";
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);

schemaRegistry.connect(signer);

const schema = "uint256 eventId, uint8 voteIndex";
const resolverAddress = "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26
const revocable = true;

const transaction = await schemaRegistry.register({
  schema,
  resolverAddress,
  revocable,
});

// Optional: Wait for transaction to be validated
await transaction.wait();
```

After registering a schema, you can use its UID to create attestations with the specified structure.

### Getting Schema Information

To retrieve the schema information for a specific schema UID, you can use the `getSchema` function provided by the EAS SDK. Here's an example:

```javascript
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";

const schemaRegistryContractAddress = "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0"; // Sepolia 0.26
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress);
schemaRegistry.connect(provider);

const schemaUID = "0xYourSchemaUID";

const schemaRecord = await schemaRegistry.getSchema({ uid: schemaUID });

console.log(schemaRecord);

// Example Output
{
  uid: '0xYourSchemaUID',
  schema: 'bytes32 proposalId, bool vote',
  resolver: '0xResolverAddress',
  revocable: true
}
```

In the output, you will receive an object containing the schema UID, the schema string, the resolver address, and a boolean indicating whether the schema is revocable or not.
