import { newPrismaTransaction } from 'lib/prisma'
import { validate } from 'lib/yup'
import { deleteTransferRequestValidator } from './validation'

export async function deleteTransferRequestById(params, user) {
  const { id: requesterId } = user
  const { fields, errors } = await validate(deleteTransferRequestValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { requests } = fields

  return await newPrismaTransaction(async (prisma) => {
    const promiseList = requests.map(async (publicId) => {
      return await prisma.transferRequest.updateMany({
        where: { publicId, requesterId },
        data: { isActive: false },
      })
    })
    return await Promise.all(promiseList)
  })
}
