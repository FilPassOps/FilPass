import { CreditTicketStatus, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function run() {
  try {
    const now = new Date()

    // Find all non-expired ticket groups that have passed their expiration date
    const expiredGroups = await prisma.ticketGroup.findMany({
      where: {
        expired: false,
        expiresAt: {
          lte: now,
        },
      },
      include: {
        creditTickets: {
          where: {
            status: CreditTicketStatus.VALID,
          },
        },
      },
    })

    if (expiredGroups.length === 0) {
      return
    }

    await prisma.$transaction(async tx => {
      await tx.ticketGroup.updateMany({
        where: {
          id: {
            in: expiredGroups.map(group => group.id),
          },
        },
        data: {
          expired: true,
        },
      })

      await tx.creditTicket.updateMany({
        where: {
          ticketGroupId: {
            in: expiredGroups.map(group => group.id),
          },
          status: CreditTicketStatus.VALID,
        },
        data: {
          status: CreditTicketStatus.EXPIRED,
        },
      })
    })

    console.log('Successfully updated expired ticket groups and their tickets')
  } catch (error) {
    console.error('Error while checking expired ticket groups:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
