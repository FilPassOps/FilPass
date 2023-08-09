import { TransferRequestStatus } from '@prisma/client'
import { validate } from 'lib/yup'
import { getTransferRequestById } from './getTransferRequestById'
import { getCompliaceTransferRequestByIdValidator } from './validation'

interface GetComplianceTransferRequestByIdParams {
  transferRequestId: string
  status?: TransferRequestStatus
}

export async function getComplianceTransferRequestById(params: GetComplianceTransferRequestByIdParams) {
  const { fields, errors } = await validate(getCompliaceTransferRequestByIdValidator, params)
  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
      data: undefined,
    }
  }

  const { transferRequestId, status } = fields

  return getTransferRequestById({ transferRequestId, status: status as TransferRequestStatus })
}
