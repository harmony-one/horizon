pragma solidity ^0.6.2;

interface Observer {
    function onEvent(address publisher, bytes32[] calldata topics, bytes calldata data) external;
}

abstract contract PubSub {
    function Subscribe(address publisher, Observer ob) public virtual;
    function Publish(address publisher, bytes32[] memory topics, bytes memory data) internal virtual;
}