// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

/**
 * @title FilPass
 * @dev This contract facilitates secure deposit, ticket submission, and refund of FIL between a user and multiple oracles.
 */
contract FilPass is ReentrancyGuard {
  using EnumerableSet for EnumerableSet.AddressSet;

  struct DecodedToken {
    string iss;
    string jti;
    uint256 exp;
    uint256 iat;
    string ticket_type;
    string ticket_version;
    address funder;
    address sub;
    address aud;
    uint256 ticket_lane;
    uint256 lane_total_amount;
    uint256 lane_guaranteed_amount;
    uint256 lane_guaranteed_until;
  }

  mapping(address => mapping(address => DepositInfo)) public deposits;
  EnumerableSet.AddressSet private oracles;
  mapping(address => EnumerableSet.AddressSet) private recipientsPerOracle;
  mapping(address => mapping(string => bool)) public usedJtis;

  /// @notice Address of the user who deploys the contract and has authority over deposits and refunds.
  address public user;

  /// @notice Maximum number of Oracles allowed.
  uint256 public constant MAX_ORACLES = 10;

  /// @notice Maximum number of Recipients per Oracle allowed.
  uint256 public constant MAX_RECIPIENTS_PER_ORACLE = 10;

  /// @notice Maximum lock-up period in days.
  uint256 public constant MAX_LOCKUP_DAYS = 365;

  // Fee in basis points (e.g., 200 = 2%)
  uint256 public feeBps = 200;
  uint256 public constant MIN_FEE_BPS = 50; // 0.5%
  uint256 public constant MAX_FEE_BPS = 1000; // Max 10%
  uint256 public constant BPS_DIVISOR = 10000;

  /// @notice Struct to store deposit information for each Oracle-Recipient pair.
  struct DepositInfo {
    uint256 amount; // Total FIL amount deposited.
    uint256 refundTime; // UNIX timestamp after which the user can request a refund.
    uint256 exchangedSoFar; // Total FIL amount exchanged so far.
  }

  event DepositMade(address indexed oracle, address indexed recipient, uint256 amount, uint256 refundTime);
  event TicketSubmitted(address indexed oracle, address indexed recipient, uint256 amount);
  event RefundMade(address indexed oracle, address indexed recipient, uint256 amount);

  error InvalidOracleAddress();
  error InvalidRecipientAddress();
  error InvalidLockupTime();
  error InvalidTicketAmount();
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
  error SubmitTicketFailed();
  error TicketSubmissionTimeExpired();
  error OnlyUserAllowed();
  error TokenAlreadyUsed();
  error InvalidFee();

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
   * @notice Allows the user to deposit FIL specifying an Oracle and a Recipient.
   * @param oracleAddress The address of the Oracle authorized to submit tickets.
   * @param recipient The address of the Recipient designated to receive tickets.
   * @param lockUpTime The lock-up period in days (e.g., 1 for 1 day, up to `MAX_LOCKUP_DAYS`).
   */
  function depositAmount(address oracleAddress, address recipient, uint256 lockUpTime) external payable onlyUser nonReentrant {
    if (oracleAddress == address(0)) revert InvalidOracleAddress();
    if (recipient == address(0)) revert InvalidRecipientAddress();
    if (lockUpTime == 0 || lockUpTime > MAX_LOCKUP_DAYS) revert InvalidLockupTime();
    if (msg.value == 0) revert InsufficientDepositAmount();

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
   * @notice Allows the designated Oracle to submit tickets for a specific Recipient before the refund time.
   * @param decodedToken The decoded token object containing submit ticket information.
   */
  function submitTicket(DecodedToken memory decodedToken) external nonReentrant {
    if (decodedToken.aud == address(0)) revert InvalidRecipientAddress();
    if (decodedToken.lane_guaranteed_amount == 0 || decodedToken.lane_total_amount == 0) revert InvalidTicketAmount();

    if (!oracles.contains(msg.sender)) revert InvalidOracleAddress();

    if (usedJtis[msg.sender][decodedToken.jti]) revert TokenAlreadyUsed();
    usedJtis[msg.sender][decodedToken.jti] = true;
    DepositInfo storage info = deposits[msg.sender][decodedToken.aud];

    if (info.amount == 0) revert InsufficientFunds();

    if (info.exchangedSoFar > decodedToken.lane_total_amount) revert InsufficientFunds();
    if (block.timestamp >= info.refundTime) revert TicketSubmissionTimeExpired();

    uint256 ticketAmount = decodedToken.lane_total_amount - info.exchangedSoFar;

    if (ticketAmount > info.amount) revert InsufficientFunds();

    // Calculate fee and net amount
    uint256 feeAmount = (ticketAmount * feeBps) / BPS_DIVISOR;
    uint256 netAmount = ticketAmount - feeAmount;

    // Update the deposited amount before transferring funds to prevent reentrancy attacks.
    info.amount -= ticketAmount;
    info.exchangedSoFar = decodedToken.lane_total_amount;

    // Transfer the specified amount of FIL to the Recipient using a low-level call.
    (bool success, ) = payable(decodedToken.aud).call{value: netAmount}('');
    if (!success) revert SubmitTicketFailed();

    // Transfer fee to user
    (bool successFee, ) = payable(msg.sender).call{value: feeAmount}('');
    if (!successFee) revert SubmitTicketFailed();

    emit TicketSubmitted(msg.sender, decodedToken.aud, ticketAmount);
  }

  /**
   * @notice Allows the user to refund funds based on the provided parameters.
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
   * @notice Internal function to refund a specific Oracle-Recipient pair.
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
    info.exchangedSoFar += refundAmountValue;

    // Transfer the refund amount back to the user using a low-level call.
    (bool success, ) = payable(user).call{value: refundAmountValue}('');
    if (!success) revert RefundTransferFailed();

    emit RefundMade(oracleAddress, recipient, refundAmountValue);
  }

  /**
   * @notice Internal function to refund all available funds for all Recipients under a specific Oracle.
   * @param oracleAddress The address of the Oracle.
   */
  function _refundAllRecipientsForOracle(address oracleAddress) internal {
    EnumerableSet.AddressSet storage recipients = recipientsPerOracle[oracleAddress];
    if (recipients.length() == 0) revert NoRecipientsForOracle();

    bool hasRefunds = false;
    // Iterate through all Recipients in reverse order and process refunds where applicable.
    uint256 len = recipients.length();
    for (uint256 i = len; i > 0; ) {
      unchecked {
        i--;
      }
      address currentRecipient = recipients.at(i - 1);
      DepositInfo storage info = deposits[oracleAddress][currentRecipient];

      // Check if funds are available and refund time has passed.
      if (info.amount > 0 && block.timestamp >= info.refundTime) {
        uint256 refundAmountValue = info.amount;
        info.amount = 0;
        info.refundTime = 0; // Reset refund time
        hasRefunds = true;
        info.exchangedSoFar += refundAmountValue;

        // Transfer the refund amount back to the user.
        (bool success, ) = payable(user).call{value: refundAmountValue}('');
        if (!success) revert RefundTransferFailed();

        emit RefundMade(oracleAddress, currentRecipient, refundAmountValue);
      }
    }

    if (!hasRefunds) revert NoEligibleFundsToRefund();
  }

  /**
   * @notice Internal function to refund all available funds for all Oracles and Recipients.
   */
  function _refundAllOraclesAndRecipients() internal {
    bool hasRefunds = false;

    // Iterate through all Oracles in reverse order.
    uint256 olen = oracles.length();
    for (uint256 o = olen; o > 0; ) {
      unchecked {
        o--;
      }

      address currentOracle = oracles.at(o - 1);
      EnumerableSet.AddressSet storage recipients = recipientsPerOracle[currentOracle];

      // Iterate through all Recipients for the current Oracle in reverse order.
      uint256 rlen = recipients.length();
      for (uint256 r = rlen; r > 0; ) {
        unchecked {
          r--;
        }

        address currentRecipient = recipients.at(r - 1);
        DepositInfo storage info = deposits[currentOracle][currentRecipient];

        // Check if funds are available and refund time has passed.
        if (info.amount > 0 && block.timestamp >= info.refundTime) {
          uint256 refundAmountValue = info.amount;
          info.amount = 0;
          info.refundTime = 0; // Reset refund time
          hasRefunds = true;
          info.exchangedSoFar += refundAmountValue;

          // Transfer the refund amount back to the user.
          (bool success, ) = payable(user).call{value: refundAmountValue}('');
          if (!success) revert RefundTransferFailed();

          emit RefundMade(currentOracle, currentRecipient, refundAmountValue);
        }
      }
    }

    if (!hasRefunds) revert NoEligibleFundsToRefund();
  }

  /**
   * @notice Allows the user to recover any stranded FIL in the contract.
   */
  function emergencyWithdraw() external onlyUser nonReentrant {
    uint256 balance = address(this).balance;
    if (balance == 0) revert NoFundsToRefund();
    (bool success, ) = payable(user).call{value: balance}('');
    if (!success) revert EmergencyWithdrawalFailed();
  }

  function setFeeBps(uint256 newFeeBps) external onlyUser {
    if (newFeeBps < MIN_FEE_BPS || newFeeBps > MAX_FEE_BPS) revert InvalidFee();
    feeBps = newFeeBps;
  }

  /**
   * @notice Fallback function to prevent direct FIL transfers to the contract.
   */
  receive() external payable {
    revert DirectDepositsNotAllowed();
  }

  /**
   * @notice Fallback function to handle calls to non-existent functions.
   */
  fallback() external payable {
    revert FunctionDoesNotExist();
  }
}
