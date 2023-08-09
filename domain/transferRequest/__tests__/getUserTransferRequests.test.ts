import { User } from '@prisma/client'
import { DateTime } from 'luxon'
import { clearDatabase, createOneTimeProgram, createTransferRequest, createTransferRequestDraft, createUser } from 'test/helpers'
import { getUserTransferRequests } from '../getUserTransferRequests'

let user: User
const userEmail = 'user@email.com'
const amount = '1000'
const team = 'Test Team X'

beforeAll(async () => {
  await clearDatabase()
  const { user: newUser, w9, wallets } = await createUser(userEmail)
  const programA = await createOneTimeProgram('PROGRAM A')
  const programB = await createOneTimeProgram('PROGRAM B')
  user = newUser

  const now = new Date()
  await Promise.all([
    createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program: programB,
      userWalletId: wallets[0].id,
      team,
      amount,
      createdAt: now,
    }),
    createTransferRequestDraft({
      receiverId: user.id,
      requesterId: user.id,
      program: programB,
      team,
      amount,
      createdAt: new Date(now.getTime() + 1),
    }),
    createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program: programA,
      userWalletId: wallets[0].id,
      team,
      amount,
      createdAt: new Date(now.getTime() + 2),
    }),
    createTransferRequestDraft({
      receiverId: user.id,
      requesterId: user.id,
      program: programA,
      team,
      amount,
      createdAt: new Date(now.getTime() + 3),
    }),
  ])
})

afterAll(async () => {
  await clearDatabase()
})

describe('getUserTransferRequests', () => {
  it('should return error when validation fails', async () => {
    const { data, error } = await getUserTransferRequests({ userId: 0 })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(400)
    // @ts-ignore
    expect(error?.errors).toBeTruthy()
  })

  it('should return transfer requests and drafts in the requested order', async () => {
    const { data, error } = await getUserTransferRequests({
      userId: user.id,
      page: 1,
      size: 10,
      sort: 'program',
      order: 'asc',
    })

    expect(data?.requests.length).toEqual(4)
    expect(data?.requests[0].program_name).toEqual('PROGRAM A')
    expect(data?.requests[0].team).toEqual(team)
    expect(data?.requests[0].amount).toEqual(amount)
    expect(data?.requests[1].program_name).toEqual('PROGRAM A')
    expect(data?.requests[1].team).toEqual(team)
    expect(data?.requests[1].amount).toEqual(amount)
    expect(data?.requests[2].program_name).toEqual('PROGRAM B')
    expect(data?.requests[2].team).toEqual(team)
    expect(data?.requests[2].amount).toEqual(amount)
    expect(data?.requests[3].program_name).toEqual('PROGRAM B')
    expect(data?.requests[3].team).toEqual(team)
    expect(data?.requests[3].amount).toEqual(amount)
    expect(data?.totalItems).toEqual(4)

    expect(error).toBeFalsy()
  })

  it('should respect paging params', async () => {
    const { data: page1, error: page1Error } = await getUserTransferRequests({
      userId: user.id,
      page: 1,
      size: 2,
      sort: 'program',
      order: 'desc',
    })

    expect(page1?.requests.length).toEqual(2)
    expect(page1?.requests[0].program_name).toEqual('PROGRAM B')
    expect(page1?.requests[0].team).toEqual(team)
    expect(page1?.requests[0].amount).toEqual(amount)
    expect(page1?.requests[1].program_name).toEqual('PROGRAM B')
    expect(page1?.requests[1].team).toEqual(team)
    expect(page1?.requests[1].amount).toEqual(amount)
    expect(page1?.totalItems).toEqual(4)
    expect(page1Error).toBeFalsy()

    const { data: page2, error: page2Error } = await getUserTransferRequests({
      userId: user.id,
      page: 2,
      size: 2,
      sort: 'program',
      order: 'desc',
    })

    expect(page2?.requests.length).toEqual(2)
    expect(page2?.requests[0].program_name).toEqual('PROGRAM A')
    expect(page2?.requests[0].team).toEqual(team)
    expect(page2?.requests[0].amount).toEqual(amount)
    expect(page2?.requests[1].program_name).toEqual('PROGRAM A')
    expect(page2?.requests[1].team).toEqual(team)
    expect(page2?.requests[1].amount).toEqual(amount)
    expect(page2?.totalItems).toEqual(4)
    expect(page2Error).toBeFalsy()
  })

  it('should order by created date desc and return firt page if no sorting and paging is provided', async () => {
    const { data, error } = await getUserTransferRequests({
      userId: user.id,
    })

    expect(data?.requests.length).toEqual(4)
    expect(DateTime.fromISO(data?.requests[0].create_date).toMillis()).toBeGreaterThan(
      DateTime.fromISO(data?.requests[1].create_date).toMillis()
    )
    expect(DateTime.fromISO(data?.requests[1].create_date).toMillis()).toBeGreaterThan(
      DateTime.fromISO(data?.requests[2].create_date).toMillis()
    )
    expect(DateTime.fromISO(data?.requests[2].create_date).toMillis()).toBeGreaterThan(
      DateTime.fromISO(data?.requests[3].create_date).toMillis()
    )
    expect(error).toBeFalsy()
  })
})
