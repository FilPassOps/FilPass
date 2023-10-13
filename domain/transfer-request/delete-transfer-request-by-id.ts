import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { deleteTransferRequestValidator } from './validation'
import { SessionUser } from 'lib/middleware'

interface DeleteTransferRequestByIdParams {
  requests: string[]
}

export async function deleteTransferRequestById(params: DeleteTransferRequestByIdParams, user: SessionUser) {
  const { id: requesterId } = user
  const { fields, errors } = await validate(deleteTransferRequestValidator, params)

  if (errors || !fields) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests } = fields

  return await newPrismaTransaction(async prisma => {
    const promiseList = requests.map(async publicId => {
      return await prisma.transferRequest.updateMany({
        where: { publicId, requesterId },
        data: { isActive: false },
      })
    })
    return await Promise.all(promiseList)
  })
}
