import { SUPPORT_EMAIL, PLATFORM_NAME } from "system.config"

const errorsMessages = {
  required_field: { message: 'This field is required.' },
  number_type: { message: 'This field must be a number.' },
  checked_field: { message: 'This field must be checked.' },
  confirmation_password: { message: 'Confirmation does not match password.' },
  invalid_pl_email: { message: `${PLATFORM_NAME} users must sign up with Google.` },
  email_must_be_valid: { message: 'Email must be a valid email.' },
  password_min_length: { length: 8, message: 'This field must be at least 8 characters.' },
  positive_number: { message: 'This field must be positive.' },
  not_found: { message: 'Not found.' },
  email_in_use: { message: 'Email already being used.' },
  wallet_address_in_use: { message: 'Address already being used.' },
  wrong_credentials: { message: 'Wrong credentials.' },
  invalid_token: { message: 'Invalid token.' },
  something_went_wrong: { message: 'Something went wrong, please try again later.' },
  account_not_found_or_already_verified: { message: 'Account not found or is already verified.' },
  email_is_not_verified: { message: 'Email is not verified.' },
  daily_verification_limit: { message: 'Reached maximum number of daily verifications.' },
  wallet_address_already_verified: { message: 'Wallet address already verified.' },
  error_approving_transfer_request: { message: 'Error approving transfer request.' },
  error_rejecting_transfer_request: { message: 'Error rejecting transfer request.' },
  error_deleting_transfer_request: { message: 'Error deleting transfer request.' },
  error_voiding_transfer_request: { message: 'Error voiding transfer request.' },
  error_unblocking_transfer_request: { message: 'Error unblocking transfer request.' },
  error_blocking_transfer_request: { message: 'Error blocking transfer request.' },
  error_rejecting_blocked_transfer_request: { message: 'Error rejecting blocked transfer request.' },
  error_blocking_user: { message: 'Error blocking user.' },
  error_unblocking_user: { message: 'Error unblocking user.' },
  transfer_request_not_found: { message: 'Error transfer request not found.' },
  error_archiving_program: { message: 'Error archiving program.' },
  error_status_is_not_supported: { message: 'Status is not supported.' },
  wallet_not_found: { message: 'This wallet address does not exist' },
  wallet_incorrect: { message: 'This wallet address appears to be incorrect.' },
  error_creating_draft: { message: 'Error creating transfer request draft' },
  program_not_found: { message: 'Program not found' },
  user_already_invited: { message: 'This user has already been invited.' },
  default_wallet_not_found: { message: 'Default Wallet not found, please specify a wallet.' },
  f410_wallet_error: { message: 'f410 wallets are not supported yet' },
  file_has_active_transfer_request: {
    message: ids =>
      `This file is used by transfer requests ${ids
        .map(
          id =>
            `<a style="text-decoration: underline;color: rgba(3, 105, 161, 1);" href="${process.env.APP_URL}/transfer-requests/${id}" target="_blank">#${id}</a>`
        )
        .join(', ')}. Please change the file of those requests before deleting.`,
  },
  wallet_has_active_transfer_request: {
    message: ids =>
      `Wallet is used by transfer requests ${ids
        .map(
          id =>
            `<a style="text-decoration: underline;color: rgba(3, 105, 161, 1);" href="${process.env.APP_URL}/transfer-requests/${id}" target="_blank">#${id}</a>`
        )
        .join(', ')}. Please change the wallet addresses of those requests before deleting the wallet.`,
  },
  github_generic_error: {
    message: 'Something went wrong with your request. Please, try again later.',
  },
  user_without_default_wallet: { message: 'User without default wallet' },
  program_vesting_not_supported: { message: "Program doesn't support vesting." },
  different_start_epoch: { message: 'All selected transfer requests need to have the same Vesting Start Epoch.' },
  invalid_vesting_months_range: { message: 'Vesting month range has to be between 0 and 200.' },
  expired_token_link: { message: 'The link has expired, please try again.' },
  auth_code_not_found: { message: 'Verification code not found.' },
  auth_code_expired: { message: 'Verification code expired, please request a new one.' },
  invalid_wallet_program_ethereum: {
    message: `f4 / 0x addresses can't be used as receiving address if the delivery method is multisig`,
  },
  invalid_wallet_program_ethereum_address: {
    message: address => `f4 / 0x addresses (${address}) can't be used as receiving address if the delivery method is multisig`,
  },
  invalid_default_wallet_ethereum: { message: `f4 / 0x addresses can't be set as a default address` },
  wallet_verification_not_found: { message: 'Verification not found.' },
  wallet_verification_value_not_match: { message: 'Amount provided did not match amount sent.' },
  wallet_verification_not_found_on_chain: {
    message:
      ' We have not received your transaction. It may take up to 5 minutes for the transaction to go through. Try verifying again in a few minutes.',
  },
  currency_not_found: { message: 'Currency was not found.' },
  wallet_cant_be_empty: { message: 'Please, provide a wallet address.' },
  auth_code_cant_generate: { message: "A new code can't be generated now, please try again in 1 minute." },
  user_not_found: { message: 'User not found.' },
  applying_for_others_unchek: { message: `To create a transfer request for yourself, go to My Requests page.` },
  user_rejected_payment: { message: 'Payment rejected by the user', component: <p>Payment rejected by the user</p> },
  not_enough_funds: {
    message:
      'Sorry, you do not have enough funds in your account to complete the transaction. Please ensure you have sufficient balance and try again.',
    component: (
      <p>
        Sorry, you do not have enough funds in your account to complete the transaction. Please ensure you have sufficient balance and try
        again.
      </p>
    ),
  },
  check_account_balance: {
    message: 'Please check your account balance to ensure you have enough funds for the transaction.',
    component: <p>Please check your account balance to ensure you have enough funds for the transaction.</p>,
  },

  error_during_payment: {
    message: `An error occurred during payment. Please try again, if the problem persists contact support on ${SUPPORT_EMAIL}.`,
    component: (
      <p>
        An error occurred during payment. Please try again, if the problem persists contact support on{' '}
        <a className="text-purple-500" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    ),
  },
}

export default errorsMessages
