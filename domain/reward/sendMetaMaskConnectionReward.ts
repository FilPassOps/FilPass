import { validate } from 'lib/yup'
import { sendMetaMaskConnectionRewardValidation } from './validation'
import { sendFILWithMaster } from 'domain/utils/sendFILWithMaster'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface SendMetaMaskConnectionRewardParams {
  address: string
}

const METAMASK_CONNECTION_REWARD_AMOUNT = process.env.METAMASK_CONNECTION_REWARD_AMOUNT || '0.2'

export const sendMetaMaskConnectionReward = async (params: SendMetaMaskConnectionRewardParams) => {
  const { fields, errors } = await validate(sendMetaMaskConnectionRewardValidation, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }
  const { address } = fields

  try {
    const { data, error } = await sendFILWithMaster({ address, filAmount: METAMASK_CONNECTION_REWARD_AMOUNT })

    if (error) {
      return {
        error: {
          status: error.status || 400,
          message: error.message || errorsMessages.something_went_wrong.message,
        },
      }
    }

    return data
  } catch (error) {
    return {
      error: {
        status: 400,
        message: errorsMessages.something_went_wrong.message,
      },
    }
  }
}
