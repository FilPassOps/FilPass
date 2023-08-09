import { User } from '.prisma/client'
import {
  addApproverToProgram,
  clearDatabase,
  createApprover,
  createLinearVestingProgram,
  createOneTimeProgram,
  CreateProgramResult,
  createTransferRequest,
  createTransferRequestDraft,
  createUser,
  CreateUserResult,
} from 'test/helpers'
import { getApproverTransferRequestById } from '../getApproverTransferRequestById'

const userEmail = 'user@email.com'
let createdUser: CreateUserResult

const linearApproverEmail = 'linearapprover@email.com'
let linearApprover: User

const oneTimeApproverEmail = 'oneTimeApprover@email.com'
let oneTimeApprover: User

let linearProgram: CreateProgramResult
let oneTimeProgram: CreateProgramResult

const mockGetTransferRequestById = jest.fn()
jest.mock('domain/transferRequest/getTransferRequestById', () => ({
  getTransferRequestById: (params: any) => mockGetTransferRequestById(params),
}))

beforeAll(async () => {
  await clearDatabase()
  createdUser = await createUser(userEmail)

  const [linearApproverUser, linearApproverRole] = await createApprover(linearApproverEmail)
  const [oneTimeApproverUser, oneTimeApproverRole] = await createApprover(oneTimeApproverEmail)

  linearApprover = linearApproverUser
  oneTimeApprover = oneTimeApproverUser

  linearProgram = await createLinearVestingProgram()
  oneTimeProgram = await createOneTimeProgram()

  await addApproverToProgram(linearProgram.id, linearApproverRole.id)
  await addApproverToProgram(oneTimeProgram.id, oneTimeApproverRole.id)
})

afterAll(async () => {
  await clearDatabase()
})

describe('getApproverTransferRequestById', () => {
  it('should return error when validation fails', async () => {
    const { data, error } = await getApproverTransferRequestById({ transferRequestId: '', userId: 0 })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(400)
    // @ts-ignore
    expect(error?.errors).toBeTruthy()
  })

  it('it should call getTransferRequestById with correct transfer request public id where the user is a program approver', async () => {
    const { user, w9, wallets } = createdUser

    const amount = '1000'
    const team = 'Test Team'

    const linearTransferRequest = await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program: linearProgram,
      userWalletId: wallets[0].id,
      team,
      amount,
    })

    mockGetTransferRequestById.mockReturnValueOnce({ data: {} })

    await getApproverTransferRequestById({
      transferRequestId: linearTransferRequest.publicId,
      userId: linearApprover.id,
    })

    expect(mockGetTransferRequestById).toBeCalledWith({ transferRequestId: linearTransferRequest.publicId })
  })

  it('it should call getTransferRequestById with correct draft transfer request public id where the user is a program approver', async () => {
    const amount = '1000'
    const team = 'Test Team'

    const draft = await createTransferRequestDraft({
      receiverId: oneTimeApprover.id,
      requesterId: oneTimeApprover.id,
      program: oneTimeProgram,
      team,
      amount,
    })

    mockGetTransferRequestById.mockReturnValue({ data: {} })

    await getApproverTransferRequestById({ transferRequestId: draft.publicId, userId: oneTimeApprover.id })

    await getApproverTransferRequestById({
      transferRequestId: draft.publicId,
      userId: oneTimeApprover.id,
    })

    expect(mockGetTransferRequestById).toBeCalledWith({ transferRequestId: draft.publicId })
  })

  it('it should return not found if user is not program approver', async () => {
    const { user, w9, wallets } = createdUser

    const linearTransferRequest = await createTransferRequest({
      receiverId: user.id,
      requesterId: user.id,
      userFileId: w9[0].id,
      program: linearProgram,
      userWalletId: wallets[0].id,
      isActive: false,
    })

    const { data, error } = await getApproverTransferRequestById({
      transferRequestId: linearTransferRequest.publicId,
      userId: oneTimeApprover.id,
    })

    expect(data).toBeFalsy()
    expect(error?.status).toEqual(404)
  })
})
