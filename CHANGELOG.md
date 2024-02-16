# Changelog

## 1.4.2 (2024-02-03)

- Remove nonce from serialization/deserialization of offchain attestations

## 1.4.1 (2024-02-02)

- Check for ethers v6 compatibility

## 1.4.0 (2023-12-08)

- Add customizable salt to offchain attestations to reduce the chance of predictable UIDs (which may be abused in some very specific use-cases)
- Remove unnecessary offchain attestation version input from the `signOffchainAttestation` API
