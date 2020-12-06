/**
* Created on 2019-12-28
* @summary: coding implement for NextyPreCompiled lib
* @author: Tuan Vu (tuanvd@gmail.com)
*/

pragma solidity ^0.5.0;

import "./EthCommon.sol";

/**
* The NextyPreCompiled contract supports to call pre-compiled contracts deployed on Nexty network
*/
library NextyPreCompiled {

	function verifyEthash (
		uint _blockNumber,
		uint _blockDifficulty,
		uint _blockNonce,
		uint _blockMixHash,
		uint _blockSealHash
		) internal returns(bool)
	{
        //TODO: implement pow verification (https://github.com/pantos-io/ethash/blob/master/contracts/Ethash.sol)
        return true;
		// bytes memory input = abi.encodePacked(_blockNumber, _blockDifficulty, _blockNonce, _blockMixHash, _blockSealHash);
		// uint len = input.length;
		// bool success = true;
		// uint output = 0;
		// assembly {
  //   	   // Define pointer address to hold the call result
  //       	let r := mload(0x40)
  //       	if iszero(call(not(0), 0xFE, 0, add(input, 0x20), len, r, 32)) {
  //       		success := 0
  //       	}
  //       	output := mload(r)
  //       }
  //       if (!success) {
  //       	revert("Failed to call pre-compiled contract verifyEthash");
  //       }

  //       return (output != 0);
    }

}
