import prisma from 'lib/prisma'
import { getTicketGroupsByUserCreditIdValidator } from './validation'

interface GetTicketGroupsByUserCreditIdParams {
  userCreditId: number
}

export const getTicketGroupsByUserCreditId = async (props: GetTicketGroupsByUserCreditIdParams) => {
  try {
    const fields = await getTicketGroupsByUserCreditIdValidator.validate(props)

    const groups = await prisma.ticketGroup.findMany({
      where: {
        userCreditId: fields.userCreditId,
      },
      include: {
        _count: {
          select: { creditTickets: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedResult = groups.map(group => ({
      ticketGroupId: group.id,
      totalTickets: group._count.creditTickets,
      createdAt: group.createdAt,
      expired: group.expired,
    }))

    return { data: formattedResult }
  } catch (error) {
    console.error('Error getting tickets group', error)
    return { error: 'Something went wrong' }
  }
}
