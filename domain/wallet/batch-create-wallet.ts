import { Prisma, Program } from '@prisma/client'
import { validateWalletAddress } from 'lib/blockchain-utils'
import { TransactionError } from 'lib/errors'
import prisma, { newPrismaTransaction } from 'lib/prisma'
import _ from 'lodash'
import errorsMessages from 'wordings-and-errors/errors-messages'

interface Request {
  wallet: {
    created?: boolean
    isDefault: boolean
    address: string
    shouldUpdate?: boolean
    id?: number
  }
  receiver: {
    id: number
    email: string
  }
  receiverEmail: string
  skipWalletCreation: boolean
  row: number
  programId: number
}

interface BatchCreateWalletParams {
  requests: {
    receiverEmail: string
    wallet?: string
    skipWalletCreation?: boolean
    programId: number
  }[]
  users: {
    id: number
    email: string
  }[]
  isBatchCsv?: boolean
}

interface CheckWalletParams {
  prisma: Prisma.TransactionClient
  user: { id: number; email: string }
  request: BatchCreateWalletParams['requests'][0]
  isBatchCsv?: boolean
  index: number
  programs: ProgramWithBlockchain[]
}

interface ProgramWithBlockchain extends Program {
  currency: {
    blockchainId: number
  }
}

export const batchCreateWallet = async ({ requests, users, isBatchCsv }: BatchCreateWalletParams) => {
  const programs = (await prisma.program.findMany({
    select: {
      id: true,
      currency: {
        select: {
          blockchainId: true,
        },
      },
    },
  })) as ProgramWithBlockchain[]

  const validatePromiseList = requests.map(async (singleRequest, index) => {
    const user = users.find(singleUser => singleUser.email === singleRequest.receiverEmail)

    if (!user) {
      throw { message: `${errorsMessages.user_not_found.message} At line ${index + 1}` }
    }

    return await checkWallet({ prisma, user, request: singleRequest, isBatchCsv, index, programs })
  })

  const validatedWallets = await Promise.allSettled(validatePromiseList)

  const walletRequests = validatedWallets.map(result => (result.status === 'rejected' ? result.reason : result.value))
  const foundRejected = validatedWallets.find(req => req.status === 'rejected')

  if (foundRejected) {
    let errors: ({ message: any } | { wallet: { message: string } } | null)[] = []

    if (isBatchCsv) {
      errors = validatedWallets.map(result =>
        result.status === 'rejected' ? { message: result.reason?.message ?? errorsMessages.wallet_incorrect.message } : null,
      )
    } else {
      errors = validatedWallets.map(result =>
        result.status === 'rejected'
          ? { wallet: { message: result.reason?.message ?? errorsMessages.wallet_incorrect_user_default_wallet.message } }
          : null,
      )
    }

    return {
      error: {
        status: 400,
        errors: errors,
      },
    }
  }

  const { data: createdWallets, error } = await createOrUpdateWallets(walletRequests, programs)

  if (error) {
    return { error }
  }

  return await setDefaultWallets(createdWallets as Request[], programs)
}

const checkWallet = async ({ prisma, user, request, isBatchCsv, index, programs }: CheckWalletParams) => {
  const userWallets = await prisma.userWallet.findMany({
    where: {
      userId: user.id,
    },
  })

  const program = programs.find(program => program.id === request.programId)

  if (!program) {
    throw { message: errorsMessages.program_not_found.message }
  }

  const defaultWallet = userWallets.find(
    wallet => wallet.isActive && wallet.isDefault && wallet.blockchainId === program.currency.blockchainId,
  )

  if (defaultWallet && !request.wallet) {
    return { ...request, wallet: defaultWallet, receiver: user }
  }

  if (!defaultWallet && !request.wallet && isBatchCsv) {
    throw { message: `${errorsMessages.default_wallet_not_found.message} At line ${index + 1}` }
  }

  if (!defaultWallet && !request.wallet && !isBatchCsv) {
    throw { wallet: errorsMessages.default_wallet_not_found }
  }

  const storedWallet = userWallets.find(
    ({ address, blockchainId, isActive }) =>
      isActive && address.toLowerCase() === request.wallet?.toLowerCase() && program.currency.blockchainId === blockchainId,
  )
  // TODO it should check for inactive wallets too if so, should update isActive to true

  if (storedWallet) {
    return {
      ...request,
      wallet: storedWallet,
      receiver: user,
    }
  }

  if (!storedWallet && !request.wallet) {
    throw { wallet: errorsMessages.wallet_cant_be_empty }
  }

  const deactivatedWallet = userWallets.find(
    ({ address, blockchainId, isActive }) =>
      !isActive && address.toLowerCase() === request.wallet?.toLowerCase() && program.currency.blockchainId === blockchainId,
  )

  if (deactivatedWallet) {
    return {
      ...request,
      wallet: { ...deactivatedWallet, shouldUpdate: true },
      receiver: user,
    }
  }

  if (request.wallet && validateWalletAddress(request.wallet)) {
    request.wallet = request.wallet.toLowerCase()
  } else {
    if (isBatchCsv) {
      throw { message: `${errorsMessages.wallet_incorrect.message} At line ${index + 1}` }
    }
    throw { wallet: errorsMessages.wallet_incorrect.message }
  }

  return {
    ...request,
    wallet: { created: false, isDefault: false, address: request.wallet },
    receiver: user,
  }
}

const createOrUpdateWallets = async (requests: Request[], programs: ProgramWithBlockchain[]) => {
  return await newPrismaTransaction(async prisma => {
    const promiseList = requests.map(async singleRequest => {
      if (singleRequest.wallet?.created === false && !singleRequest?.skipWalletCreation) {
        const requestProgram = programs.find(program => program.id === singleRequest.programId)

        const wallet = await prisma.userWallet.create({
          data: {
            userId: singleRequest.receiver.id,
            name: 'created by approver',
            address: singleRequest.wallet.address,
            blockchainId: requestProgram?.currency.blockchainId as number,
            isDefault: false,
          },
        })

        return { ...singleRequest, wallet }
      } else if (singleRequest.wallet?.shouldUpdate && !singleRequest?.skipWalletCreation) {
        const wallet = await prisma.userWallet.update({
          where: {
            id: singleRequest.wallet.id,
          },
          data: {
            isActive: true,
          },
        })

        return { ...singleRequest, wallet }
      }

      return singleRequest
    })

    const createdWallets = await Promise.allSettled(promiseList)

    const walletRequests = createdWallets.map(result => (result.status === 'rejected' ? result : result.value))

    const foundRejected = createdWallets.find(req => req.status === 'rejected')

    if (foundRejected) {
      throw new TransactionError('Error while creating wallets', { status: 500, errors: undefined })
    }

    return cleanRequests(walletRequests as Request[])
  })
}

const setDefaultWallets = async (requests: Request[], programs: ProgramWithBlockchain[]) => {
  return await newPrismaTransaction(async prisma => {
    const promiseList = requests.map(async singleRequest => {
      if (singleRequest.wallet?.isDefault) {
        return singleRequest
      }

      const userWallets = await prisma.userWallet.findMany({
        where: {
          userId: singleRequest.receiver.id,
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const requestProgram = programs.find(program => program.id === singleRequest.programId)

      const defaultWallet = userWallets.find(wallet => wallet.isDefault && wallet.blockchainId === requestProgram?.currency.blockchainId)

      if (!defaultWallet) {
        await prisma.userWallet.update({
          where: {
            id: userWallets[0].id,
          },
          data: {
            isDefault: true,
          },
        })
      }

      return singleRequest
    })

    const updatedWallets = await Promise.allSettled(promiseList)

    const walletRequests = updatedWallets.map(result => (result.status === 'rejected' ? result : result.value))

    if (updatedWallets.find(req => req.status === 'rejected')) {
      throw new TransactionError('Error while updating default wallet', { status: 500, errors: undefined })
    }

    return walletRequests
  })
}

const cleanRequests = (requests: Request[]) => {
  const uniqueWalletsAndEmails = _.mapValues(_.groupBy(requests, 'wallet.address'), value => _.uniqBy(value, 'receiverEmail'))
  const uniqueRequests = _.flatMap(uniqueWalletsAndEmails, (value, key) => value.map(v => ({ ...v, wallet: key })))

  return requests.map(request => {
    if (!uniqueRequests.find(r => r.row === request.row)) {
      const createdWallet = requests.find(r => r.wallet.address === request.wallet.address && r.receiverEmail === request.receiverEmail)
        ?.wallet
      return { ...request, wallet: createdWallet }
    } else {
      return request
    }
  })
}
