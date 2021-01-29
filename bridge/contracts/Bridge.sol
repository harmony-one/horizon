pragma solidity ^0.6.2;

import {IERC20, ERC20} from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "openzeppelin-solidity/contracts/access/Ownable.sol";

import {BridgedToken} from "./BridgedToken.sol";
import {RouterFactory} from "./RouterFactory.sol";
import {Observer, PubSub} from "./IPubSub.sol";

contract Gateway is Ownable,Observer {

    event TokenMapReq(bytes32 indexed chainFrom, address indexed originToken, address indexed tokenReq, uint8 decimals, string name, string symbol);
    bytes32 TokenMapReqEventSig = keccak256("TokenMapReq(bytes32,address,address,uint8,string,string)");
    event TokenMapAck(address indexed tokenReq, address indexed tokenAck);
    bytes32 TokenMapAckEventSig = keccak256("TokenMapAck(address,address)");
    bytes32 ERC20TransferEventSig = keccak256("Transfer(address,address,uint256)");

    address constant INVALID = address(0);
    bytes32 public chainType; // other side chainType: keccak256(chainName)
    address public chainGate; // other side chain gate contract address
    // origin token is created in other chain
    mapping(address=>BridgedToken) public RxMappedForward; // originToken  => mappingToken
    address[] public RxMappedList;

    // origin token is created in this chain 
    mapping(address=>address) public TxMappedForward; // originToken => mappingToken
    mapping(address=>address) public TxMappedInverse; // mappingToken => originToken
    address[] public TxMappedList;

    constructor(bytes32 _chainType) public {
        chainType = _chainType;
    }

    function getMappedSize() view public returns(uint256, uint256) {
        return (TxMappedList.length, RxMappedList.length);
    }

    function bindGate(address gate) public onlyOwner {
        chainGate = gate;
        GateManager manager = GateManager(owner());
        manager.Subscribe(gate);
    }

    function onTokenMapReqEvent(bytes32 chainFrom, address srcToken, address tokenReq, uint8 decimals, string memory name, string memory symbol) private {
        GateManager manager = GateManager(owner());
         BridgedToken token;
        if(chainFrom == chainType) {
            token = manager.newMappingToken(chainFrom, srcToken, decimals, name, symbol);
        }else{
            token = manager.applyMappingToken(chainFrom, srcToken);
        }
        RxMappedForward[tokenReq] = token;
        RxMappedList.push(tokenReq);
        manager.Subscribe(tokenReq);
        emit TokenMapAck(tokenReq, address(token));
    }

    function onTokenMapAckEvent(address tokenReq, address tokenAck) private {
        // event TokenMapAck(address indexed tokenReq, address indexed tokenAck);
        require(TxMappedForward[tokenReq] == INVALID, "impossible ack"); // just check, shouldn't happen
        TxMappedForward[tokenReq] = tokenAck;
        TxMappedInverse[tokenAck] = tokenReq;
        TxMappedList.push(tokenReq);
        
        GateManager manager = GateManager(owner());
        manager.Subscribe(tokenAck);
    }

    function mapToken(ERC20 token) public {
        GateManager manager = GateManager(owner());
        (bytes32 chainFrom, address originToken) = manager.getTokenInfo(address(token));
        if(chainFrom == bytes32(0)) {
            chainFrom = manager.chainType();
            originToken = address(token);
        }
        address tokenReq = address(token);
        //require(chainFrom != chainType, "recursion mapping");
        require(TxMappedForward[tokenReq] == INVALID, "already mapped");
        uint8 decimals = token.decimals();
        string memory name = token.name();
        string memory symbol = token.symbol();
        emit TokenMapReq(chainFrom, originToken, tokenReq, decimals, name, symbol);
    }
    // ...

    function onEvent(address publisher, bytes32[] memory topics, bytes memory data) public override {
        GateManager manager = GateManager(owner());
        PubSub router = manager.GateRouter(chainType);
        require(address(router) == msg.sender, "onlyRouter");
        bytes32 eventSig = topics[0];
        if (publisher == chainGate) {
            if (eventSig == TokenMapReqEventSig) {
                //TokenMapReq(bytes32 indexed chainFrom, address indexed originToken, address indexed tokenReq, uint8 decimals, string name, string symbol);
                bytes32 chainFrom = topics[1];
                address originToken = address(uint160(uint256(topics[2])));
                address tokenReq = address(uint160(uint256(topics[3])));
                (uint8 decimals, string memory name, string memory symbol) = abi.decode(data, (uint8, string, string));
                onTokenMapReqEvent(chainFrom, originToken, tokenReq, decimals, name, symbol);
            } else if (eventSig == TokenMapAckEventSig) {
                address tokenReq = address(uint160(uint256(topics[1])));
                address tokenAck = address(uint160(uint256(topics[2])));
                onTokenMapAckEvent(tokenReq, tokenAck);
            }
            return;
        }
        BridgedToken token = RxMappedForward[publisher];
        address to = address(uint160(uint256(topics[2])));
        require(to == chainGate, "not to gate");
        address from = address(uint160(uint256(topics[1])));
        uint256 value = abi.decode(data, (uint256));
        if(address(token) != INVALID){ // RxMapped token
            token.mint(from, value);
            return;
        }
        token = BridgedToken(TxMappedInverse[publisher]); // TxMapped token; should be ERC2O
        require(address(token) != INVALID, "UNKONW TOKEN");
        if(token.balanceOf(address(this)) < value) {
            manager.transfer(token, from, value); // fee?
        }else{
            token.transfer(from, value);
        }
    }

    function trasnfer(IERC20 token, address to, uint256 amount) public onlyOwner {
        token.transfer(to, amount);
    }
}

contract GateManager is Ownable,Observer {
    address constant INVALID = address(0);

    event newGate(address indexed gate);
    bytes32 constant newGateSig = keccak256("newGate(address)");

    struct TokenInfo {
        bytes32 chainType;
        address token;
    }

    RouterFactory public factory; // constant
    mapping(bytes32=>Gateway) public GateMap;  // chainType => Gateway
    mapping(address=>bytes32) public GateMapInv; // Gateway => chainType
    Gateway[] public Gates;
    mapping(bytes32=>address) public GateManagers;
    mapping(address=>bytes32) public GateRouterInv; // PubSub => chainType
    mapping(bytes32=>PubSub) public GateRouter; // chainType => PubSub
    mapping(address=>TokenInfo) public TokenFrom;

    bytes32 public chainType;
    string public chainName;
    constructor(RouterFactory _factory, string memory _chainName) public {
        factory = _factory;
        chainName = _chainName;
        chainType = keccak256(bytes(_chainName));
    }

    modifier onlyGate() {require(GateMapInv[msg.sender] != bytes32(0), "onlyGate");_;}
    
    function getTokenInfo(address token) public view returns(bytes32, address) {
        TokenInfo storage info = TokenFrom[token];
        return (info.chainType, info.token);
    }

    function GateSize() public view returns(uint256) {
        return Gates.length;
    }

    function transfer(IERC20 token, address to, uint256 amount) public onlyGate {
        for(uint256 i = 0; amount > 0 && i < Gates.length; i++) {
            Gateway gate = Gates[i];
            uint256 balance = token.balanceOf(address(gate));
            if(balance == 0) continue;
            if(balance > amount)
                balance = amount;
            gate.trasnfer(token, to, balance);
            amount -= balance;
        }
        require(amount == 0, "impossible amount!");
    }
    
    function newMappingToken(bytes32 _chainType, address srcToken, 
            uint8 decimals, string memory name, string memory symbol)onlyGate public returns(BridgedToken) {
        bytes32 salt = bytes32(uint256(_chainType)^uint160(srcToken));
        BridgedToken token = new BridgedToken{salt: salt}(name, symbol, decimals); // apporve mintable
        token.grantRole(token.MINTER_ROLE(), msg.sender);
        TokenFrom[address(token)] = TokenInfo(_chainType, srcToken);
        return token;
    }

    function applyMappingToken(bytes32 _chainType, address srcToken) onlyGate public returns(BridgedToken) {
        BridgedToken token = GateMap[_chainType].RxMappedForward(srcToken); // approve mintable
        token.grantRole(token.MINTER_ROLE(), msg.sender);
        return token;
    }

    function createGate(bytes32 _chainType) private {
        Gateway gate = new Gateway{salt:_chainType}(_chainType);
        emit newGate(address(gate));
        GateMap[_chainType] = gate;
        GateMapInv[address(gate)] = _chainType;
        Gates.push(gate);

        PubSub router = factory.createRouter(_chainType);
        GateRouter[_chainType] = router;
        GateRouterInv[address(router)] = _chainType;
    }

    function bindGateManager(bytes32 _chainType, address gateManager) public onlyOwner {
        GateManagers[_chainType] = gateManager;
        createGate(_chainType);
        PubSub router = GateRouter[_chainType];
        router.Subscribe(gateManager, this);
    }

    function onEvent(address publisher, bytes32[] memory topics, bytes memory data) public override {
        bytes32 _chainType = GateRouterInv[msg.sender]; // onlyRouter
        require(publisher == GateManagers[_chainType], "onlyRouter");
        if(topics[0] == newGateSig){
            Gateway gate = GateMap[_chainType];
            address bindGate = address(uint160(uint256(topics[1])));
            gate.bindGate(bindGate);
        }
        data;
    }

    function Subscribe(address from) public onlyGate {
        bytes32 _chainType = GateMapInv[msg.sender];
        PubSub router = GateRouter[_chainType];
        router.Subscribe(from, Observer(msg.sender));
    }
}
