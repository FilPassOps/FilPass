import { createTransferRequestDraft } from '../createTransferRequestDraft'

const mockPrismaTransaction = jest.fn()
const mockUser = jest.fn()
const mockUserRoleProgram = jest.fn()
const mockTransferRequestDraft = jest.fn()
const mockGetPrismaClient = jest.fn().mockImplementation(() => {
  return {
    user: mockUser(),
    userRoleProgram: mockUserRoleProgram(),
    transferRequestDraft: mockTransferRequestDraft(),
  }
})
jest.mock('lib/prisma', () => ({
  getPrismaClient: () => mockGetPrismaClient(),
  newPrismaTransaction: fn => mockPrismaTransaction(fn),
}))

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))

const mockValidator = jest.fn()
jest.mock('domain/transferRequestDraft/validation', () => ({
  createTransferRequestDraftValidator: () => mockValidator(),
  sendRejectNotificationValidator: () => mockValidator(),
}))

const mockEncrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  encrypt: field => mockEncrypt(field),
  encryptPII: field => mockEncrypt(field),
}))

const mockCreatedDraftNotification = jest.fn()
jest.mock('domain/notifications/sendCreatedDraftNotification', () => ({
  sendCreatedDraftNotification: params => mockCreatedDraftNotification(params),
}))

beforeEach(() => {
  mockValidate.mockReset()
  mockPrismaTransaction.mockReset()
  mockEncrypt.mockReset()
})

describe('createTransferRequestDraft', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((validator, params) => {
      expect(params).toEqual({})

      return {
        errors: {
          test: 'test',
        },
      }
    })

    const expectedError = {
      status: 400,
      errors: {
        test: 'test',
      },
    }

    const { data, error } = await createTransferRequestDraft({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockGetPrismaClient).not.toBeCalled()
  })

  it('should return error when user creation throws error', async () => {
    mockValidate.mockImplementation((validator, params) => {
      return { fields: params }
    })

    mockEncrypt.mockImplementationOnce(params => {
      expect(params).toEqual('user_x@email.com')
      return 'Encrypted email'
    })

    mockUser.mockImplementation(() => ({
      findMany: () => {
        return [{ id: 1, publicId: 1234, email: 'email@email.com' }]
      },
      create: () => {
        throw 'Somenting whent wrong'
      },
    }))

    mockPrismaTransaction.mockImplementation(async fn => {
      let error
      try {
        await fn(mockGetPrismaClient())
      } catch ({ message, status }) {
        error = { message, status }
      }
      expect(error.message).toEqual('Error while creating users')
      expect(error.status).toEqual(400)
      return { error }
    })

    const data = {
      requests: [
        {
          amount: 2,
          currencyUnitId: 1,
          programId: 5,
          receiverEmail: 'user_x@email.com',
          team: 'team teste',
        },
      ],
      requesterId: 1,
    }

    const { error } = await createTransferRequestDraft(data)

    expect(error).toEqual({ message: 'Error while creating users', status: 400 })
    expect(mockCreatedDraftNotification).not.toBeCalled()
  })

  // it('should return error when program is not found', async () => {
  //   mockValidate.mockImplementation((validator, params) => {
  //     return { fields: params }
  //   })

  //   mockEncrypt.mockImplementationOnce((params) => {
  //     expect(params).toEqual('user_x@email.com')
  //     return 'Encrypted email'
  //   })

  //   mockUser.mockImplementation(() => ({
  //     findMany: ({ where }) => {
  //       expect(where.isActive).toEqual(true)

  //       return [{ id: 1, publicId: 1234, email: 'email@email.com' }]
  //     },
  //     create: () => {
  //       return { id: 2, publicId: 1346, email: 'user_x@email.com' }
  //     },
  //   }))

  //   mockUserRoleProgram.mockImplementation(() => ({
  //     findMany: ({ where }) => {
  //       expect(where.programId).toEqual(5)
  //       expect(where.userRoleId).toEqual(1)

  //       return []
  //     },
  //   }))

  //   mockPrismaTransaction.mockImplementation(async (fn) => {
  //     let error
  //     try {
  //       return await fn(mockGetPrismaClient())
  //     } catch (err) {
  //       error = err
  //       return { error }
  //     }
  //   })

  //   const data = {
  //     requests: [
  //       {
  //         amount: 2,
  //         currencyUnitId: 1,
  //         programId: 5,
  //         receiverEmail: 'user_x@email.com',
  //         team: 'team teste',
  //       },
  //     ],
  //     requesterId: 1,
  //     approverRoleId: 1,
  //   }

  //   const response = await createTransferRequestDraft(data)

  //   const expectedError = { error: { message: 'Program not found' } }
  //   expect(response).toEqual(expect.arrayContaining([expectedError]))
  //   expect(mockCreatedDraftNotification).not.toBeCalled()
  // })

  // it('should return error when notification fails', async () => {
  //   mockValidate.mockImplementation((validator, params) => {
  //     return { fields: params }
  //   })

  //   mockEncrypt.mockImplementation(() => {
  //     return 'Encrypted value'
  //   })

  //   mockUser.mockImplementation(() => ({
  //     findMany: () => {
  //       return [{ id: 1, publicId: 1234, email: 'email@email.com' }]
  //     },
  //     create: () => {
  //       return { id: 2, publicId: 1346, email: 'user_x@email.com' }
  //     },
  //   }))

  //   mockUserRoleProgram.mockImplementation(() => ({
  //     findMany: () => {
  //       return [{ id: 1 }]
  //     },
  //   }))

  //   mockTransferRequestDraft.mockImplementation(() => ({
  //     create: ({ data, include }) => {
  //       expect(data.requesterId).toEqual(1)
  //       expect(data.receiverId).toEqual(2)
  //       expect(data.currencyUnitId).toEqual(1)
  //       expect(data.programId).toEqual(5)
  //       expect(data.amount).toEqual('Encrypted value')
  //       expect(data.team).toEqual('Encrypted value')
  //       expect(include.program.select).toEqual({
  //         programCurrency: {
  //           select: {
  //             currency: {
  //               select: {
  //                 name: true,
  //               },
  //             },
  //             type: true,
  //           },
  //         },
  //       })

  //       return {
  //         id: 1,
  //         publicId: 5535,
  //         amount: 2,
  //         currencyUnitId: 1,
  //         programId: 5,
  //         receiverEmail: 'user_x@email.com',
  //         team: 'team teste',
  //       }
  //     },
  //   }))

  //   mockPrismaTransaction.mockImplementation(async (fn) => {
  //     let error
  //     try {
  //       return await fn(mockGetPrismaClient())
  //     } catch (err) {
  //       error = err
  //       return { error }
  //     }
  //   })

  //   mockCreatedDraftNotification.mockImplementation(() => ({
  //     error: { message: 'Something went wrong' },
  //   }))

  //   const data = {
  //     requests: [
  //       {
  //         amount: 2,
  //         currencyUnitId: 1,
  //         programId: 5,
  //         receiverEmail: 'user_x@email.com',
  //         team: 'team teste',
  //       },
  //     ],
  //     requesterId: 1,
  //   }

  //   const response = await createTransferRequestDraft(data)

  //   const expectedError = { error: { message: 'Error creating transfer request draft' } }
  //   expect(response).toEqual(expect.arrayContaining([expectedError]))
  // })

  // it('should return create transfer request draft', async () => {
  //   mockValidate.mockImplementation((validator, params) => {
  //     return { fields: params }
  //   })

  //   mockEncrypt.mockImplementation(() => {
  //     return 'Encrypted value'
  //   })

  //   mockUser.mockImplementation(() => ({
  //     findMany: () => {
  //       return [{ id: 1, publicId: 1234, email: 'email@email.com' }]
  //     },
  //     create: () => {
  //       return { id: 2, publicId: 1346, email: 'user_x@email.com' }
  //     },
  //   }))

  //   mockUserRoleProgram.mockImplementation(() => ({
  //     findMany: () => {
  //       return [{ id: 1 }]
  //     },
  //   }))

  //   mockTransferRequestDraft.mockImplementation(() => ({
  //     create: () => {
  //       return {
  //         id: 1,
  //         publicId: 5535,
  //         amount: 2,
  //         currencyUnitId: 1,
  //         programId: 5,
  //         receiverEmail: 'user_x@email.com',
  //         team: 'team teste',
  //         program: { programCurrency: [{ currency: { name: 'USD' }, type: 'PAYMENT' }] },
  //       }
  //     },
  //   }))

  //   mockPrismaTransaction.mockImplementation(async (fn) => {
  //     let error
  //     try {
  //       return await fn(mockGetPrismaClient())
  //     } catch (err) {
  //       error = err
  //       return { error }
  //     }
  //   })

  //   mockCreatedDraftNotification.mockImplementation((data) => {
  //     expect(data.hasAccount).toEqual(true)
  //     expect(data.email).toEqual('user_x@email.com')
  //     expect(data.transferRequestId).toEqual(5535)
  //     expect(data.amount).toEqual(2)
  //     expect(data.currencySymbol).toEqual('USD')
  //     return { success: true }
  //   })

  //   const data = {
  //     requests: [
  //       {
  //         amount: 2,
  //         currencyUnitId: 1,
  //         programId: 5,
  //         receiverEmail: 'user_x@email.com',
  //         team: 'team teste',
  //       },
  //     ],
  //     requesterId: 1,
  //   }

  //   const response = await createTransferRequestDraft(data)

  //   const expectedResponse = {
  //     data: {
  //       id: 1,
  //       publicId: 5535,
  //       amount: 2,
  //       currencyUnitId: 1,
  //       programId: 5,
  //       receiverEmail: 'user_x@email.com',
  //       team: 'team teste',
  //       program: { programCurrency: [{ currency: { name: 'USD' }, type: 'PAYMENT' }] },
  //     },
  //   }
  //   expect(response).toEqual(expect.arrayContaining([expectedResponse]))
  // })
})
