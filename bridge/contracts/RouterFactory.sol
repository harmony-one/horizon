pragma solidity ^0.6.2;

import "./LightClient.sol";
import "./EventRouter.sol";

contract RouterFactory is Ownable {
    address constant INVALID = address(0);
    mapping(bytes32=>ILightClient) public LightClients;
    function createRouter(bytes32 chainType) public returns(PubSub) {
        ILightClient client = LightClients[chainType];
        require(address(client) != INVALID, "require light client");
        EventRouter router = new EventRouter(client);
        router.transferOwnership(msg.sender);
        return router;
    }

    function addLightClient(bytes32 chainType, ILightClient lightClient) onlyOwner public {
        LightClients[chainType] = lightClient;
    }
}