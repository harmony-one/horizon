// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "./BridgedToken.sol";
import "./BridgeERC721.sol";
import "./TokenRegistry.sol";
import "./ERC721Registry.sol";
import "./ERC1155Registry.sol";
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

contract TokenLocker is TokenRegistry, ERC721Registry, ERC1155Registry {
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

    event ERC1155Locked(
        address indexed token,
        address indexed sender,
        uint256 id,
        uint256 amount,
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

    event ERC1155Burn(
        address indexed token,
        address indexed sender,
        uint256 id,
        uint256 amount,
        address recipient
    );

    bytes32 constant lockEventSig =
        keccak256("Locked(address,address,uint256,address)");
    bytes32 constant ERC721LockEventSig =
        keccak256("ERC721Locked(address,address,uint256,address,string)");
    bytes32 constant ERC1155LockEventSig =
        keccak256("ERC1155Locked(address,address,uint256,uint256,address,string)");
    bytes32 constant burnEventSig =
        keccak256("Burn(address,address,uint256,address)");
    bytes32 constant ERC721BurnEventSig =
        keccak256("ERC721Burn(address,address,uint256,address)");
    bytes32 constant ERC1155BurnEventSig =
        keccak256("ERC1155Burn(address,address,uint256,uint256,address)");

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

    function erc1155Unlock(
        BridgeERC1155 token,
        address recipient,
        uint256 id,
        uint256 amount
    )
        external
    {
        require(
            recipient != address(0),
            "recipient is a zero address"
        );
        require(
            Rx1155MappedInv[address(token)] != address(0),
            "bridge does not exist"
        );
        token.burn(msg.sender, id, amount);
        emit ERC1155Burn(address(token), msg.sender, id, amount, recipient);
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

    function erc1155Lock(
        BridgeERC1155 token,
        address recipient,
        uint256 id,
        uint256 amount
    )
        external
    {
        require(recipient != address(0), "recipient is a zero address");
        require(
            Tx1155Mapped[address(token)] != address(0),
            "bridge does not exist"
        );
        //Check if metadata, fill default value if not
        bytes memory data = abi.encodeWithSignature(
            'uri(uint256)',
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
        token.safeTransferFrom(msg.sender, address(this), id, amount, "");
        //emit event
        emit ERC1155Locked(address(token), msg.sender, id, amount, recipient, uri);
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
            if (topics[0] == ERC721BurnEventSig) {
                onERC721BurnEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == ERC721LockEventSig) {
                onERC721LockEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == ERC1155BurnEventSig) {
                onERC1155BurnEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == ERC1155LockEventSig) {
                onERC1155LockEvent(topics, Data);
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
            if (topics[0] == ERC721MapReqEventSig) {
                onERC721MapReqEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == ERC721MapAckEventSig) {
                onTokenERC721AckEvent(topics);
                events++;
                continue;
            }
            if (topics[0] == ERC1155MapReqEventSig) {
                onERC1155MapReqEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == ERC1155MapAckEventSig) {
                onTokenERC1155AckEvent(topics);
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

    function onERC721BurnEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 id, address recipient) = abi.decode(
            data,
            (uint256, address)
        );
        IERC721Upgradeable lockedToken = Tx721MappedInv[token];
        lockedToken.transferFrom(address(this), recipient, id);
    }

    function onERC1155BurnEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 id, uint256 amount, address recipient) = abi.decode(
            data,
            (uint256, uint256, address)
        );
        IERC1155Upgradeable lockedToken = Tx1155MappedInv[token];
        lockedToken.safeTransferFrom(address(this), recipient, id, amount, "");
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

    function onERC721LockEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 id, address recipient, string memory uri) = abi.decode(
            data,
            (uint256, address, string)
        );
        BridgeERC721 mintToken = Rx721Mapped[token];
        require(address(mintToken) != address(0));
        mintToken.mint(recipient, id, uri);
    }

    function onERC1155LockEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 id, uint256 amount, address recipient, string memory uri) = abi.decode(
            data,
            (uint256, uint256, address, string)
        );
        BridgeERC1155 mintToken = Rx1155Mapped[token];
        require(address(mintToken) != address(0));
        mintToken.mint(recipient, id, amount, uri);
    }
}
