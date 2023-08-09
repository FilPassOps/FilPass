import prisma from 'lib/prisma'

interface FindReceiverProgramsParams {
  receiverId: number
}

export const findReceiverPrograms = async ({ receiverId }: FindReceiverProgramsParams) => {
  return await prisma.program.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      OR: [
        {
          transferRequests: {
            some: {
              receiverId,
            },
          },
        },
        {
          transferRequestDrafts: {
            some: {
              receiverId,
            },
          },
        },
      ],
    },
  })
}
