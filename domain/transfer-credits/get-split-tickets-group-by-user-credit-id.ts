import prisma from 'lib/prisma'
import { getSplitTicketsGroupByUserCreditIdValidator } from './validation'

interface GetSplitTicketsGroupByUserCreditIdParams {
  userCreditId: number
}

export const getSplitTicketsGroupByUserCreditId = async (props: GetSplitTicketsGroupByUserCreditIdParams) => {
  try {
    const fields = await getSplitTicketsGroupByUserCreditIdValidator.validate(props)

    const groups = await prisma.splitGroup.findMany({
      where: {
        userCreditId: fields.userCreditId,
      },
      include: {
        _count: {
          select: { creditTickets: true },
        },
      },
    })

    const formattedResult = groups.map(group => ({
      splitGroup: group.id,
      totalTickets: group._count.creditTickets,
      createdAt: group.createdAt,
    }))

    return { data: formattedResult }
  } catch (error) {
    console.error('Error getting split tickets group', error)
    return { error: 'Something went wrong' }
  }
}
