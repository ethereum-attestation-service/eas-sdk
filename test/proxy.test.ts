import { keccak256 } from "@ethersproject/keccak256";
import { Wallet } from "@ethersproject/wallet";
import { toUtf8Bytes } from "@ethersproject/strings";
import { splitSignature, joinSignature, hexlify } from "@ethersproject/bytes";
import { recoverAddress } from "@ethersproject/transactions";
import { signTypedData_v4, recoverTypedSignature_v4 } from "eth-sig-util";
import { ecsign } from "ethereumjs-util";

import {
  Proxy,
  Signature,
  ATTEST_TYPED_SIGNATURE,
  REVOKE_TYPED_SIGNATURE,
  EIP712AttestationTypedData,
  EIP712RevocationTypedData
} from "../src/proxy";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

describe("type hashes", () => {
  it("should have matching ATTEST_TYPE to the contract's ATTEST_TYPEHASH", () => {
    expect(keccak256(toUtf8Bytes(ATTEST_TYPED_SIGNATURE))).toEqual(
      "0x65c1f6a23cba082e11808f5810768554fa9dfba7aa5f718980214483e87e1031"
    );
  });

  it("should have matching REVOKE_TYPE to the contract's REVOKE_TYPEHASH", () => {
    expect(keccak256(toUtf8Bytes(REVOKE_TYPED_SIGNATURE))).toEqual(
      "0xbae0931f3a99efd1b97c2f5b6b6e79d16418246b5055d64757e16de5ad11a8ab"
    );
  });
});

describe("attest", () => {
  let proxy: Proxy;

  beforeEach(() => {
    proxy = new Proxy({ address: "0xa533e32144b5be3f76446f47696bbe0764d5339b", version: "0.1", chainId: 1 });
  });

  it("should create a proper EIP712 attestation request", async () => {
    const params = {
      recipient: ZERO_ADDRESS,
      ao: 123,
      expirationTime: 100000,
      refUUID: ZERO_BYTES32,
      data: Buffer.alloc(0),
      nonce: 0
    };

    const wallet = Wallet.createRandom();
    const request = await proxy.getAttestationRequest(params, async (message: Buffer) => {
      const { v, r, s } = ecsign(message, Buffer.from(wallet._signingKey().privateKey.slice(2), "hex"));
      return { v, r, s };
    });

    expect(
      await proxy.verifyAttestationRequest(
        await wallet.getAddress(),
        request,
        async (message: Buffer, signature: Signature) => {
          const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
          return recoverAddress(message, sig);
        }
      )
    ).toBeTruthy();
  });

  it("should create a proper EIP712 attestation typed data request", async () => {
    const params = {
      recipient: ZERO_ADDRESS,
      ao: 555,
      expirationTime: 12,
      refUUID: ZERO_BYTES32,
      data: Buffer.from("1234", "hex"),
      nonce: 500
    };

    const wallet = Wallet.createRandom();
    const request = await proxy.getAttestationTypedDataRequest(params, async (data: EIP712AttestationTypedData) => {
      const { v, r, s } = splitSignature(
        await signTypedData_v4(Buffer.from(wallet._signingKey().privateKey.slice(2), "hex"), { data })
      );
      return { v, r: Buffer.from(r.slice(2), "hex"), s: Buffer.from(s.slice(2), "hex") };
    });

    await proxy.getAttestationRequest(params, async (message: Buffer) => {
      const { v, r, s } = ecsign(message, Buffer.from(wallet._signingKey().privateKey.slice(2), "hex"));
      return { v, r, s };
    });

    expect(
      await proxy.verifyAttestationTypedDataRequest(
        await wallet.getAddress(),
        request,
        async (data: EIP712AttestationTypedData, signature: Signature) => {
          return recoverTypedSignature_v4({
            data,
            sig: joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) })
          });
        }
      )
    ).toBeTruthy();

    const request2 = { params, v: request.v, r: request.r, s: request.s };
    expect(
      await proxy.verifyAttestationRequest(
        await wallet.getAddress(),
        request2,
        async (message: Buffer, signature: Signature) => {
          const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
          return recoverAddress(message, sig);
        }
      )
    ).toBeTruthy();
  });

  it("should create a proper EIP712 revocation request", async () => {
    const params = {
      uuid: ZERO_BYTES32,
      nonce: 0
    };

    const wallet = Wallet.createRandom();
    const request = await proxy.getRevocationRequest(params, async (message: Buffer) => {
      const { v, r, s } = ecsign(message, Buffer.from(wallet._signingKey().privateKey.slice(2), "hex"));
      return { v, r, s };
    });

    expect(
      await proxy.verifyRevocationRequest(
        await wallet.getAddress(),
        request,
        async (message: Buffer, signature: Signature) => {
          const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
          return recoverAddress(message, sig);
        }
      )
    ).toBeTruthy();
  });

  it("should create a proper EIP712 revocation typed data request", async () => {
    const params = {
      uuid: ZERO_BYTES32,
      nonce: 10
    };

    const wallet = Wallet.createRandom();
    const request = await proxy.getRevocationTypedDataRequest(params, async (data: EIP712RevocationTypedData) => {
      const { v, r, s } = splitSignature(
        await signTypedData_v4(Buffer.from(wallet._signingKey().privateKey.slice(2), "hex"), { data })
      );

      return { v, r: Buffer.from(r.slice(2), "hex"), s: Buffer.from(s.slice(2), "hex") };
    });

    expect(
      await proxy.verifyRevocationTypedDataRequest(
        await wallet.getAddress(),
        request,
        async (data: EIP712RevocationTypedData, signature: Signature) => {
          return recoverTypedSignature_v4({
            data,
            sig: joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) })
          });
        }
      )
    ).toBeTruthy();

    const request2 = { params, v: request.v, r: request.r, s: request.s };
    expect(
      await proxy.verifyRevocationRequest(
        await wallet.getAddress(),
        request2,
        async (message: Buffer, signature: Signature) => {
          const sig = joinSignature({ v: signature.v, r: hexlify(signature.r), s: hexlify(signature.s) });
          return recoverAddress(message, sig);
        }
      )
    ).toBeTruthy();
  });
});
