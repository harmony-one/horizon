// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import {EVerifier} from "../EthereumProver.sol";

contract EVerifierTest {
    function MPTProof(bytes32 rootHash, bytes calldata mptkey, bytes calldata proof) pure external returns(bytes memory) {
        return EVerifier.MPTProof(rootHash, mptkey, proof);
    }
}