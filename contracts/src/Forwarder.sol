// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface Forwarder {
  function forward(string calldata id, address payable[] calldata addresses, uint256[] calldata amounts) external payable;

  function forwardERC20(string calldata id, address[] calldata addresses, uint256[] calldata amounts, address tokenAddress) external;
}
