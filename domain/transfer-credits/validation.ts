import { MAX_INTEGER_VALUE } from 'domain/constants'
import { BigNumber, ethers } from 'ethers'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import * as Yup from 'yup'
import { FIL, MIN_CREDIT_PER_TICKET } from './constants'
import { parseUnits } from 'ethers/lib/utils'

export const getUserTransactionCreditsByUserIdValidator = yup.object({
  userId: yup.number().required(),
})

export const buyTransferCreditsValidator = yup.object({
  amount: yup.number().positive().typeError(errorsMessages.required_field.message).required(),
  storageProviderWallet: yup.string().required(),
})

export const saveTransferCreditsValidator = yup.object({
  amount: yup.string().required(),
  from: yup.string().required(),
  to: yup.string().required(),
  userId: yup.number().required(),
  hash: yup.string().required(),
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

export const splitCreditsValidator = yup.object({
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

export const getSplitTicketsGroupByUserCreditIdValidator = Yup.object().shape({
  userCreditId: Yup.number().required('User credit ID is required'),
})

export const getTicketsBySplitGroupIdValidator = Yup.object().shape({
  splitGroupId: Yup.number().required(),
  userId: Yup.number().required(),
  userCreditId: Yup.number().required(),
  pageSize: Yup.number().required(),
  page: Yup.number().required(),
})

export const getAvailableTicketsNumberValidator = Yup.object().shape({
  userId: Yup.number().required(),
  userCreditId: Yup.number().required(),
})

export const splitTicketsValidator = (currentCredits: BigNumber, availableTicketsNumber: number) => {
  return Yup.object()
    .shape({
      splitNumber: Yup.number()
        .required('Number of tickets is required')
        .positive('Number of tickets must be positive')
        .integer('Number of tickets must be an integer')
        .max(availableTicketsNumber, `Maximum ${availableTicketsNumber} tickets allowed`),
      creditPerTicket: Yup.number()
        .required('Credit per ticket is required')
        .positive('Credit per ticket must be positive')
        .test('min-credit-per-ticket', 'Credit per ticket is too low', function (value) {
          return parseUnits(value.toString(), FIL.decimals).gte(MIN_CREDIT_PER_TICKET)
        })
        .test('max-credit-per-ticket', 'Credit per ticket cannot exceed available credits', function (value) {
          return parseUnits(value.toString(), FIL.decimals).lte(currentCredits)
        })
        .test('precision-check', 'Too many decimal places', function (value) {
          const parts = value.toString().split('.')
          return parts.length === 1 || parts[1].length <= 6 // Only accept up to 6 decimal places on the front end
        }),
    })
    .test('total-credits', 'Total credits exceed available credits', function (values) {
      const { splitNumber, creditPerTicket } = values
      if (!splitNumber || !creditPerTicket) return true // Skip validation if either value is missing
      const totalCredits = parseUnits(creditPerTicket.toString(), FIL.decimals).mul(splitNumber)
      return totalCredits.lte(currentCredits)
    })
}
