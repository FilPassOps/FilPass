import { PLATFORM_NAME, SUPPORT_EMAIL } from 'system.config'

interface ErrorsMessages {
  [key: string]: {
    message: string
    length?: number
  }
}

interface ParametrizedErrorMessages {
  [key: string]: {
    message: (params: any) => string
  }
}

const errorsMessages: ErrorsMessages = {
  required_field: { message: 'This field is required.' },
  checked_field: { message: 'This field must be checked.' },
  confirmation_password: { message: 'Confirmation does not match password.' },
  invalid_pl_email: { message: `${PLATFORM_NAME} users must sign up with Google.` },
  email_must_be_valid: { message: 'Email must be a valid email.' },
  password_min_length: { length: 8, message: 'This field must be at least 8 characters.' },
  positive_number: { message: 'This field must be positive.' },
  not_found: { message: 'Not found.' },
  email_in_use: { message: 'Email already being used.' },
  wallet_address_in_use: { message: 'Address already being used.' },
  wallet_blockchain_not_found: { message: 'Blockchain not found.' },
  wrong_credentials: { message: 'Wrong credentials.' },
  invalid_token: { message: 'Invalid token.' },
  something_went_wrong: { message: 'Something went wrong, please try again later.' },
  account_not_found_or_already_verified: { message: 'Account not found or is already verified.' },
  email_is_not_verified: { message: 'Email is not verified.' },
  daily_verification_limit: { message: 'Reached maximum number of daily verifications.' },
  error_approving_transfer_request: { message: 'Error approving transfer request.' },
  error_rejecting_transfer_request: { message: 'Error rejecting transfer request.' },
  error_deleting_transfer_request: { message: 'Error deleting transfer request.' },
  error_voiding_transfer_request: { message: 'Error voiding transfer request.' },
  transfer_request_not_found: { message: 'Error transfer request not found.' },
  error_archiving_program: { message: 'Error archiving program.' },
  error_status_is_not_supported: { message: 'Status is not supported.' },
  wallet_not_found: { message: 'This wallet address does not exist' },
  wallet_incorrect: { message: 'This wallet address appears to be incorrect.' },
  program_not_found: { message: 'Program not found' },
  user_already_invited: { message: 'This user has already been invited.' },
  default_wallet_not_found: { message: 'Default Wallet not found, please specify a wallet.' },
  expired_token_link: { message: 'The link has expired, please try again.' },
  auth_code_not_found: { message: 'Verification code not found.' },
  auth_code_expired: { message: 'Verification code expired, please request a new one.' },
  invalid_default_wallet_ethereum: { message: `f4 / 0x addresses can't be set as a default address` },
  wallet_verification_not_found: { message: 'Verification not found.' },
  wallet_verification_value_not_match: { message: 'Amount provided did not match amount sent.' },
  wallet_cant_be_empty: { message: 'Please, provide a wallet address.' },
  auth_code_cant_generate: { message: "A new code can't be generated now, please try again in 1 minute." },
  user_not_found: { message: 'User not found.' },
  applying_for_others_unchek: { message: `To create a transfer request for yourself, go to My Requests page.` },
  user_rejected_payment: { message: 'Payment rejected by the user' },
  not_enough_funds: {
    message:
      'Sorry, you do not have enough funds in your account to complete the transaction. Please ensure you have sufficient balance and try again.',
  },
  check_account_balance: {
    message: 'Please check your account balance to ensure you have enough funds for the transaction.',
  },

  error_during_payment: {
    message: `An error occurred during payment. Please try again, if the problem persists contact support on ${SUPPORT_EMAIL}.`,
  },
}

export const parametrizedErrorsMessages: ParametrizedErrorMessages = {
  file_has_active_transfer_request: {
    message: (ids: string[] | number[]) =>
      `This file is used by transfer requests ${ids
        .map(
          id =>
            `<a style="text-decoration: underline;color: rgba(3, 105, 161, 1);" href="${process.env.APP_URL}/transfer-requests/${id}" target="_blank">#${id}</a>`,
        )
        .join(', ')}. Please change the file of those requests before deleting.`,
  },
  wallet_has_active_transfer_request: {
    message: (ids: string[] | number[]) =>
      `Wallet is used by transfer requests ${ids
        .map(
          id =>
            `<a style="text-decoration: underline;color: rgba(3, 105, 161, 1);" href="${process.env.APP_URL}/transfer-requests/${id}" target="_blank">#${id}</a>`,
        )
        .join(', ')}. Please change the wallet addresses of those requests before deleting the wallet.`,
  },
}

export default errorsMessages
