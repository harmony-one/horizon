pragma solidity ^0.5.0;

import "./RLPReader.sol";

contract receiptReader {
    using RLPReader for RLPReader.RLPItem;
	using RLPReader for bytes;
// KILL WARNING
/*
	function traverse(bytes memory rlpdata) pure public {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        RLPReader.RLPItem[] memory receipt = stacks.toList();
        bytes memory PostStateOrStatus = receipt[0].toBytes();
        uint CumulativeGasUsed = receipt[1].toUint();
        bytes memory Bloom = receipt[2].toBytes();
        RLPReader.RLPItem[] memory Logs = receipt[3].toList();
        for(uint i = 0; i < Logs.length; i++) {
            RLPReader.RLPItem[] memory rlpLog = Logs[i].toList();
            address Address = rlpLog[0].toAddress(); // TODO: if is erc20 contract address
            RLPReader.RLPItem[] memory Topics = rlpLog[1].toList(); // TODO: if is lock event
            for(uint j = 0; j < Topics.length; j++) {
                bytes32 Hash = bytes32(Topics[j].toUint());
            }
            bytes memory Data = rlpLog[2].toBytes();
        }
	}
*/
}