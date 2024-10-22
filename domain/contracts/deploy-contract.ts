import prisma from 'lib/prisma'

interface DeployContractParams {
  walletAddress: string
  userId: number
  hash: string
}

export const deployContract = async (props: DeployContractParams) => {
  try {
    await prisma.deployContractTransaction.create({
      data: {
        walletAddress: props.walletAddress,
        userId: props.userId,
        transactionHash: props.hash,
      },
    })

    return { message: 'Success' }
  } catch (error) {
    console.log('Error creating comment', error)
    return { error: 'Something went wrong' }
  }
}
