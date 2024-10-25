import prisma from 'lib/prisma'
import { getSplitTokensGroupByUserCreditIdValidator } from './validation'

interface GetSplitTokensGroupByUserCreditIdParams {
  userCreditId: number
}

export const getSplitTokensGroupByUserCreditId = async (props: GetSplitTokensGroupByUserCreditIdParams) => {
  try {
    const fields = await getSplitTokensGroupByUserCreditIdValidator.validate(props)

    const groups = await prisma.splitGroup.findMany({
      where: {
        userCreditId: fields.userCreditId,
      },
      include: {
        _count: {
          select: { creditTokens: true },
        },
      },
    })

    const formattedResult = groups.map(group => ({
      splitGroup: group.id,
      totalTokens: group._count.creditTokens,
      createdAt: group.createdAt,
    }))

    return { data: formattedResult }
  } catch (error) {
    console.error('Error getting split tokens group', error)
    return { error: 'Something went wrong' }
  }
}
