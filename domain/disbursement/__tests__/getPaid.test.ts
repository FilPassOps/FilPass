import { Transfer, TransferRequest } from '@prisma/client'
import { SUCCESS_STATUS } from 'domain/transfer/constants'
import { APPROVED_STATUS, PAID_STATUS } from 'domain/transferRequest/constants'
import { decrypt, decryptPII } from 'lib/emissaryCrypto'
import { find } from 'lodash'
import {
  CreateProgramResult,
  CreateUserResult,
  clearDatabase,
  createController,
  createOneTimeProgram,
  createTransferRequest,
  createUser,
} from 'test/helpers'
import { getPaid } from '../getPaid'

let tr: TransferRequest
let lastTr: TransferRequest
let program: CreateProgramResult
let msigProgram: CreateProgramResult
let userOne: CreateUserResult

beforeAll(async () => {
  await clearDatabase()
  program = await createOneTimeProgram()
  userOne = await createUser('user-1@email.com')
  const userTwo = await createUser('user-2@email.com')
  const controllerRole = (await createController())[1]

  tr = await createTransferRequest({
    status: PAID_STATUS,
    receiverId: userOne.user.id,
    requesterId: userOne.user.id,
    program: program,
    userWalletId: userOne.wallets[0].id,
    team: 'super user one two',
    amount: '10',
    payment: { status: SUCCESS_STATUS, controllerId: controllerRole.id } as Transfer,
  })

  await createTransferRequest({
    status: PAID_STATUS,
    receiverId: userOne.user.id,
    requesterId: userOne.user.id,
    program: program,
    userWalletId: userOne.wallets[0].id,
    team: 'super user one two',
    amount: '12',
    payment: { status: SUCCESS_STATUS, controllerId: controllerRole.id } as Transfer,
  })

  lastTr = await createTransferRequest({
    status: PAID_STATUS,
    receiverId: userTwo.user.id,
    requesterId: userTwo.user.id,
    program: msigProgram,
    userWalletId: userTwo.wallets[0].id,
    team: 'super user two one',
    amount: '15',
    payment: { status: SUCCESS_STATUS, controllerId: controllerRole.id } as Transfer,
  })

  await createTransferRequest({
    status: APPROVED_STATUS,
    receiverId: userTwo.user.id,
    requesterId: userTwo.user.id,
    program: program,
    userWalletId: userTwo.wallets[0].id,
    team: 'super user two two',
  })
})

afterAll(async () => {
  await clearDatabase()
})

describe('getPaid', () => {
  it('Should return paginated approved transfer requests', async () => {
    const { data } = await getPaid({})
    const testCandidate = find(data.requests, { publicId: tr.publicId })
    expect(data.requests).toHaveLength(3)
    expect(data.total).toEqual(3)
    expect(testCandidate).toBeDefined()
    expect(testCandidate).toEqual({
      id: tr.id,
      publicId: tr.publicId,
      team: await decryptPII(tr.team),
      createdAt: tr.createdAt,
      updatedAt: tr.updatedAt,
      amount: await decrypt(tr.amount),
      status: tr.status,
      wallet: {
        address: userOne.wallets[0].address,
        blockchain: userOne.wallets[0].blockchain,
        verificationId: userOne.wallets[0].verificationId,
      },
      program: {
        name: program.name,
        deliveryMethod: program.deliveryMethod,
        programCurrency: program.programCurrency.map(pg => ({ type: pg.type, currency: { name: pg.currency.name } })),
      },
      currency: {
        name: program.programCurrency.find(curr => curr.type === 'REQUEST')?.currency.name,
      },
      receiver: {
        email: await decryptPII(userOne.user.email),
      },
      transfers: [
        {
          amount: await decrypt(tr.amount),
          txHash: '',
          status: SUCCESS_STATUS,
          amountCurrencyUnit: {
            name: program.programCurrency.find(curr => curr.type === 'PAYMENT')?.currency.name,
          },
        },
      ],
    })
    expect(getPaid).not.toThrowError()
  })

  it('Should return only one page of request', async () => {
    const params = { size: 1, page: 1 }
    const { data } = await getPaid(params)

    expect(data.requests).toHaveLength(1)
    expect(data.total).toEqual(3)
  })

  it('Should return of a specific program', async () => {
    const params = { programId: [msigProgram.id] }
    const { data } = await getPaid(params)

    expect(data.requests).toHaveLength(1)
    expect(data.total).toEqual(1)
  })

  it('Should an empty list of transfer requests', async () => {
    const params = { programId: [9999991] }
    const { data } = await getPaid(params)

    expect(data.requests).toHaveLength(0)
    expect(data.total).toEqual(0)
  })

  it('Should return sorted and orders transfer request', async () => {
    const params = { sort: 'publicId', order: 'asc' }
    const { data: firstData } = await getPaid(params)

    expect(firstData.requests).toHaveLength(3)
    expect(firstData.total).toEqual(3)
    expect(firstData.requests[0].publicId).toEqual(tr.publicId)

    const params2 = { sort: 'publicId', order: 'desc' }
    const { data: secondData } = await getPaid(params2)
    expect(secondData.requests).toHaveLength(3)
    expect(secondData.total).toEqual(3)
    expect(secondData.requests[0].publicId).toEqual(lastTr.publicId)
  })
})
