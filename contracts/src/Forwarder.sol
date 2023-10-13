// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface Forwarder {
  function forward(string calldata id, address payable[] calldata addresses, uint256[] calldata amounts) external payable;
}
