// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "./BridgedToken.sol";
import "./BridgeERC721.sol";
import "./TokenRegistry.sol";
import "./ERC721Registry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
// import "openzeppelin-solidity/contracts/access/Ownable.sol";
// import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract TokenLocker is TokenRegistry, ERC721Registry {
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

    event ERC721Locked(
        address indexed token,
        address indexed sender,
        uint256 id,
        address recipient,
        string metadata
    );

    event Burn(
        address indexed token,
        address indexed sender,
        uint256 amount,
        address recipient
    );

    event ERC721Burn(
        address indexed token,
        address indexed sender,
        uint256 id,
        address recipient
    );

    bytes32 constant lockEventSig =
        keccak256("Locked(address,address,uint256,address)");
    bytes32 constant ERC721LockEventSig =
        keccak256("ERC721Locked(address,address,uint256,address,string)");
    bytes32 constant burnEventSig =
        keccak256("Burn(address,address,uint256,address)");
    bytes32 constant ERC721BurnEventSig =
        keccak256("ERC721Burn(address,address,uint256,address)");

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

    function erc721Unlock(
        BridgeERC721 token,
        address recipient,
        uint256 id
    )
        external
    {
        require(
            recipient != address(0),
            "recipient is a zero address"
        );
        require(
            Rx721MappedInv[address(token)] != address(0),
            "bridge does not exist"
        );
        require(
            token.ownerOf(id) == msg.sender,
            "Caller does not own this token"
        );
        token.burn(id);
        emit ERC721Burn(address(token), msg.sender, id, recipient);
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

    function erc721Lock(
        IERC721Upgradeable token,
        address recipient,
        uint256 id
    )
        external
    {
        require(recipient != address(0), "recipient is a zero address");
        require(
            Tx721Mapped[address(token)] != address(0),
            "bridge does not exist"
        );
        //Check if metadata, fill default value if not
        bytes memory data = abi.encodeWithSignature(
            'tokenURI(uint256)',
            id
        );
        (bool success, bytes memory resultData) = address(token).call(
            data
        );
        string memory uri;
        if(success){
            uri = abi.decode(resultData, (string));
        }
        else{
            uri = "Metadata Not Provided";
        }
        //transfer from user
        token.transferFrom(msg.sender, address(this), id);
        //double check transfer happened (Redundant?)
        require(
            token.ownerOf(id) == address(this),
            "Token failed to transfer"
        );
        //emit event
        emit ERC721Locked(address(token), msg.sender, id, recipient, uri);
    }

    function toReceiptItems(bytes memory rlpdata) private pure returns(RLPReader.RLPItem[] memory receipt) {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        if(rlpdata[0] <= 0x7f) { // if rlpdata[0] between [0,0x7f], it means TransactionType of EIP-2718.
            stacks.memPtr += 1;
            stacks.len -= 1;
        }
        return stacks.toList();
    }

    function execute(bytes memory rlpdata) internal returns (uint256 events) {
        RLPReader.RLPItem[] memory receipt = toReceiptItems(rlpdata);
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

    //This argument passing is an excellent example of how to get around stack too deep
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
