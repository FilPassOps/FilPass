import prisma from 'lib/prisma'
import { getContractsByUserIdValidator } from './validation'

interface GetContractsByUserIdParams {
  userId: number
}

export const getContractsByUserId = async (props: GetContractsByUserIdParams) => {
  try {
    const fields = await getContractsByUserIdValidator.validate(props)
    const contracts = await prisma.contract.findMany({
      where: {
        userId: fields.userId,
      },
    })

    return { data: contracts }
  } catch (error) {
    console.log('Error getting contracts by user id', error)
    return { error: 'Something went wrong' }
  }
}
