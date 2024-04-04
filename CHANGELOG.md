# Changelog

## 2.0.1-beta.1 (2024-04-04)

- Fix signer assignment during `connect` (2.0.0-beta.1 regression).

## 2.0.0-beta.1 (2024-03-21)

- Don't automatically broadcast transactions. In order to broadcast transactions, it's now always necessary to call the `wait()` function.

## 1.5.0 (2024-02-16)

- Introduce framework-agnostic `TransactionSigner` and `TypeDataSigner` interfaces which replace the previous usage of the signer/provider
- Fix recipient being mandatory in `attest()` calls

## 1.4.2 (2024-02-03)

- Remove nonce from serialization/deserialization of offchain attestations

## 1.4.1 (2024-02-02)

- Check for ethers v6 compatibility

## 1.4.0 (2023-12-08)

- Add customizable salt to offchain attestations to reduce the chance of predictable UIDs (which may be abused in some very specific use-cases)
- Remove unnecessary offchain attestation version input from the `signOffchainAttestation` API
