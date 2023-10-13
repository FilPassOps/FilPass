// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Forwarder} from './Forwarder.sol';

contract MultiForwarder is Forwarder {
  event Forward(string id, address from, address payable[] to, uint256[] value, uint total);

  /**
   * forward
   *
   * Forward FIL to up to 100 addresses in a single transaction
   * @param id a unique identifier for the transaction
   * @param addresses an array of addresses to send to
   * @param amounts an array of amounts to send to each address
   */
  function forward(string calldata id, address payable[] calldata addresses, uint256[] calldata amounts) external payable {
    require(addresses.length > 0 && amounts.length > 0, 'addresses and amounts must not be empty');
    require(addresses.length <= 100, 'addresses must not be more than 100');
    require(addresses.length == amounts.length, 'addresses and amounts must be the same length');

    uint totalAmount;
    for (uint8 i; i < amounts.length; i++) {
      totalAmount = totalAmount + amounts[i];
    }
    require(totalAmount == msg.value, 'msg.value must be equal to the sum of all amounts');

    for (uint8 i; i < addresses.length; i++) {
      (bool sent, ) = addresses[i].call{value: amounts[i]}('');
      require(sent, 'Failed to forward to address');
    }

    emit Forward(id, msg.sender, addresses, amounts, totalAmount);
  }
}
