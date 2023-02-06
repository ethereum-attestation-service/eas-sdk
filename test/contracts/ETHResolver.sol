// SPDX-License-Identifier: MIT

pragma solidity 0.8.18;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";

import { SchemaResolver } from "@ethereum-attestation-service/eas-contracts/contracts/resolver/SchemaResolver.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

/**
 * @title A sample schema resolver that pays attesters (and expects the payment to be returned during revocations)
 */
contract ETHResolver is SchemaResolver {
    using Address for address payable;

    error InvalidValue();

    uint256 private immutable _incentive;

    constructor(IEAS eas, uint256 incentive) SchemaResolver(eas) {
        _incentive = incentive;
    }

    function isPayable() public pure override returns (bool) {
        return true;
    }

    function onAttest(Attestation calldata attestation, uint256 /*value*/) internal virtual override returns (bool) {
        payable(attestation.attester).transfer(_incentive);

        return true;
    }

    function onRevoke(Attestation calldata attestation, uint256 value) internal virtual override returns (bool) {
        if (value < _incentive) {
            return false;
        }

        if (value > _incentive) {
            payable(address(attestation.attester)).sendValue(value - _incentive);
        }

        return true;
    }
}
