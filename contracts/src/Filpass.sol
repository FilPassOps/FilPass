// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title FilecoinDepositWithdrawRefund
 * @dev This contract facilitates secure deposit, withdrawal, and refund of FIL between a user and multiple oracles.
 */
contract FilecoinDepositWithdrawRefund is ReentrancyGuard {
  /// @notice Address of the user who deploys the contract and has authority over deposits and refunds.
  address public user;

  /// @notice Maximum number of Oracles allowed.
  uint256 public constant MAX_ORACLES = 10;

  /// @notice Maximum number of Recipients per Oracle allowed.
  uint256 public constant MAX_RECIPIENTS_PER_ORACLE = 10;

  /// @notice Maximum lock-up period in days.
  uint256 public constant MAX_LOCKUP_DAYS = 365;

  /// @notice Struct to store deposit information for each Oracle-Recipient pair.
  struct DepositInfo {
    uint256 amount; // Total FIL amount deposited.
    uint256 refundTime; // UNIX timestamp after which the user can request a refund.
  }

  /**
   * @dev Nested mapping to track deposits.
   * Address of the Oracle.
   */
  mapping(address => mapping(address => DepositInfo)) public deposits;

  address[] public oracles;

  /// @notice Mapping to keep track of Recipients for each Oracle.
  mapping(address => address[]) public recipientsPerOracle;

  /// @notice Mapping to check if an Oracle exists.
  mapping(address => bool) private oracleExists;

  /// @notice Mapping to check if a Recipient exists under an Oracle.
  mapping(address => mapping(address => bool)) private recipientExists;

  /// @notice Mappings to keep track of indices for efficient removal.
  mapping(address => uint256) private oracleIndex;
  mapping(address => mapping(address => uint256)) private recipientIndex;

  /// @notice Event emitted when a deposit is made.
  event DepositMade(address indexed oracle, address indexed recipient, uint256 amount, uint256 refundTime);

  /// @notice Event emitted when a withdrawal is made by an Oracle.
  event WithdrawalMade(address indexed oracle, address indexed recipient, uint256 amount);

  /// @notice Event emitted when a refund is made by the user.
  event RefundMade(address indexed oracle, address indexed recipient, uint256 amount);

  /// @notice Event emitted when an Oracle is removed.
  event OracleRemoved(address indexed oracle);

  /// @notice Event emitted when a Recipient is removed under an Oracle.
  event RecipientRemoved(address indexed oracle, address indexed recipient);

  /**
   * @dev Modifier to restrict function access exclusively to the designated user.
   * Reverts if the caller is not the user.
   */
  modifier onlyUser() {
    require(msg.sender == user, 'Only user can call this function');
    _;
  }

  /**
   * @dev Constructor that sets the deployer as the user.
   * This establishes the authority for deposit and refund operations.
   */
  constructor() {
    user = msg.sender;
  }

  /**
   * @dev Allows the user to deposit FIL specifying an Oracle and a Recipient.

   * @param oracleAddress The address of the Oracle authorized to withdraw funds.
   * @param recipient The address of the Recipient designated to receive withdrawals.
   * @param lockUpTime The lock-up period in days (e.g., 1 for 1 day, up to `MAX_LOCKUP_DAYS`).
   */
  function depositAmount(address oracleAddress, address recipient, uint256 lockUpTime) external payable onlyUser nonReentrant {
    // Validate that the Oracle address is not the zero address.
    require(oracleAddress != address(0), 'Invalid oracle address');

    // Validate that the Recipient address is not the zero address.
    require(recipient != address(0), 'Invalid recipient address');

    // Ensure that the lock-up time is a positive integer and does not exceed the maximum allowed.
    require(lockUpTime > 0 && lockUpTime <= MAX_LOCKUP_DAYS, 'Invalid lock-up time');

    // Ensure that the deposit amount is greater than zero.
    require(msg.value > 0, 'Deposit amount must be greater than zero');

    // Check if adding a new Oracle exceeds the maximum limit.
    if (!oracleExists[oracleAddress]) {
      require(oracles.length < MAX_ORACLES, 'Maximum number of Oracles reached');
    }

    // Check if adding a new Recipient under the Oracle exceeds the maximum limit.
    if (!recipientExists[oracleAddress][recipient]) {
      require(recipientsPerOracle[oracleAddress].length < MAX_RECIPIENTS_PER_ORACLE, 'Maximum Recipients per Oracle reached');
    }

    // Retrieve the current deposit information for the Oracle-Recipient pair.
    DepositInfo storage info = deposits[oracleAddress][recipient];

    // Determine if this is the first deposit for the Oracle-Recipient pair.
    bool isFirstDeposit = (info.refundTime == 0);

    // Update the total deposited amount.
    info.amount += msg.value;

    // Calculate the proposed refund time based on the lock-up period.
    uint256 proposedRefundTime = block.timestamp + (lockUpTime * 1 days);

    // If it's the first deposit, extend the refund time by an additional day.
    if (isFirstDeposit) {
      proposedRefundTime += 1 days;
    }

    // Update the refund time to the later of the existing refund time or the new proposed refund time.
    if (info.refundTime < proposedRefundTime) {
      info.refundTime = proposedRefundTime;
    }

    // If this is the first deposit for the Oracle, add to the oracles array.
    if (!oracleExists[oracleAddress]) {
      oracleExists[oracleAddress] = true;
      oracleIndex[oracleAddress] = oracles.length;
      oracles.push(oracleAddress);
    }

    // If this is the first deposit for the Recipient under the Oracle, add to the recipientsPerOracle mapping.
    if (!recipientExists[oracleAddress][recipient]) {
      recipientExists[oracleAddress][recipient] = true;
      recipientIndex[oracleAddress][recipient] = recipientsPerOracle[oracleAddress].length;
      recipientsPerOracle[oracleAddress].push(recipient);
    }

    // Emit the DepositMade event to log the deposit details.
    emit DepositMade(oracleAddress, recipient, msg.value, info.refundTime);
  }

  /**
   * @dev Allows the designated Oracle to withdraw funds for a specific Recipient before the refund time.
   * @param recipient The address of the Recipient to receive the withdrawn funds.
   * @param requestedWithdrawAmount The amount of FIL to withdraw.
   */
  function withdrawAmount(address recipient, uint256 requestedWithdrawAmount) external nonReentrant {
    // Validate that the Recipient address is not the zero address.
    require(recipient != address(0), 'Invalid recipient address');

    // Retrieve the deposit information for the calling Oracle and specified Recipient.
    DepositInfo storage info = deposits[msg.sender][recipient];

    // Ensure that the Oracle has sufficient funds to withdraw the specified amount.
    require(info.amount >= requestedWithdrawAmount, 'Insufficient funds');

    // Ensure that the current time is before the refund time.
    require(block.timestamp < info.refundTime, 'Cannot withdraw after refund time');

    // Update the deposited amount before transferring funds to prevent reentrancy attacks.
    info.amount -= requestedWithdrawAmount;

    // Transfer the specified amount of FIL to the Recipient using a low-level call.
    (bool success, ) = payable(recipient).call{value: requestedWithdrawAmount}('');
    require(success, 'Withdrawal transfer failed');

    // Emit the WithdrawalMade event to log the withdrawal details.
    emit WithdrawalMade(msg.sender, recipient, requestedWithdrawAmount);

    // If the deposited amount is zero after withdrawal, remove the Recipient and possibly the Oracle.
    if (info.amount == 0) {
      _removeRecipient(msg.sender, recipient);
      if (recipientsPerOracle[msg.sender].length == 0) {
        _removeOracle(msg.sender);
      }
    }
  }

  /**
   * @dev Allows the user to refund funds based on the provided parameters.
   * @param oracleAddress The address of the Oracle associated with the funds. Set to `address(0)` to indicate all Oracles.
   * @param recipient The address of the Recipient associated with the funds. Set to `address(0)` to indicate all Recipients under the specified Oracle or all Recipients across all Oracles.
   */
  function refundAmount(address oracleAddress, address recipient) external onlyUser nonReentrant {
    /**
     * Three scenarios based on the input parameters:
     * 1. Both `oracleAddress` and `recipient` are provided (non-zero addresses): Refund for the specific pair.
     * 2. `oracleAddress` is provided and `recipient` is the zero address: Refund all available funds for that Oracle across all Recipients.
     * 3. Both `oracleAddress` and `recipient` are zero addresses: Refund all available funds across all Oracles and Recipients.
     *    - Any additional FIL balance in the contract is also transferred back to the user.
     */
    // Scenario 1: Specific Oracle-Recipient Pair
    if (oracleAddress != address(0) && recipient != address(0)) {
      _refundSpecificPair(oracleAddress, recipient);
    }
    // Scenario 2: All Recipients for a Specific Oracle
    else if (oracleAddress != address(0) && recipient == address(0)) {
      _refundAllRecipientsForOracle(oracleAddress);
    }
    // Scenario 3: All Oracles and All Recipients
    else if (oracleAddress == address(0) && recipient == address(0)) {
      _refundAllOraclesAndRecipients();
      // Transfer any remaining balance in the contract to the user.
      uint256 remainingBalance = address(this).balance;
      if (remainingBalance > 0) {
        (bool success, ) = payable(user).call{value: remainingBalance}('');
        require(success, 'Transfer of remaining balance failed');
      }
    }
    // Invalid Input: One parameter is zero while the other is not
    else {
      revert('Invalid parameters. Provide either both addresses or set both to zero.');
    }
  }

  /**
   * @dev Internal function to refund a specific Oracle-Recipient pair.
   * @param oracleAddress The address of the Oracle.
   * @param recipient The address of the Recipient.
   */
  function _refundSpecificPair(address oracleAddress, address recipient) internal {
    // Retrieve the deposit information for the specified Oracle-Recipient pair.
    DepositInfo storage info = deposits[oracleAddress][recipient];

    // Ensure that there are funds available to refund.
    require(info.amount > 0, 'No funds to refund for this pair');

    // Ensure that the refund time has passed.
    require(block.timestamp >= info.refundTime, 'Refund time has not passed for this pair');

    // Store the refund amount and reset the deposited amount to zero.
    uint256 refundAmountValue = info.amount;
    info.amount = 0;
    info.refundTime = 0; // Reset refund time

    // Remove the Recipient and possibly the Oracle.
    _removeRecipient(oracleAddress, recipient);
    if (recipientsPerOracle[oracleAddress].length == 0) {
      _removeOracle(oracleAddress);
    }

    // Transfer the refund amount back to the user using a low-level call.
    (bool success, ) = payable(user).call{value: refundAmountValue}('');
    require(success, 'Refund transfer failed for this pair');

    // Emit the RefundMade event to log the refund details.
    emit RefundMade(oracleAddress, recipient, refundAmountValue);
  }

  /**
   * @dev Internal function to refund all available funds for all Recipients under a specific Oracle.
   * @param oracleAddress The address of the Oracle.
   */
  function _refundAllRecipientsForOracle(address oracleAddress) internal {
    // Retrieve the list of Recipients for the specified Oracle.
    address[] storage recipients = recipientsPerOracle[oracleAddress];

    // Ensure that the Oracle has any Recipients.
    require(recipients.length > 0, 'No Recipients found for this Oracle');

    bool hasRefunds = false;

    // Iterate through all Recipients in reverse order and process refunds where applicable.
    for (uint256 i = recipients.length; i > 0; i--) {
      uint256 index = i - 1;
      address currentRecipient = recipients[index];
      DepositInfo storage info = deposits[oracleAddress][currentRecipient];

      // Check if funds are available and refund time has passed.
      if (info.amount > 0 && block.timestamp >= info.refundTime) {
        uint256 refundAmountValue = info.amount;
        info.amount = 0;
        info.refundTime = 0; // Reset refund time
        hasRefunds = true;

        // Remove the Recipient
        _removeRecipient(oracleAddress, currentRecipient);

        // Transfer the refund amount back to the user.
        (bool success, ) = payable(user).call{value: refundAmountValue}('');
        require(success, 'Refund transfer failed for a Recipient');

        // Emit the RefundMade event for each refund.
        emit RefundMade(oracleAddress, currentRecipient, refundAmountValue);
      }
    }

    // After processing all Recipients, remove the Oracle if no Recipients are left.
    if (recipientsPerOracle[oracleAddress].length == 0) {
      _removeOracle(oracleAddress);
    }

    require(hasRefunds, 'No eligible funds to refund for this Oracle');
  }

  function _refundAllOraclesAndRecipients() internal {
    bool hasRefunds = false;

    // Iterate through all Oracles in reverse order.
    for (uint256 o = oracles.length; o > 0; o--) {
      uint256 oracleIdx = o - 1;
      address currentOracle = oracles[oracleIdx];
      address[] storage recipients = recipientsPerOracle[currentOracle];

      // Iterate through all Recipients for the current Oracle in reverse order.
      for (uint256 r = recipients.length; r > 0; r--) {
        uint256 recipientIdx = r - 1;
        address currentRecipient = recipients[recipientIdx];
        DepositInfo storage info = deposits[currentOracle][currentRecipient];

        // Check if funds are available and refund time has passed.
        if (info.amount > 0 && block.timestamp >= info.refundTime) {
          uint256 refundAmountValue = info.amount;
          info.amount = 0;
          info.refundTime = 0; // Reset refund time
          hasRefunds = true;

          // Remove the Recipient
          _removeRecipient(currentOracle, currentRecipient);

          // Transfer the refund amount back to the user.
          (bool success, ) = payable(user).call{value: refundAmountValue}('');
          require(success, 'Refund transfer failed for a Recipient');

          // Emit the RefundMade event for each refund.
          emit RefundMade(currentOracle, currentRecipient, refundAmountValue);
        }
      }

      // After processing all Recipients, remove the Oracle if no Recipients are left.
      if (recipientsPerOracle[currentOracle].length == 0) {
        _removeOracle(currentOracle);
      }
    }

    require(hasRefunds, 'No eligible funds to refund across all Oracles and Recipients');
  }

  function _removeRecipient(address oracleAddress, address recipient) internal {
    uint256 index = recipientIndex[oracleAddress][recipient];
    uint256 lastIndex = recipientsPerOracle[oracleAddress].length - 1;

    if (index != lastIndex) {
      address lastRecipient = recipientsPerOracle[oracleAddress][lastIndex];
      recipientsPerOracle[oracleAddress][index] = lastRecipient;
      recipientIndex[oracleAddress][lastRecipient] = index;
    }

    recipientsPerOracle[oracleAddress].pop();
    delete recipientIndex[oracleAddress][recipient];
    delete recipientExists[oracleAddress][recipient];

    // Emit event for Recipient removal
    emit RecipientRemoved(oracleAddress, recipient);
  }

  function _removeOracle(address oracleAddress) internal {
    uint256 index = oracleIndex[oracleAddress];
    uint256 lastIndex = oracles.length - 1;

    if (index != lastIndex) {
      address lastOracle = oracles[lastIndex];
      oracles[index] = lastOracle;
      oracleIndex[lastOracle] = index;
    }

    oracles.pop();
    delete oracleIndex[oracleAddress];
    delete oracleExists[oracleAddress];

    // Emit event for Oracle removal
    emit OracleRemoved(oracleAddress);
  }

  /**
   * @dev Allows the user to recover any stranded FIL in the contract.
   */
  function emergencyWithdraw() external onlyUser nonReentrant {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No funds to withdraw');
    (bool success, ) = payable(user).call{value: balance}('');
    require(success, 'Emergency withdrawal failed');
  }

  /**
   * @dev Fallback function to prevent direct FIL transfers to the contract.
   */
  receive() external payable {
    revert('Direct deposits not allowed. Use depositAmount.');
  }

  /**
   * @dev Fallback function to handle calls to non-existent functions.
   *      Reverts any such calls with a descriptive error message.
   */
  fallback() external payable {
    revert('Function does not exist.');
  }
}
