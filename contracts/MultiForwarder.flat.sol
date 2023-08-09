// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/*******************************************************************************
 *   (c) 2022 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
//
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @title This library is helper method to send funds to some specific address. Calling one of its methods will result in a cross-actor call being performed.
/// @author Zondax AG
library SendAPI {
  /// @notice send token to a specific actor
  /// @param target The id address (uint64) you want to send funds to
  /// @param value tokens to be transferred to the receiver
  function send(CommonTypes.FilActorId target, uint256 value) internal {
    bytes memory result = Actor.callByID(target, 0, Misc.NONE_CODEC, new bytes(0), value, false);
    if (result.length != 0) {
      revert Actor.InvalidResponseLength();
    }
  }

  /// @notice send token to a specific actor
  /// @param target The address you want to send funds to
  /// @param value tokens to be transferred to the receiver
  function send(CommonTypes.FilAddress memory target, uint256 value) internal {
    bytes memory result = Actor.callByAddress(target.data, 0, Misc.NONE_CODEC, new bytes(0), value, false);
    if (result.length != 0) {
      revert Actor.InvalidResponseLength();
    }
  }
}

/*******************************************************************************
 *   (c) 2022 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @title Call actors utilities library, meant to interact with Filecoin builtin actors
/// @author Zondax AG
library Actor {
  /// @notice precompile address for the call_actor precompile
  address constant CALL_ACTOR_ADDRESS = 0xfe00000000000000000000000000000000000003;

  /// @notice precompile address for the call_actor_id precompile
  address constant CALL_ACTOR_ID = 0xfe00000000000000000000000000000000000005;

  /// @notice flag used to indicate that the call_actor or call_actor_id should perform a static_call to the desired actor
  uint64 constant READ_ONLY_FLAG = 0x00000001;

  /// @notice flag used to indicate that the call_actor or call_actor_id should perform a call to the desired actor
  uint64 constant DEFAULT_FLAG = 0x00000000;

  /// @notice the provided address is not valid
  error InvalidAddress(bytes addr);

  /// @notice the smart contract has no enough balance to transfer
  error NotEnoughBalance(uint256 balance, uint256 value);

  /// @notice the provided actor id is not valid
  error InvalidActorID(CommonTypes.FilActorId actorId);

  /// @notice an error happened trying to call the actor
  error FailToCallActor();

  /// @notice the response received is not correct. In some case no response is expected and we received one, or a response was indeed expected and we received none.
  error InvalidResponseLength();

  /// @notice the codec received is not valid
  error InvalidCodec(uint64);

  /// @notice the called actor returned an error as part of its expected behaviour
  error ActorError(int256 errorCode);

  /// @notice the actor is not found
  error ActorNotFound();

  /// @notice allows to interact with an specific actor by its address (bytes format)
  /// @param actor_address actor address (bytes format) to interact with
  /// @param method_num id of the method from the actor to call
  /// @param codec how the request data passed as argument is encoded
  /// @param raw_request encoded arguments to be passed in the call
  /// @param value tokens to be transferred to the called actor
  /// @param static_call indicates if the call will be allowed to change the actor state or not (just read the state)
  /// @return payload (in bytes) with the actual response data (without codec or response code)
  function callByAddress(
    bytes memory actor_address,
    uint256 method_num,
    uint64 codec,
    bytes memory raw_request,
    uint256 value,
    bool static_call
  ) internal returns (bytes memory) {
    if (actor_address.length < 2) {
      revert InvalidAddress(actor_address);
    }

    validatePrecompileCall(CALL_ACTOR_ADDRESS, value);

    // We have to delegate-call the call-actor precompile because the call-actor precompile will
    // call the target actor on our behalf. This will _not_ delegate to the target `actor_address`.
    //
    // Specifically:
    //
    // - `static_call == false`: `CALLER (you) --(DELEGATECALL)-> CALL_ACTOR_PRECOMPILE --(CALL)-> actor_address
    // - `static_call == true`:  `CALLER (you) --(DELEGATECALL)-> CALL_ACTOR_PRECOMPILE --(STATICCALL)-> actor_address
    (bool success, bytes memory data) = address(CALL_ACTOR_ADDRESS).delegatecall(
      abi.encode(uint64(method_num), value, static_call ? READ_ONLY_FLAG : DEFAULT_FLAG, codec, raw_request, actor_address)
    );
    if (!success) {
      revert FailToCallActor();
    }

    return readRespData(data);
  }

  /// @notice allows to interact with an specific actor by its id (uint64)
  /// @param target actor id (uint64) to interact with
  /// @param method_num id of the method from the actor to call
  /// @param codec how the request data passed as argument is encoded
  /// @param raw_request encoded arguments to be passed in the call
  /// @param value tokens to be transferred to the called actor
  /// @param static_call indicates if the call will be allowed to change the actor state or not (just read the state)
  /// @return payload (in bytes) with the actual response data (without codec or response code)
  function callByID(
    CommonTypes.FilActorId target,
    uint256 method_num,
    uint64 codec,
    bytes memory raw_request,
    uint256 value,
    bool static_call
  ) internal returns (bytes memory) {
    validatePrecompileCall(CALL_ACTOR_ID, value);

    (bool success, bytes memory data) = address(CALL_ACTOR_ID).delegatecall(
      abi.encode(uint64(method_num), value, static_call ? READ_ONLY_FLAG : DEFAULT_FLAG, codec, raw_request, target)
    );
    if (!success) {
      revert FailToCallActor();
    }

    return readRespData(data);
  }

  /// @notice allows to run some generic validations before calling the precompile actor
  /// @param addr precompile actor address to run check to
  /// @param value tokens to be transferred to the called actor
  function validatePrecompileCall(address addr, uint256 value) internal view {
    uint balance = address(this).balance;
    if (balance < value) {
      revert NotEnoughBalance(balance, value);
    }

    bool actorExists = Misc.addressExists(addr);
    if (!actorExists) {
      revert ActorNotFound();
    }
  }

  /// @notice allows to interact with an non-singleton actors by its id (uint64)
  /// @param target actor id (uint64) to interact with
  /// @param method_num id of the method from the actor to call
  /// @param codec how the request data passed as argument is encoded
  /// @param raw_request encoded arguments to be passed in the call
  /// @param value tokens to be transfered to the called actor
  /// @param static_call indicates if the call will be allowed to change the actor state or not (just read the state)
  /// @dev it requires the id to be bigger than 99, as singleton actors are smaller than that
  function callNonSingletonByID(
    CommonTypes.FilActorId target,
    uint256 method_num,
    uint64 codec,
    bytes memory raw_request,
    uint256 value,
    bool static_call
  ) internal returns (bytes memory) {
    if (CommonTypes.FilActorId.unwrap(target) < 100) {
      revert InvalidActorID(target);
    }

    return callByID(target, method_num, codec, raw_request, value, static_call);
  }

  /// @notice parse the response an actor returned
  /// @notice it will validate the return code (success) and the codec (valid one)
  /// @param raw_response raw data (bytes) the actor returned
  /// @return the actual raw data (payload, in bytes) to be parsed according to the actor and method called
  function readRespData(bytes memory raw_response) internal pure returns (bytes memory) {
    (int256 exit, uint64 return_codec, bytes memory return_value) = abi.decode(raw_response, (int256, uint64, bytes));

    if (return_codec == Misc.NONE_CODEC) {
      if (return_value.length != 0) {
        revert InvalidResponseLength();
      }
    } else if (return_codec == Misc.CBOR_CODEC || return_codec == Misc.DAG_CBOR_CODEC) {
      if (return_value.length == 0) {
        revert InvalidResponseLength();
      }
    } else {
      revert InvalidCodec(return_codec);
    }

    if (exit != 0) {
      revert ActorError(exit);
    }

    return return_value;
  }
}

/*******************************************************************************
 *   (c) 2022 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @title Library containing miscellaneous functions used on the project
/// @author Zondax AG
library Misc {
  uint64 constant DAG_CBOR_CODEC = 0x71;
  uint64 constant CBOR_CODEC = 0x51;
  uint64 constant NONE_CODEC = 0x00;

  // Code taken from Openzeppelin repo
  // Link: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/0320a718e8e07b1d932f5acb8ad9cec9d9eed99b/contracts/utils/math/SignedMath.sol#L37-L42
  /// @notice get the abs from a signed number
  /// @param n number to get abs from
  /// @return unsigned number
  function abs(int256 n) internal pure returns (uint256) {
    unchecked {
      // must be unchecked in order to support `n = type(int256).min`
      return uint256(n >= 0 ? n : -n);
    }
  }

  /// @notice validate if an address exists or not
  /// @dev read this article for more information https://blog.finxter.com/how-to-find-out-if-an-ethereum-address-is-a-contract/
  /// @param addr address to check
  /// @return whether the address exists or not
  function addressExists(address addr) internal view returns (bool) {
    bytes32 codehash;
    assembly {
      codehash := extcodehash(addr)
    }
    return codehash != 0x0;
  }

  /// Returns the data size required by CBOR.writeFixedNumeric
  function getPrefixSize(uint256 data_size) internal pure returns (uint256) {
    if (data_size <= 23) {
      return 1;
    } else if (data_size <= 0xFF) {
      return 2;
    } else if (data_size <= 0xFFFF) {
      return 3;
    } else if (data_size <= 0xFFFFFFFF) {
      return 5;
    }
    return 9;
  }

  function getBytesSize(bytes memory value) internal pure returns (uint256) {
    return getPrefixSize(value.length) + value.length;
  }

  function getCidSize(bytes memory value) internal pure returns (uint256) {
    return getPrefixSize(2) + value.length;
  }

  function getFilActorIdSize(CommonTypes.FilActorId value) internal pure returns (uint256) {
    uint64 val = CommonTypes.FilActorId.unwrap(value);
    return getPrefixSize(uint256(val));
  }

  function getChainEpochSize(CommonTypes.ChainEpoch value) internal pure returns (uint256) {
    int64 val = CommonTypes.ChainEpoch.unwrap(value);
    if (val >= 0) {
      return getPrefixSize(uint256(uint64(val)));
    } else {
      return getPrefixSize(uint256(uint64(-1 - val)));
    }
  }

  function getBoolSize() internal pure returns (uint256) {
    return getPrefixSize(1);
  }
}

/*******************************************************************************
 *   (c) 2022 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @notice This library is a set a functions that allows to handle filecoin addresses conversions and validations
/// @author Zondax AG
library FilAddresses {
  using Buffer for Buffer.buffer;

  error InvalidAddress();

  /// @notice allow to get a FilAddress from an eth address
  /// @param addr eth address to convert
  /// @return new filecoin address
  function fromEthAddress(address addr) internal pure returns (CommonTypes.FilAddress memory) {
    return CommonTypes.FilAddress(abi.encodePacked(hex'040a', addr));
  }

  /// @notice allow to create a Filecoin address from an actorID
  /// @param actorID uint64 actorID
  /// @return address filecoin address
  function fromActorID(uint64 actorID) internal pure returns (CommonTypes.FilAddress memory) {
    Buffer.buffer memory result = Leb128.encodeUnsignedLeb128FromUInt64(actorID);
    return CommonTypes.FilAddress(abi.encodePacked(hex'00', result.buf));
  }

  /// @notice allow to create a Filecoin address from bytes
  /// @param data address in bytes format
  /// @return filecoin address
  function fromBytes(bytes memory data) internal pure returns (CommonTypes.FilAddress memory) {
    CommonTypes.FilAddress memory newAddr = CommonTypes.FilAddress(data);
    if (!validate(newAddr)) {
      revert InvalidAddress();
    }

    return newAddr;
  }

  /// @notice allow to validate if an address is valid or not
  /// @dev we are only validating known address types. If the type is not known, the default value is true
  /// @param addr the filecoin address to validate
  /// @return whether the address is valid or not
  function validate(CommonTypes.FilAddress memory addr) internal pure returns (bool) {
    if (addr.data[0] == 0x00) {
      return addr.data.length <= 10;
    } else if (addr.data[0] == 0x01 || addr.data[0] == 0x02) {
      return addr.data.length == 21;
    } else if (addr.data[0] == 0x03) {
      return addr.data.length == 49;
    } else if (addr.data[0] == 0x04) {
      return addr.data.length <= 64;
    }

    return addr.data.length <= 256;
  }
}

/**
 * @dev A library for working with mutable byte buffers in Solidity.
 *
 * Byte buffers are mutable and expandable, and provide a variety of primitives
 * for appending to them. At any time you can fetch a bytes object containing the
 * current contents of the buffer. The bytes object should not be stored between
 * operations, as it may change due to resizing of the buffer.
 */
library Buffer {
  /**
   * @dev Represents a mutable buffer. Buffers have a current value (buf) and
   *      a capacity. The capacity may be longer than the current value, in
   *      which case it can be extended without the need to allocate more memory.
   */
  struct buffer {
    bytes buf;
    uint capacity;
  }

  /**
   * @dev Initializes a buffer with an initial capacity.
   * @param buf The buffer to initialize.
   * @param capacity The number of bytes of space to allocate the buffer.
   * @return The buffer, for chaining.
   */
  function init(buffer memory buf, uint capacity) internal pure returns (buffer memory) {
    if (capacity % 32 != 0) {
      capacity += 32 - (capacity % 32);
    }
    // Allocate space for the buffer data
    buf.capacity = capacity;
    assembly {
      let ptr := mload(0x40)
      mstore(buf, ptr)
      mstore(ptr, 0)
      let fpm := add(32, add(ptr, capacity))
      if lt(fpm, ptr) {
        revert(0, 0)
      }
      mstore(0x40, fpm)
    }
    return buf;
  }

  /**
   * @dev Initializes a new buffer from an existing bytes object.
   *      Changes to the buffer may mutate the original value.
   * @param b The bytes object to initialize the buffer with.
   * @return A new buffer.
   */
  function fromBytes(bytes memory b) internal pure returns (buffer memory) {
    buffer memory buf;
    buf.buf = b;
    buf.capacity = b.length;
    return buf;
  }

  function resize(buffer memory buf, uint capacity) private pure {
    bytes memory oldbuf = buf.buf;
    init(buf, capacity);
    append(buf, oldbuf);
  }

  /**
   * @dev Sets buffer length to 0.
   * @param buf The buffer to truncate.
   * @return The original buffer, for chaining..
   */
  function truncate(buffer memory buf) internal pure returns (buffer memory) {
    assembly {
      let bufptr := mload(buf)
      mstore(bufptr, 0)
    }
    return buf;
  }

  /**
   * @dev Appends len bytes of a byte string to a buffer. Resizes if doing so would exceed
   *      the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @param len The number of bytes to copy.
   * @return The original buffer, for chaining.
   */
  function append(buffer memory buf, bytes memory data, uint len) internal pure returns (buffer memory) {
    require(len <= data.length);

    uint off = buf.buf.length;
    uint newCapacity = off + len;
    if (newCapacity > buf.capacity) {
      resize(buf, newCapacity * 2);
    }

    uint dest;
    uint src;
    assembly {
      // Memory address of the buffer data
      let bufptr := mload(buf)
      // Length of existing buffer data
      let buflen := mload(bufptr)
      // Start address = buffer address + offset + sizeof(buffer length)
      dest := add(add(bufptr, 32), off)
      // Update buffer length if we're extending it
      if gt(newCapacity, buflen) {
        mstore(bufptr, newCapacity)
      }
      src := add(data, 32)
    }

    // Copy word-length chunks while possible
    for (; len >= 32; len -= 32) {
      assembly {
        mstore(dest, mload(src))
      }
      dest += 32;
      src += 32;
    }

    // Copy remaining bytes
    unchecked {
      uint mask = (256 ** (32 - len)) - 1;
      assembly {
        let srcpart := and(mload(src), not(mask))
        let destpart := and(mload(dest), mask)
        mstore(dest, or(destpart, srcpart))
      }
    }

    return buf;
  }

  /**
   * @dev Appends a byte string to a buffer. Resizes if doing so would exceed
   *      the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @return The original buffer, for chaining.
   */
  function append(buffer memory buf, bytes memory data) internal pure returns (buffer memory) {
    return append(buf, data, data.length);
  }

  /**
   * @dev Appends a byte to the buffer. Resizes if doing so would exceed the
   *      capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @return The original buffer, for chaining.
   */
  function appendUint8(buffer memory buf, uint8 data) internal pure returns (buffer memory) {
    uint off = buf.buf.length;
    uint offPlusOne = off + 1;
    if (off >= buf.capacity) {
      resize(buf, offPlusOne * 2);
    }

    assembly {
      // Memory address of the buffer data
      let bufptr := mload(buf)
      // Address = buffer address + sizeof(buffer length) + off
      let dest := add(add(bufptr, off), 32)
      mstore8(dest, data)
      // Update buffer length if we extended it
      if gt(offPlusOne, mload(bufptr)) {
        mstore(bufptr, offPlusOne)
      }
    }

    return buf;
  }

  /**
   * @dev Appends len bytes of bytes32 to a buffer. Resizes if doing so would
   *      exceed the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @param len The number of bytes to write (left-aligned).
   * @return The original buffer, for chaining.
   */
  function append(buffer memory buf, bytes32 data, uint len) private pure returns (buffer memory) {
    uint off = buf.buf.length;
    uint newCapacity = len + off;
    if (newCapacity > buf.capacity) {
      resize(buf, newCapacity * 2);
    }

    unchecked {
      uint mask = (256 ** len) - 1;
      // Right-align data
      data = data >> (8 * (32 - len));
      assembly {
        // Memory address of the buffer data
        let bufptr := mload(buf)
        // Address = buffer address + sizeof(buffer length) + newCapacity
        let dest := add(bufptr, newCapacity)
        mstore(dest, or(and(mload(dest), not(mask)), data))
        // Update buffer length if we extended it
        if gt(newCapacity, mload(bufptr)) {
          mstore(bufptr, newCapacity)
        }
      }
    }
    return buf;
  }

  /**
   * @dev Appends a bytes20 to the buffer. Resizes if doing so would exceed
   *      the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @return The original buffer, for chhaining.
   */
  function appendBytes20(buffer memory buf, bytes20 data) internal pure returns (buffer memory) {
    return append(buf, bytes32(data), 20);
  }

  /**
   * @dev Appends a bytes32 to the buffer. Resizes if doing so would exceed
   *      the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @return The original buffer, for chaining.
   */
  function appendBytes32(buffer memory buf, bytes32 data) internal pure returns (buffer memory) {
    return append(buf, data, 32);
  }

  /**
   * @dev Appends a byte to the end of the buffer. Resizes if doing so would
   *      exceed the capacity of the buffer.
   * @param buf The buffer to append to.
   * @param data The data to append.
   * @param len The number of bytes to write (right-aligned).
   * @return The original buffer.
   */
  function appendInt(buffer memory buf, uint data, uint len) internal pure returns (buffer memory) {
    uint off = buf.buf.length;
    uint newCapacity = len + off;
    if (newCapacity > buf.capacity) {
      resize(buf, newCapacity * 2);
    }

    uint mask = (256 ** len) - 1;
    assembly {
      // Memory address of the buffer data
      let bufptr := mload(buf)
      // Address = buffer address + sizeof(buffer length) + newCapacity
      let dest := add(bufptr, newCapacity)
      mstore(dest, or(and(mload(dest), not(mask)), data))
      // Update buffer length if we extended it
      if gt(newCapacity, mload(bufptr)) {
        mstore(bufptr, newCapacity)
      }
    }
    return buf;
  }
}

/*******************************************************************************
 *   (c) 2023 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @notice This library implement the leb128
/// @author Zondax AG
library Leb128 {
  using Buffer for Buffer.buffer;

  /// @notice encode a unsigned integer 64bits into bytes
  /// @param value the actor ID to encode
  /// @return result return the value in bytes
  function encodeUnsignedLeb128FromUInt64(uint64 value) internal pure returns (Buffer.buffer memory result) {
    while (true) {
      uint64 byte_ = value & 0x7f;
      value >>= 7;
      if (value == 0) {
        result.appendUint8(uint8(byte_));
        return result;
      }
      result.appendUint8(uint8(byte_ | 0x80));
    }
  }
}

/*******************************************************************************
 *   (c) 2022 Zondax AG
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
//
// THIS CODE WAS SECURITY REVIEWED BY KUDELSKI SECURITY, BUT NOT FORMALLY AUDITED
/// @title Filecoin actors' common types for Solidity.
/// @author Zondax AG
library CommonTypes {
  uint constant UniversalReceiverHookMethodNum = 3726118371;

  /// @param idx index for the failure in batch
  /// @param code failure code
  struct FailCode {
    uint32 idx;
    uint32 code;
  }

  /// @param success_count total successes in batch
  /// @param fail_codes list of failures code and index for each failure in batch
  struct BatchReturn {
    uint32 success_count;
    FailCode[] fail_codes;
  }

  /// @param type_ asset type
  /// @param payload payload corresponding to asset type
  struct UniversalReceiverParams {
    uint32 type_;
    bytes payload;
  }

  /// @param val contains the actual arbitrary number written as binary
  /// @param neg indicates if val is negative or not
  struct BigInt {
    bytes val;
    bool neg;
  }

  /// @param data filecoin address in bytes format
  struct FilAddress {
    bytes data;
  }

  /// @param data cid in bytes format
  struct Cid {
    bytes data;
  }

  /// @param data deal proposal label in bytes format (it can be utf8 string or arbitrary bytes string).
  /// @param isString indicates if the data is string or raw bytes
  struct DealLabel {
    bytes data;
    bool isString;
  }

  type FilActorId is uint64;

  type ChainEpoch is int64;
}

// OpenZeppelin Contracts (last updated v4.9.0) (utils/math/SafeMath.sol)

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
  /**
   * @dev Returns the addition of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
    unchecked {
      uint256 c = a + b;
      if (c < a) return (false, 0);
      return (true, c);
    }
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
    unchecked {
      if (b > a) return (false, 0);
      return (true, a - b);
    }
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
   *
   * _Available since v3.4._
   */
  function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
    unchecked {
      // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
      // benefit is lost if 'b' is also tested.
      // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
      if (a == 0) return (true, 0);
      uint256 c = a * b;
      if (c / a != b) return (false, 0);
      return (true, c);
    }
  }

  /**
   * @dev Returns the division of two unsigned integers, with a division by zero flag.
   *
   * _Available since v3.4._
   */
  function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
    unchecked {
      if (b == 0) return (false, 0);
      return (true, a / b);
    }
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
   *
   * _Available since v3.4._
   */
  function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
    unchecked {
      if (b == 0) return (false, 0);
      return (true, a % b);
    }
  }

  /**
   * @dev Returns the addition of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `+` operator.
   *
   * Requirements:
   *
   * - Addition cannot overflow.
   */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    return a + b;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting on
   * overflow (when the result is negative).
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    return a - b;
  }

  /**
   * @dev Returns the multiplication of two unsigned integers, reverting on
   * overflow.
   *
   * Counterpart to Solidity's `*` operator.
   *
   * Requirements:
   *
   * - Multiplication cannot overflow.
   */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    return a * b;
  }

  /**
   * @dev Returns the integer division of two unsigned integers, reverting on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator.
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return a / b;
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * reverting when dividing by zero.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    return a % b;
  }

  /**
   * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
   * overflow (when the result is negative).
   *
   * CAUTION: This function is deprecated because it requires allocating memory for the error
   * message unnecessarily. For custom revert reasons use {trySub}.
   *
   * Counterpart to Solidity's `-` operator.
   *
   * Requirements:
   *
   * - Subtraction cannot overflow.
   */
  function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
    unchecked {
      require(b <= a, errorMessage);
      return a - b;
    }
  }

  /**
   * @dev Returns the integer division of two unsigned integers, reverting with custom message on
   * division by zero. The result is rounded towards zero.
   *
   * Counterpart to Solidity's `/` operator. Note: this function uses a
   * `revert` opcode (which leaves remaining gas untouched) while Solidity
   * uses an invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
    unchecked {
      require(b > 0, errorMessage);
      return a / b;
    }
  }

  /**
   * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
   * reverting with custom message when dividing by zero.
   *
   * CAUTION: This function is deprecated because it requires allocating memory for the error
   * message unnecessarily. For custom revert reasons use {tryMod}.
   *
   * Counterpart to Solidity's `%` operator. This function uses a `revert`
   * opcode (which leaves remaining gas untouched) while Solidity uses an
   * invalid opcode to revert (consuming all remaining gas).
   *
   * Requirements:
   *
   * - The divisor cannot be zero.
   */
  function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
    unchecked {
      require(b > 0, errorMessage);
      return a % b;
    }
  }
}

contract MultiForwarder {
  using SendAPI for CommonTypes.FilAddress;
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

    for (uint8 i; i < addresses.length; i++) {
      bytes32 addr = addresses[i];
      uint8 size;

      if (addr[0] == 0x01 || addr[0] == 0x02) {
        size = 21;
      } else if (addr[0] == 0x04) {
        size = 22;
      } else {
        revert('address must be Secp256k1, Actor or Delegated');
      }

      bytes memory to = new bytes(size);
      for (uint8 j = 0; j < size; j++) {
        to[j] = addr[j];
      }
      CommonTypes.FilAddress memory target = FilAddresses.fromBytes(to);
      target.send(amounts[i]);
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

    for (uint8 i; i < addresses.length; i++) {
      CommonTypes.FilAddress memory target = FilAddresses.fromBytes(addresses[i]);
      target.send(amounts[i]);
    }

    emit ForwardAny(id, msg.sender, addresses, amounts, totalAmount);
  }
}
