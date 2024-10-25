import prisma from 'lib/prisma'
import { getTicketsBySplitGroupIdValidator } from './validation'

interface GetTicketsBySplitGroupIdProps {
  splitGroupId: number
  userId: number
  userCreditId: string
  pageSize: number
  page: number
}

export async function getTicketsBySplitGroupId(props: GetTicketsBySplitGroupIdProps) {
  try {
    const { splitGroupId, userId, userCreditId, pageSize, page } = await getTicketsBySplitGroupIdValidator.validate(props)
    const currentPage = page - 1 < 0 ? 0 : page - 1

    const splitTickets = await prisma.creditTicket.findMany({
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

    const total = await prisma.creditTicket.count({
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

    const totalRedeemedInvalid = await prisma.creditTicket.count({
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

    return { data: { splitTickets, total, totalRedeemedInvalid } }
  } catch (error) {
    console.error('Error fetching split tickets by split group:', error)
    throw error
  }
}
