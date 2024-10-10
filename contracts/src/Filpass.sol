// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

/**
 * @title FilecoinDepositWithdrawRefund
 * @dev This contract facilitates secure deposit, withdrawal, and refund of FIL between a user and multiple oracles.
 */
contract FilecoinDepositWithdrawRefund is ReentrancyGuard {
  using EnumerableSet for EnumerableSet.AddressSet;

  mapping(address => mapping(address => DepositInfo)) public deposits;
  EnumerableSet.AddressSet private oracles;
  mapping(address => EnumerableSet.AddressSet) private recipientsPerOracle;

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

  event DepositMade(address indexed oracle, address indexed recipient, uint256 amount, uint256 refundTime);
  event WithdrawalMade(address indexed oracle, address indexed recipient, uint256 amount);
  event RefundMade(address indexed oracle, address indexed recipient, uint256 amount);
  event OracleRemoved(address indexed oracle);
  event RecipientRemoved(address indexed oracle, address indexed recipient);

  error InvalidOracleAddress();
  error InvalidRecipientAddress();
  error InvalidLockupTime();
  error InsufficientDepositAmount();
  error InvalidParameters();
  error MaxOraclesReached();
  error MaxRecipientsReached();
  error InsufficientFunds();
  error RefundTimeNotPassed();
  error RefundTransferFailed();
  error RefundRemainingBalanceFailed();
  error NoFundsToRefund();
  error NoRecipientsForOracle();
  error NoEligibleFundsToRefund();
  error EmergencyWithdrawalFailed();
  error DirectDepositsNotAllowed();
  error FunctionDoesNotExist();
  error WithdrawFailed();
  error OnlyUserAllowed();
  /**
   * @dev Modifier to restrict function access exclusively to the designated user.
   * Reverts if the caller is not the user.
   */
  modifier onlyUser() {
    if (msg.sender != user) revert OnlyUserAllowed();
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
    if (oracleAddress == address(0)) revert InvalidOracleAddress();
    if (recipient == address(0)) revert InvalidRecipientAddress();
    if (lockUpTime <= 0 || lockUpTime > MAX_LOCKUP_DAYS) revert InvalidLockupTime();
    if (msg.value <= 0) revert InsufficientDepositAmount();

    if (!oracles.contains(oracleAddress)) {
      if (oracles.length() >= MAX_ORACLES) revert MaxOraclesReached();
      oracles.add(oracleAddress);
    }

    if (!recipientsPerOracle[oracleAddress].contains(recipient)) {
      if (recipientsPerOracle[oracleAddress].length() >= MAX_RECIPIENTS_PER_ORACLE) revert MaxRecipientsReached();
      recipientsPerOracle[oracleAddress].add(recipient);
    }

    DepositInfo storage info = deposits[oracleAddress][recipient];
    bool isFirstDeposit = (info.refundTime == 0);
    info.amount += msg.value;

    uint256 proposedRefundTime = block.timestamp + (lockUpTime * 1 days);

    if (isFirstDeposit) {
      proposedRefundTime += 1 days;
    }

    // Update the refund time to the later of the existing refund time or the new proposed refund time.
    if (info.refundTime < proposedRefundTime) {
      info.refundTime = proposedRefundTime;
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
    if (recipient == address(0)) revert InvalidRecipientAddress();

    DepositInfo storage info = deposits[msg.sender][recipient];
    if (info.amount < requestedWithdrawAmount) revert InsufficientFunds();
    if (block.timestamp >= info.refundTime) revert RefundTimeNotPassed();

    // Update the deposited amount before transferring funds to prevent reentrancy attacks.
    info.amount -= requestedWithdrawAmount;

    // Transfer the specified amount of FIL to the Recipient using a low-level call.
    (bool success, ) = payable(recipient).call{value: requestedWithdrawAmount}('');
    if (!success) revert WithdrawFailed();

    emit WithdrawalMade(msg.sender, recipient, requestedWithdrawAmount);

    if (info.amount == 0) {
      _removeRecipient(msg.sender, recipient);
      if (recipientsPerOracle[msg.sender].length() == 0) {
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
    if (oracleAddress != address(0) && recipient != address(0)) {
      _refundSpecificPair(oracleAddress, recipient);
    } else if (oracleAddress != address(0) && recipient == address(0)) {
      _refundAllRecipientsForOracle(oracleAddress);
    } else if (oracleAddress == address(0) && recipient == address(0)) {
      _refundAllOraclesAndRecipients();
      // Transfer any remaining balance in the contract to the user.
      uint256 remainingBalance = address(this).balance;
      if (remainingBalance > 0) {
        (bool success, ) = payable(user).call{value: remainingBalance}('');
        if (!success) revert RefundRemainingBalanceFailed();
      }
    } else {
      revert InvalidParameters();
    }
  }

  /**
   * @dev Internal function to refund a specific Oracle-Recipient pair.
   * @param oracleAddress The address of the Oracle.
   * @param recipient The address of the Recipient.
   */
  function _refundSpecificPair(address oracleAddress, address recipient) internal {
    DepositInfo storage info = deposits[oracleAddress][recipient];
    if (info.amount == 0) revert NoFundsToRefund();
    if (block.timestamp < info.refundTime) revert RefundTimeNotPassed();

    uint256 refundAmountValue = info.amount;
    info.amount = 0;
    info.refundTime = 0; // Reset refund time

    _removeRecipient(oracleAddress, recipient);
    if (recipientsPerOracle[oracleAddress].length() == 0) {
      _removeOracle(oracleAddress);
    }

    // Transfer the refund amount back to the user using a low-level call.
    (bool success, ) = payable(user).call{value: refundAmountValue}('');
    if (!success) revert RefundTransferFailed();

    emit RefundMade(oracleAddress, recipient, refundAmountValue);
  }

  /**
   * @dev Internal function to refund all available funds for all Recipients under a specific Oracle.
   * @param oracleAddress The address of the Oracle.
   */
  function _refundAllRecipientsForOracle(address oracleAddress) internal {
    EnumerableSet.AddressSet storage recipients = recipientsPerOracle[oracleAddress];
    if (recipients.length() == 0) revert NoRecipientsForOracle();

    bool hasRefunds = false;
    // Iterate through all Recipients in reverse order and process refunds where applicable.
    for (uint256 i = recipients.length(); i > 0; i--) {
      address currentRecipient = recipients.at(i - 1);
      DepositInfo storage info = deposits[oracleAddress][currentRecipient];

      // Check if funds are available and refund time has passed.
      if (info.amount > 0 && block.timestamp >= info.refundTime) {
        uint256 refundAmountValue = info.amount;
        info.amount = 0;
        info.refundTime = 0; // Reset refund time
        hasRefunds = true;

        _removeRecipient(oracleAddress, currentRecipient);

        // Transfer the refund amount back to the user.
        (bool success, ) = payable(user).call{value: refundAmountValue}('');
        if (!success) revert RefundTransferFailed();

        emit RefundMade(oracleAddress, currentRecipient, refundAmountValue);
      }
    }

    // After processing all Recipients, remove the Oracle if no Recipients are left.
    if (recipientsPerOracle[oracleAddress].length() == 0) {
      _removeOracle(oracleAddress);
    }

    if (!hasRefunds) revert NoEligibleFundsToRefund();
  }

  function _refundAllOraclesAndRecipients() internal {
    bool hasRefunds = false;

    // Iterate through all Oracles in reverse order.
    for (uint256 o = oracles.length(); o > 0; o--) {
      address currentOracle = oracles.at(o - 1);
      EnumerableSet.AddressSet storage recipients = recipientsPerOracle[currentOracle];

      // Iterate through all Recipients for the current Oracle in reverse order.
      for (uint256 r = recipients.length(); r > 0; r--) {
        address currentRecipient = recipients.at(r - 1);
        DepositInfo storage info = deposits[currentOracle][currentRecipient];

        // Check if funds are available and refund time has passed.
        if (info.amount > 0 && block.timestamp >= info.refundTime) {
          uint256 refundAmountValue = info.amount;
          info.amount = 0;
          info.refundTime = 0; // Reset refund time
          hasRefunds = true;

          _removeRecipient(currentOracle, currentRecipient);

          // Transfer the refund amount back to the user.
          (bool success, ) = payable(user).call{value: refundAmountValue}('');
          if (!success) revert RefundTransferFailed();

          emit RefundMade(currentOracle, currentRecipient, refundAmountValue);
        }
      }

      // After processing all Recipients, remove the Oracle if no Recipients are left.
      if (recipientsPerOracle[currentOracle].length() == 0) {
        _removeOracle(currentOracle);
      }
    }

    if (!hasRefunds) revert NoEligibleFundsToRefund();
  }

  function _removeRecipient(address oracleAddress, address recipient) internal {
    recipientsPerOracle[oracleAddress].remove(recipient);
    emit RecipientRemoved(oracleAddress, recipient);
  }

  function _removeOracle(address oracleAddress) internal {
    oracles.remove(oracleAddress);
    emit OracleRemoved(oracleAddress);
  }

  /**
   * @dev Allows the user to recover any stranded FIL in the contract.
   */
  function emergencyWithdraw() external onlyUser nonReentrant {
    uint256 balance = address(this).balance;
    if (balance == 0) revert NoFundsToRefund();
    (bool success, ) = payable(user).call{value: balance}('');
    if (!success) revert EmergencyWithdrawalFailed();
  }

  /**
   * @dev Fallback function to prevent direct FIL transfers to the contract.
   */
  receive() external payable {
    revert DirectDepositsNotAllowed();
  }

  /**
   * @dev Fallback function to handle calls to non-existent functions.
   *      Reverts any such calls with a descriptive error message.
   */
  fallback() external payable {
    revert FunctionDoesNotExist();
  }
}
