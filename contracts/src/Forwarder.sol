// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface Forwarder {
  function forward(string calldata id, bytes32[] calldata addresses, uint256[] calldata amounts) external payable;

  function forwardAny(string calldata id, bytes[] calldata addresses, uint256[] calldata amounts) external payable;
}
