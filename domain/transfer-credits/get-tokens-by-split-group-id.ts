import prisma from 'lib/prisma'
import { getSplitTokensBySplitGroupIdValidator } from './validation'

interface GetTokensBySplitGroupIdProps {
  splitGroupId: number
  userId: number
  userCreditId: string
  pageSize: number
  page: number
}

export async function getTokensBySplitGroupId(props: GetTokensBySplitGroupIdProps) {
  try {
    const { splitGroupId, userId, userCreditId, pageSize, page } = await getSplitTokensBySplitGroupIdValidator.validate(props)
    const currentPage = page - 1 < 0 ? 0 : page - 1

    const splitTokens = await prisma.creditToken.findMany({
      where: {
        splitGroup: {
          id: splitGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
      take: pageSize,
      skip: pageSize * currentPage,
      orderBy: {
        id: 'asc',
      },
    })

    const total = await prisma.creditToken.count({
      where: {
        splitGroup: {
          id: splitGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
      },
    })

    const totalRedeemedInvalid = await prisma.creditToken.count({
      where: {
        splitGroup: {
          id: splitGroupId,
          userCredit: {
            userId: userId,
            id: userCreditId,
          },
        },
        OR: [{ redeemable: false }, { valid: false }],
      },
    })

    return { data: { splitTokens, total, totalRedeemedInvalid } }
  } catch (error) {
    console.error('Error fetching split tokens by split group:', error)
    throw error
  }
}
