# Changelog

## 1.6.0 (2024-04-07)

- Automatically derive the EIP712 version via the domain separator

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
