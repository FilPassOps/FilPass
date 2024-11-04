import { MAX_INTEGER_VALUE } from 'domain/constants'
import { BigNumber } from 'ethers'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import * as Yup from 'yup'
import { MIN_CREDIT_PER_TICKET } from './constants'
import { parseUnits } from 'ethers/lib/utils'
import { AppConfig } from 'config/system'

const { token } = AppConfig.network.getFilecoin()

export const getUserTransactionCreditsByUserIdValidator = yup.object({
  userId: yup.number().required(),
  currentPage: yup.number().required(),
  pageSize: yup.number().required(),
})

export const topUpTransferCreditsValidator = yup.object({
  amount: yup.number().positive().typeError(errorsMessages.required_field.message).required(),
  storageProviderWallet: yup.string().required(),
  additionalTicketDays: yup
    .number()
    .min(1, 'Additional ticket days must be greater than 0')
    .max(365, 'Additional ticket days must be less than 365 days')
    .required(),
})

export const createChannelValidator = yup.object({
  amount: yup.number().positive().typeError(errorsMessages.required_field.message).required(),
  storageProviderWallet: yup.string().required(),
})

export const saveTransferCreditsValidator = yup.object({
  amount: yup.string().required(),
  from: yup.string().required(),
  to: yup.string().required(),
  userId: yup.number().required(),
  hash: yup.string().required(),
  additionalTicketDays: yup.number().optional(),
})

export const getUserCreditsValidator = yup.object({
  userId: yup.number().required(),
  size: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
  page: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
})

export const getUserCreditByIdValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
})

export const createTicketsValidatorBackend = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
  splitNumber: yup.number().required(),
  creditPerTicket: yup.number().required(),
})

export const refundCreditsValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
  hash: yup.string().required(),
})

export const getTicketGroupsByUserCreditIdValidator = yup.object({
  userCreditId: Yup.number().required('User credit ID is required'),
})

export const getTicketsByTicketGroupIdValidator = yup.object({
  ticketGroupId: yup.number().required(),
  userId: yup.number().required(),
  userCreditId: yup.number().required(),
  pageSize: yup.number().required(),
  page: yup.number().required(),
})

export const getAvailableTicketsNumberValidator = yup.object({
  userId: yup.number().required(),
  userCreditId: yup.number().required(),
})

export const createTicketsValidator = (currentCredits: BigNumber, availableTicketsNumber: number) => {
  return yup
    .object()
    .shape({
      splitNumber: yup
        .number()
        .required('Number of tickets is required')
        .positive('Number of tickets must be positive')
        .integer('Number of tickets must be an integer')
        .max(availableTicketsNumber, `Maximum ${availableTicketsNumber} tickets allowed`),
      creditPerTicket: yup
        .number()
        .required('Credit per ticket is required')
        .positive('Credit per ticket must be positive')
        .test('min-credit-per-ticket', 'Credit per ticket is too low', function (value) {
          return parseUnits(value.toString(), token.decimals).gte(MIN_CREDIT_PER_TICKET)
        })
        .test('max-credit-per-ticket', 'Credit per ticket cannot exceed available credits', function (value) {
          return parseUnits(value.toString(), token.decimals).lte(currentCredits)
        })
        .test('precision-check', 'Too many decimal places', function (value) {
          const parts = value.toString().split('.')
          return parts.length === 1 || parts[1].length <= 6 // Only accept up to 6 decimal places on the front end
        }),
    })
    .test('total-credits', 'Total credits exceed available credits', function (values) {
      const { splitNumber, creditPerTicket } = values
      if (!splitNumber || !creditPerTicket) return true // Skip validation if either value is missing
      const totalCredits = parseUnits(creditPerTicket.toString(), token.decimals).mul(splitNumber)
      if (totalCredits.lte(currentCredits)) return true

      return this.createError({
        path: 'creditPerTicket',
        message: 'Total credits exceed available credits',
      })
    })
}

export const getAllSubmitTicketTransactionsValidator = yup.object({
  pageSize: yup.number().required(),
  page: yup.number().required(),
})

export const getUserCreditByReceiverWalletValidator = yup.object({
  receiverWallet: yup.string().required(),
  userId: yup.number().required(),
})
