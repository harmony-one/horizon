// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;



interface IEventExecutor {

    function executeEvent(
        bytes calldata _transactionData,
        address _sendTo,
        uint256 _value
    )
        external
        returns (bool);


}