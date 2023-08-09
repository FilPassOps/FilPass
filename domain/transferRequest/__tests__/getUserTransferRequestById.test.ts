import { User } from '.prisma/client'
import { getUserTransferRequestById } from 'domain/transferRequest/getUserTransferRequestById'
import {
  clearDatabase,
  createApprover,
  createLinearVestingProgram,
  CreateProgramResult,
  createTransferRequest,
  createTransferRequestDraft,
  createUser,
  CreateUserResult,
} from 'test/helpers'

let createdUser: CreateUserResult
let createdApprover: User
let program: CreateProgramResult

const userEmail = 'user@email.com'
const approverEmail = 'testapprover@email.com'

const mockGetTransferRequestById = jest.fn()
jest.mock('domain/transferRequest/getTransferRequestById', () => ({
  getTransferRequestById: (params: any) => mockGetTransferRequestById(params),
}))

const mockGetReceiverDraftTransferRequestById = jest.fn()
jest.mock('domain/transferRequestDraft/getReceiverDraftTransferRequestById', () => ({
  getReceiverDraftTransferRequestById: (params: any) => mockGetReceiverDraftTransferRequestById(params),
}))

beforeAll(async () => {
  await clearDatabase()
  createdUser = await createUser(userEmail)
  const [approver] = await createApprover(approverEmail)
  createdApprover = approver
  program = await createLinearVestingProgram()
})

afterAll(async () => {
  await clearDatabase()
})

describe('getUserTransferRequestById', () => {
  it('should return error when validation fails', async () => {
    const { data, error } = await getUserTransferRequestById({ transferRequestId: '', userId: 0 })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(400)
    // @ts-ignore
    expect(error?.errors).toBeTruthy()
  })

  it('it should call getTransferRequestById with correct transfer request public id', async () => {
    const { user, w9, wallets } = createdUser

    const amount = '1000'
    const team = 'Test Team'

    const transferRequest = await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program,
      userWalletId: wallets[0].id,
      team,
      amount,
    })

    await getUserTransferRequestById({ transferRequestId: transferRequest.publicId, userId: user.id })

    expect(mockGetTransferRequestById).toBeCalledWith({ transferRequestId: transferRequest.publicId })
  })

  it('it should call getReceiverDraftTransferRequestById with correct transfer request draft public id and receiver id', async () => {
    const { user } = createdUser

    const amount = '1000'
    const team = 'Test Team'

    const draft = await createTransferRequestDraft({
      receiverId: user.id,
      requesterId: createdApprover.id,
      program,
      team,
      amount,
    })

    mockGetReceiverDraftTransferRequestById.mockResolvedValueOnce({ data: {} })

    await getUserTransferRequestById({ transferRequestId: draft.publicId, userId: user.id })

    expect(mockGetReceiverDraftTransferRequestById).toBeCalledWith({ transferRequestId: draft.publicId, receiverId: user.id })
  })

  it('should return error for inactive transfer request', async () => {
    const { user, w9, wallets } = createdUser

    const transferRequest = await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program,
      userWalletId: wallets[0].id,
      isActive: false,
    })

    mockGetReceiverDraftTransferRequestById.mockResolvedValueOnce({ error: {} })

    const { data, error } = await getUserTransferRequestById({ transferRequestId: transferRequest.publicId, userId: user.id })

    expect(mockGetReceiverDraftTransferRequestById).toBeCalledWith({ transferRequestId: transferRequest.publicId, receiverId: user.id })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(404)
  })

  it('should return not found when user is different', async () => {
    const { user, w9, wallets } = await createUser('user@email.com')
    const { user: defaultUser } = createdUser

    const transferRequest = await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program,
      userWalletId: wallets[0].id,
    })

    mockGetReceiverDraftTransferRequestById.mockResolvedValueOnce({ error: {} })

    const { data, error } = await getUserTransferRequestById({ transferRequestId: transferRequest.publicId, userId: defaultUser.id })

    expect(mockGetReceiverDraftTransferRequestById).toBeCalledWith({
      transferRequestId: transferRequest.publicId,
      receiverId: defaultUser.id,
    })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(404)
  })
})
