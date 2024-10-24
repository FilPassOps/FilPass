import prisma from 'lib/prisma'
import { getSplitTokensBySplitGroupValidator } from './validation'

interface GetTokensBySplitGroupProps {
  splitGroup: string
  userId: number
  userCreditId: string
  pageSize: number
  page: number
}

export async function getTokensBySplitGroup(props: GetTokensBySplitGroupProps) {
  try {
    const { splitGroup, userId, userCreditId, pageSize, page } = await getSplitTokensBySplitGroupValidator.validate(props)
    const currentPage = page - 1 < 0 ? 0 : page - 1

    const splitTokens = await prisma.creditToken.findMany({
      where: {
        splitGroup: splitGroup,
        userCredit: {
          userId: userId,
          id: userCreditId,
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
        splitGroup: splitGroup,
        userCredit: {
          userId: userId,
          id: userCreditId,
        },
      },
    })

    const totalRedeemed = await prisma.creditToken.count({
      where: {
        splitGroup: splitGroup,
        redeemable: false,
        userCredit: {
          userId: userId,
          id: userCreditId,
        },
      },
    })

    return { data: { splitTokens, total, totalRedeemed } }
  } catch (error) {
    console.error('Error fetching split tokens by split group:', error)
    throw error
  }
}
