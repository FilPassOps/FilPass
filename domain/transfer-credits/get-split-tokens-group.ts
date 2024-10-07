import prisma from 'lib/prisma'
import { getSplitTokensGroupValidator } from './validation'

interface GetSplitTokensGroupParams {
  userCreditId: number
}

export const getSplitTokensGroup = async (props: GetSplitTokensGroupParams) => {
  try {
    const fields = await getSplitTokensGroupValidator.validate(props)

    const splitTokensGroup = await prisma.creditToken.groupBy({
      by: ['splitGroup'],
      where: {
        userCreditId: fields.userCreditId,
      },
      _count: {
        id: true,
      },
      _min: {
        createdAt: true,
      },
      orderBy: {
        splitGroup: 'asc',
      },
      take: 10,
    })

    const formattedResult = splitTokensGroup.map(group => ({
      splitGroup: group.splitGroup ?? '0',
      totalTokens: group._count.id || 0,
      createdAt: group._min.createdAt,
    }))

    return { data: formattedResult }
  } catch (error) {
    console.error('Error getting split tokens group', error)
    return { error: 'Something went wrong' }
  }
}
