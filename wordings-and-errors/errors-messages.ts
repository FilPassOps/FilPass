import { AppConfig } from 'config'

interface ErrorsMessages {
  [key: string]: {
    message: string
    length?: number
  }
}

const errorsMessages: ErrorsMessages = {
  required_field: { message: 'This field is required.' },
  checked_field: { message: 'This field must be checked.' },
  confirmation_password: { message: 'Confirmation does not match password.' },
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
  wallet_not_found: { message: 'This wallet address does not exist' },
  expired_token_link: { message: 'The link has expired, please try again.' },
  auth_code_not_found: { message: 'Verification code not found.' },
  auth_code_expired: { message: 'Verification code expired, please request a new one.' },
  auth_code_cant_generate: { message: "A new code can't be generated now, please try again in 1 minute." },
  user_rejected_payment: { message: 'Payment rejected by the user' },
  not_enough_funds: {
    message:
      'Sorry, you do not have enough funds in your account to complete the transaction. Please ensure you have sufficient balance and try again.',
  },
  check_account_balance: {
    message: 'Please check your account balance to ensure you have enough funds for the transaction.',
  },

  error_during_payment: {
    message: `An error occurred during payment. Please try again, if the problem persists contact support on ${AppConfig.app.emailConfig.supportAddress}.`,
  },
}

export default errorsMessages
