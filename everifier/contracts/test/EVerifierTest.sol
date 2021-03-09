pragma solidity ^0.6.2;

import {EVerifier} from "../EVerifier.sol";

contract EVerifierTest {
    function MPTProof(bytes32 rootHash, bytes calldata mptkey, bytes calldata proof) pure external returns(bytes memory) {
        return EVerifier.MPTProof(rootHash, mptkey, proof);
    }
}