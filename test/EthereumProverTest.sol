// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import {EProver} from "../contracts/EthereumProver.sol";

contract EProverTest {
    function ValidateMPTProof(bytes32 rootHash, bytes calldata mptkey, bytes calldata proof) pure external returns(bytes memory) {
        return EProver.validateMPTProof(rootHash, mptkey, proof);
    }
}