import { TransferRequestStatus } from '@prisma/client'
import { statusFilterMapping, StatusFilterOption } from 'components/Filters/constants'
import prisma from 'lib/prisma'
import { DRAFT_STATUS } from './constants'

export const findComplianceTeams = async () => {
  const teams = await prisma.transferRequest.findMany({
    select: {
      team: true,
    },
    where: {
      status: 'BLOCKED',
    },
  })

  const uniqueResults = new Set<string>()

  for (const { team } of teams) {
    uniqueResults.add(team)
  }

  return Array.from(uniqueResults)
}

export const findUserRoleTeams = async (userId: number, requestStatus: StatusFilterOption) => {
  const uniqueResults = new Set<string>()

  if (requestStatus === DRAFT_STATUS) {
    const teams = await prisma.transferRequestDraft.findMany({
      select: {
        team: true,
      },
      where: {
        program: {
          userRolePrograms: {
            some: {
              userRole: {
                userId,
              },
            },
          },
        },
      },
    })
    for (const { team } of teams) {
      uniqueResults.add(team)
    }
  } else {
    const statusFilter = statusFilterMapping[requestStatus].map(status => status as TransferRequestStatus)
    const teams = await prisma.transferRequest.findMany({
      select: {
        team: true,
      },
      where: {
        status: {
          in: statusFilter,
        },
        program: {
          userRolePrograms: {
            some: {
              userRole: {
                userId,
              },
            },
          },
        },
      },
    })

    for (const { team } of teams) {
      uniqueResults.add(team)
    }
  }

  return Array.from(uniqueResults)
}

export const findControllerTeams = async (requestStatus: TransferRequestStatus) => {
  const teams = await prisma.transferRequest.findMany({
    select: {
      team: true,
    },
    where: {
      status: requestStatus,
    },
  })

  const uniqueResults = new Set<string>()

  for (const { team } of teams) {
    uniqueResults.add(team)
  }

  return Array.from(uniqueResults)
}

export const findUserTeams = async (userId: number) => {
  const uniqueResults = new Set<string>()

  const drafts = await prisma.transferRequestDraft.findMany({
    select: {
      team: true,
    },
    where: {
      receiverId: userId,
    },
  })
  for (const { team } of drafts) {
    uniqueResults.add(team)
  }

  const requests = await prisma.transferRequest.findMany({
    select: {
      team: true,
    },
    where: {
      receiverId: userId,
    },
  })

  for (const { team } of requests) {
    uniqueResults.add(team)
  }

  return Array.from(uniqueResults)
}
