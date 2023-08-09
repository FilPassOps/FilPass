import { TransactionError } from 'lib/errors'
import { newPrismaTransaction } from 'lib/prisma'
import yup from 'lib/yup'
import { taxFormValidator } from './validation'

type Data = yup.Asserts<typeof taxFormValidator>

export async function updateUserTaxInfoById(userId: number, data: Data) {
  return await newPrismaTransaction(async prisma => {
    const [formFile] = await prisma.userFile.findMany({
      select: {
        id: true,
        publicId: true,
        filename: true,
        type: true,
        isApproved: true,
      },
      where: { publicId: data.userFileId, userId },
    })

    if (!formFile) {
      throw new TransactionError('Error while updating tax info. File not found.', { status: 500, errors: undefined })
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isUSResident: data.isUSResident,
      },
    })

    await prisma.userFile.updateMany({
      where: {
        id: {
          not: formFile.id,
        },
        userId: userId,
        type: {
          in: ['W8_FORM', 'W9_FORM'],
        },
      },
      data: {
        isActive: false,
      },
    })

    await prisma.transferRequest.updateMany({
      where: {
        status: 'BLOCKED',
        receiverId: userId,
        isLegacy: false,
      },
      data: {
        userFileId: formFile.id,
      },
    })

    await prisma.userFile.update({
      where: {
        id: formFile.id,
      },
      data: {
        isActive: true,
      },
    })

    return formFile
  })
}
