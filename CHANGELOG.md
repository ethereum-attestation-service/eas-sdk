# Changelog

## 2.1.2-beta.1

- Avoid using @ethereum-attestation-service/eas-contracts-legacy in production

## 2.1.1-beta.1

- Automatically derive the EIP712 version via the domain separator
- Improve delegated attestation backward compatibility
- Don't require the signer/provider to have the `getAddress` method
- Allow offchain verification with refUID

## 2.0.1-beta.1

- Fix signer assignment during `connect` (2.0.0-beta.1 regression).

## 2.0.0-beta.1

- Don't automatically broadcast transactions. In order to broadcast transactions, it's now always necessary to call the `wait()` function.

## 1.6.0

- Automatically derive the EIP712 version via the domain separator
- Improve delegated attestation backward compatibility

## 1.5.0

- Introduce framework-agnostic `TransactionSigner` and `TypeDataSigner` interfaces which replace the previous usage of the signer/provider
- Fix recipient being mandatory in `attest()` calls

## 1.4.2

- Remove nonce from serialization/deserialization of offchain attestations

## 1.4.1

- Check for ethers v6 compatibility

## 1.4.0

- Add customizable salt to offchain attestations to reduce the chance of predictable UIDs (which may be abused in some very specific use-cases)
- Remove unnecessary offchain attestation version input from the `signOffchainAttestation` API
