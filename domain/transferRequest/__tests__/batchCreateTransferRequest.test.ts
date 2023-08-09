import { TemporaryFile, User, UserRole } from '.prisma/client'
import {
  CreateProgramResult,
  CreateUserResult,
  addApproverToProgram,
  clearDatabase,
  createApprover,
  createLinearVestingProgram,
  createTemporaryFile,
  createUser,
} from 'test/helpers'
import { buildTransferRequestData } from '../batchCreateTransferRequest'
import { SUBMITTED_BY_APPROVER_STATUS } from '../constants'

const linearApproverEmail = 'linearapprover@email.com'
let approver: User
let user1: CreateUserResult
let user2: CreateUserResult
let approverRole: UserRole
let program: CreateProgramResult
let msigProgram: CreateProgramResult
let temporaryFile: TemporaryFile

beforeAll(async () => {
  await clearDatabase()

  const [linearApproverUser, linearApproverRole] = await createApprover(linearApproverEmail)
  approver = linearApproverUser
  approverRole = linearApproverRole
  program = await createLinearVestingProgram()
  temporaryFile = await createTemporaryFile(approver.id)
  user1 = await createUser('user1@email.com')
  user2 = await createUser('user2@email.com')
  await addApproverToProgram(program.id, linearApproverRole.id)
  await addApproverToProgram(msigProgram.id, linearApproverRole.id)
})

afterAll(async () => {
  await clearDatabase()
})

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks()
})

const mockMoveFileS3 = jest.fn()
jest.mock('lib/aws/s3', () => ({
  moveFileS3: (params: any) => mockMoveFileS3(params),
}))

describe('batchCreateTransferRequest - buildTransferRequestData', () => {
  it('should check program and create userFile', async () => {
    const requests = [
      {
        programId: program.id,
        wallet: user1.wallets[0],
        temporaryFileId: temporaryFile.publicId,
        receiver: user1.user,
        team: 'Team One',
        amount: '100',
        currencyUnitId: program.programCurrency[1].id,
      },
      {
        programId: program.id,
        wallet: user2.wallets[0],
        temporaryFileId: temporaryFile.publicId,
        receiver: user2.user,
        team: 'Team Two',
        amount: '200',
        currencyUnitId: program.programCurrency[1].id,
      },
      {
        programId: msigProgram.id,
        wallet: user2.wallets[0],
        temporaryFileId: temporaryFile.publicId,
        receiver: user2.user,
        team: 'Team Three',
        amount: '210',
        currencyUnitId: msigProgram.programCurrency[1].id,
        vestingMonths: 10,
        vestingStartEpoch: 2000,
      },
    ]
    const kmsModule = jest.requireActual('lib/emissaryCrypto')
    const encryptSpy = jest.spyOn(kmsModule, 'encrypt')
    const encryptPIISpy = jest.spyOn(kmsModule, 'encryptPII')

    mockMoveFileS3
      .mockResolvedValueOnce({
        data: { key: `${Date.now().toString()}${user1.user.id}` },
      })
      .mockResolvedValueOnce({
        data: { key: `${Date.now().toString()}${user2.user.id}` },
      })
      .mockResolvedValueOnce({
        data: { key: `${Date.now().toString()}${user2.user.id}0` },
      })

    const result = await buildTransferRequestData(requests, approver.id, approverRole.id)

    expect(result).toBeTruthy()
    expect(result[0].requesterId).toEqual(approver.id)
    expect(result[0].programId).toEqual(program.id)
    expect(result[0].userWalletId).toEqual(user1.wallets[0].id)
    expect(result[0].userWalletAddress).toEqual(user1.wallets[0].address)
    expect(result[0].receiverId).toEqual(user1.user.id)
    expect(result[0].status).toEqual(SUBMITTED_BY_APPROVER_STATUS)
    expect(result[0].currencyUnitId).toEqual(program.programCurrency[1].id)

    expect(result[1].requesterId).toEqual(approver.id)
    expect(result[1].programId).toEqual(program.id)
    expect(result[1].userWalletId).toEqual(user2.wallets[0].id)
    expect(result[1].userWalletAddress).toEqual(user2.wallets[0].address)
    expect(result[1].receiverId).toEqual(user2.user.id)
    expect(result[1].status).toEqual(SUBMITTED_BY_APPROVER_STATUS)
    expect(result[1].currencyUnitId).toEqual(program.programCurrency[1].id)

    expect(result[2].requesterId).toEqual(approver.id)
    expect(result[2].programId).toEqual(msigProgram.id)
    expect(result[2].userWalletId).toEqual(user2.wallets[0].id)
    expect(result[2].userWalletAddress).toEqual(user2.wallets[0].address)
    expect(result[2].receiverId).toEqual(user2.user.id)
    expect(result[2].status).toEqual(SUBMITTED_BY_APPROVER_STATUS)
    expect(result[2].currencyUnitId).toEqual(msigProgram.programCurrency[1].id)
    expect(result[2].vestingMonths).toEqual(result[2].vestingMonths)
    expect(result[2].vestingStartEpoch).toEqual(result[2].vestingStartEpoch)

    expect(encryptSpy).toBeCalledWith('100')
    expect(encryptSpy).toBeCalledWith('200')
    expect(encryptSpy).toBeCalledWith('210')
    expect(encryptPIISpy).toBeCalledWith('Team One')
    expect(encryptPIISpy).toBeCalledWith('Team Two')
    expect(encryptPIISpy).toBeCalledWith('Team Three')
  })

  it('should throw if approver is not on target program', async () => {
    const requests = [
      {
        programId: program.id,
      },
    ]

    await expect(buildTransferRequestData(requests, user1.user.id, approverRole.id)).rejects.toHaveProperty('status', 400)
  })

  it('should throw if promise is rejected', async () => {
    const requests = [
      {
        programId: program.id,
        receiver: {
          id: 0,
        },
      },
    ]

    mockMoveFileS3.mockResolvedValueOnce({
      data: { key: `${Date.now().toString()}${user1.user.id}` },
    })

    await expect(buildTransferRequestData(requests, approver.id, approverRole.id)).rejects.toHaveProperty('status', 400)
  })

  it('should throw if promise vesting validation fails', async () => {
    const requestOne = [
      {
        programId: program.id,
        wallet: user1.wallets[0],
        temporaryFileId: temporaryFile.publicId,
        receiver: user1.user,
        team: 'Team One',
        amount: '100',
        currencyUnitId: program.programCurrency[1].id,
        vestingMonths: 10,
        vestingStartEpoch: 2000,
      },
    ]

    const requestTwo = [
      {
        programId: msigProgram.id,
        wallet: user2.wallets[0],
        temporaryFileId: temporaryFile.publicId,
        receiver: user2.user,
        team: 'Team Two',
        amount: '200',
        currencyUnitId: msigProgram.programCurrency[1].id,
        vestingMonths: 4000,
        vestingStartEpoch: 2000,
      },
    ]

    mockMoveFileS3.mockResolvedValueOnce({
      data: { key: `${Date.now().toString()}${user1.user.id}` },
    })

    await expect(buildTransferRequestData(requestOne, approver.id, approverRole.id)).rejects.toHaveProperty('status', 400)

    await expect(buildTransferRequestData(requestTwo, approver.id, approverRole.id)).rejects.toHaveProperty('status', 400)
  })
})
