// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {SafeMath} from '@openzeppelin/contracts/utils/math/SafeMath.sol';

contract MultiForwarder {
  using SafeMath for uint256;

  event ForwardAny(string id, address from, bytes[] to, uint256[] value, uint total);
  event Forward(string id, address from, bytes32[] to, uint256[] value, uint total);

  /**
   * forward
   *
   * Forward FIL to up to 100 addresses (Secp256k1, Actor or Delegated)
   * @notice this function does not support BLS and ID addresses
   * @param id a unique identifier for the transaction
   * @param addresses an array of addresses in bytes32 format
   * @param amounts an array of amounts to send to each address
   */
  function forward(string calldata id, bytes32[] calldata addresses, uint256[] calldata amounts) external payable {
    require(addresses.length > 0 && amounts.length > 0, 'addresses and amounts must not be empty');
    require(addresses.length <= 100, 'addresses must not be more than 100');
    require(addresses.length == amounts.length, 'addresses and amounts must be the same length');

    uint totalAmount;
    for (uint8 i; i < amounts.length; i++) {
      totalAmount = totalAmount.add(amounts[i]);
    }
    require(totalAmount == msg.value, 'msg.value must be equal to the sum of all amounts');

    for (uint256 i = 0; i < addresses.length; i++) {
      address payable recipient = payable(address(uint160(bytes20(addresses[i]))));
      uint256 amount = amounts[i];

      require(recipient != address(0), 'Invalid recipient address');
      require(amount > 0, 'Amount must be greater than 0');
      require(address(this).balance >= amount, 'Insufficient contract balance');

      (bool success, ) = recipient.call{value: amount}('');
      require(success, 'Forwarding funds failed');
    }

    emit Forward(id, msg.sender, addresses, amounts, totalAmount);
  }

  /**
   * forwardAny
   *
   * Forward FIL to up to 45 addresses (ID, Secp256k1, Actor, BLS or Delegated)
   * @param id a unique identifier for the transaction
   * @param addresses an array of addresses in bytes format
   * @param amounts an array of amounts to send to each address
   */
  function forwardAny(string calldata id, bytes[] calldata addresses, uint256[] calldata amounts) external payable {
    require(addresses.length > 0 && amounts.length > 0, 'addresses and amounts must not be empty');
    require(addresses.length <= 45, 'addresses must not be more than 45');
    require(addresses.length == amounts.length, 'addresses and amounts must be the same length');

    uint totalAmount;
    for (uint8 i; i < amounts.length; i++) {
      totalAmount = totalAmount.add(amounts[i]);
    }
    require(totalAmount == msg.value, 'msg.value must be equal to the sum of all amounts');

    for (uint256 i = 0; i < addresses.length; i++) {
      address payable recipient = payable(address(bytes20(addresses[i])));
      uint256 amount = amounts[i];

      require(recipient != address(0), 'Invalid recipient address');
      require(amount > 0, 'Amount must be greater than 0');
      require(address(this).balance >= amount, 'Insufficient contract balance');

      (bool success, ) = recipient.call{value: amount}('');
      require(success, 'Forwarding funds failed');

      emit ForwardAny(id, msg.sender, addresses, amounts, totalAmount);
    }
  }
}
