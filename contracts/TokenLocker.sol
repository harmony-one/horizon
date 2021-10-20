// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "./BridgedToken.sol";
import "./TokenRegistry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
// import "openzeppelin-solidity/contracts/access/Ownable.sol";
// import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract TokenLocker is TokenRegistry {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeMathUpgradeable for uint256;

    event Locked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        address recipient
    );

    event Burn(
        address indexed token,
        address indexed sender,
        uint256 amount,
        address recipient
    );

    bytes32 constant lockEventSig =
        keccak256("Locked(address,address,uint256,address)");
    bytes32 constant burnEventSig =
        keccak256("Burn(address,address,uint256,address)");

    address public otherSideBridge;

    function unlock(
        BridgedToken token,
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "recipient is a zero address");
        require(
            RxMappedInv[address(token)] != address(0),
            "bridge does not exist"
        );
        token.burnFrom(msg.sender, amount);
        emit Burn(address(token), msg.sender, amount, recipient);
    }

    function lock(
        IERC20Upgradeable token,
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "recipient is a zero address");
        require(
            TxMapped[address(token)] != address(0),
            "bridge does not exist"
        );
        // grabbing the actual amount that is transferred
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 balanceAfter = token.balanceOf(address(this));
        uint256 actualAmount = balanceAfter.sub(balanceBefore);
        emit Locked(address(token), msg.sender, actualAmount, recipient);
    }

    function execute(bytes memory rlpdata) internal returns (uint256 events) {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        RLPReader.RLPItem[] memory receipt = stacks.toList();
        // TODO: check txs is revert or not
        uint256 postStateOrStatus = receipt[0].toUint();
        require(postStateOrStatus == 1, "revert receipt");
        RLPReader.RLPItem[] memory logs = receipt[3].toList();
        for (uint256 i = 0; i < logs.length; i++) {
            RLPReader.RLPItem[] memory rlpLog = logs[i].toList();
            address Address = rlpLog[0].toAddress();
            if (Address != otherSideBridge) continue;
            RLPReader.RLPItem[] memory Topics = rlpLog[1].toList(); // TODO: if is lock event
            bytes32[] memory topics = new bytes32[](Topics.length);
            for (uint256 j = 0; j < Topics.length; j++) {
                topics[j] = bytes32(Topics[j].toUint());
            }
            bytes memory Data = rlpLog[2].toBytes();
            if (topics[0] == lockEventSig) {
                onLockEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == burnEventSig) {
                onBurnEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == TokenMapReqEventSig) {
                onTokenMapReqEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == TokenMapAckEventSig) {
                onTokenMapAckEvent(topics);
                events++;
                continue;
            }
        }
    }

    function onBurnEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(
            data,
            (uint256, address)
        );
        IERC20Upgradeable lockedToken = TxMappedInv[token];
        lockedToken.safeTransfer(recipient, amount);
    }

    function onLockEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(
            data,
            (uint256, address)
        );
        BridgedToken mintToken = RxMapped[token];
        require(address(mintToken) != address(0));
        mintToken.mint(recipient, amount);
    }
}
