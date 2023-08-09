import { FileType, PrismaClient } from '@prisma/client'
import { decryptPII } from 'lib/emissaryCrypto'
import { getPrismaClient } from 'lib/prisma'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface FindAllTaxFormsParams {
  isApproved: boolean | null
  page: number
  pageSize: number
}

export async function findAllTaxForms({ isApproved, page, pageSize }: FindAllTaxFormsParams) {
  const prisma: PrismaClient = await getPrismaClient()

  const taxForms = await prisma.userFile.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    where: {
      isActive: true,
      isApproved,
      type: {
        in: [FileType.W8_FORM, FileType.W9_FORM],
      },
    },
    select: {
      id: true,
      publicId: true,
      filename: true,
      rejectionReason: true,
      createdAt: true,
      type: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  })

  const totalItems = await prisma.userFile.count({
    where: {
      isActive: true,
      isApproved,
      type: {
        in: [FileType.W8_FORM, FileType.W9_FORM],
      },
    },
  })

  if (!taxForms) {
    return {
      error: {
        status: 404,
        errors: {
          taxForm: {
            message: `Tax forms ${errorsMessages.not_found}`,
          },
        },
      },
    }
  }

  const taxFormsFormatted = await Promise.all(
    taxForms.map(async data => ({
      ...data,
      user: { email: await decryptPII(data.user.email) },
    }))
  )

  return { data: { taxForms: taxFormsFormatted, totalItems } }
}
