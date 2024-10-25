import { MAX_INTEGER_VALUE } from 'domain/constants'
import { BigNumber, ethers } from 'ethers'
import yup from 'lib/yup'
import errorsMessages from 'wordings-and-errors/errors-messages'
import * as Yup from 'yup'
import { FIL, MIN_CREDIT_PER_VOUCHER } from './constants'
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
  creditPerVoucher: yup.number().required(),
})

export const refundCreditsValidator = yup.object({
  id: yup.number().required(),
  userId: yup.number().required(),
  hash: yup.string().required(),
})

export const getSplitTokensGroupByUserCreditIdValidator = Yup.object().shape({
  userCreditId: Yup.number().required('User credit ID is required'),
})

export const getSplitTokensBySplitGroupIdValidator = Yup.object().shape({
  splitGroupId: Yup.number().required(),
  userId: Yup.number().required(),
  userCreditId: Yup.number().required(),
  pageSize: Yup.number().required(),
  page: Yup.number().required(),
})

export const getAvailableTokenNumberValidator = Yup.object().shape({
  userId: Yup.number().required(),
  userCreditId: Yup.number().required(),
})

export const getLastVoucherRedeemedByUserCreditIdValidator = Yup.object().shape({
  userCreditId: Yup.number().required(),
  userId: Yup.number().required(),
})

export const splitTokensValidator = (currentCredits: BigNumber, availableTokenNumber: number) => {
  return Yup.object()
    .shape({
      splitNumber: Yup.number()
        .required('Number of vouchers is required')
        .positive('Number of vouchers must be positive')
        .integer('Number of vouchers must be an integer')
        .max(availableTokenNumber, `Maximum ${availableTokenNumber} vouchers allowed`),
      creditPerVoucher: Yup.number()
        .required('Credit per voucher is required')
        .positive('Credit per voucher must be positive')
        .test('min-credit-per-voucher', 'Credit per voucher is too low', function (value) {
          return parseUnits(value.toString(), FIL.decimals).gte(MIN_CREDIT_PER_VOUCHER)
        })
        .test('max-credit-per-voucher', 'Credit per voucher cannot exceed available credits', function (value) {
          return parseUnits(value.toString(), FIL.decimals).lte(currentCredits)
        })
        .test('precision-check', 'Too many decimal places', function (value) {
          const parts = value.toString().split('.')
          return parts.length === 1 || parts[1].length <= 6 // Only accept up to 6 decimal places on the front end
        }),
    })
    .test('total-credits', 'Total credits exceed available credits', function (values) {
      const { splitNumber, creditPerVoucher } = values
      if (!splitNumber || !creditPerVoucher) return true // Skip validation if either value is missing
      const totalCredits = parseUnits(creditPerVoucher.toString(), FIL.decimals).mul(splitNumber)
      return totalCredits.lte(currentCredits)
    })
}
