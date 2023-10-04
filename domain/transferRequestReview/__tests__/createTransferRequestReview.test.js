import {
  APPROVED_STATUS,
  REJECTED_BY_APPROVER_STATUS,
  REQUIRES_CHANGES_STATUS,
} from 'domain/transferRequest/constants'
import { createTransferRequestReview } from '../createTransferRequestReview'

const mockValidate = jest.fn()
jest.mock('lib/yup', () => ({
  validate: (validator, params) => mockValidate(validator, params),
}))
const mockValidator = jest.fn()
jest.mock('domain/transferRequestReview/validation', () => ({
  createTransferRequestReviewValidator: () => mockValidator(),
}))
jest.mock('domain/notifications/validation', () => ({
  sendRejectNotificationValidator: () => {},
}))

const mockApproveTransferRequest = jest.fn()
jest.mock('domain/transferRequestReview/approveTransferRequest', () => ({
  approveTransferRequest: (params) => mockApproveTransferRequest(params),
}))
const mockRejectTransferRequest = jest.fn()
jest.mock('domain/transferRequestReview/rejectTransferRequest', () => ({
  rejectTransferRequest: (params) => mockRejectTransferRequest(params),
}))
const mockRequireChangeTransferRequest = jest.fn()
jest.mock('domain/transferRequestReview/requireChangeTransferRequest', () => ({
  requireChangeTransferRequest: (params) => mockRequireChangeTransferRequest(params),
}))

beforeEach(() => {
  mockValidate.mockReset()
})

describe('createTransferRequestReview', () => {
  it('should return error when validation fails', async () => {
    mockValidate.mockImplementation((_, params) => {
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

    const { data, error } = await createTransferRequestReview({})
    expect(data).toBeUndefined()
    expect(error).toEqual(expectedError)
    expect(mockApproveTransferRequest).not.toBeCalled()
    expect(mockRejectTransferRequest).not.toBeCalled()
    expect(mockRequireChangeTransferRequest).not.toBeCalled()
  })

  it('should call approveTransferRequest if the status is APPROVED', async () => {
    mockValidate.mockImplementation((_, params) => {
      expect(params).toEqual({
        transferRequestId: 10,
        approverId: 1,
        status: APPROVED_STATUS,
      })
      return { fields: { transferRequestId: 10, approverId: 1, status: APPROVED_STATUS } }
    })

    mockApproveTransferRequest.mockImplementation(() => {
      return { data: {} }
    })

    const { data, error } = await createTransferRequestReview({
      transferRequestId: 10,
      approverId: 1,
      status: APPROVED_STATUS,
    })

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockApproveTransferRequest).toBeCalledWith({
      transferRequestId: 10,
      approverId: 1,
    })
  })

  it('should call rejectTransferRequest if the status is REJECTED_BY_APPROVER', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockRejectTransferRequest.mockImplementation(() => {
      return { data: {} }
    })

    const { data, error } = await createTransferRequestReview({
      transferRequestId: 10,
      approverId: 1,
      status: REJECTED_BY_APPROVER_STATUS,
      notes: 'testing',
    })

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockRejectTransferRequest).toBeCalledWith({
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
  })

  it('should call requireChangeTransferRequest if the status is REQUIRES_CHANGES', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    mockRequireChangeTransferRequest.mockImplementation(() => {
      return { data: {} }
    })

    const { data, error } = await createTransferRequestReview({
      transferRequestId: 10,
      approverId: 1,
      status: REQUIRES_CHANGES_STATUS,
      notes: 'testing',
    })

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(mockRequireChangeTransferRequest).toBeCalledWith({
      transferRequestId: 10,
      approverId: 1,
      notes: 'testing',
    })
  })

  it('should return error if the status is not valid', async () => {
    mockValidate.mockImplementation((_, params) => {
      return { fields: params }
    })

    const { data, error } = await createTransferRequestReview({
      transferRequestId: 10,
      approverId: 1,
      status: 'TESTING',
      notes: 'testing',
    })

    expect(data).toBeUndefined()
    expect(error.message).toEqual('Status is not supported.')
    expect(mockApproveTransferRequest).not.toBeCalled()
    expect(mockRejectTransferRequest).not.toBeCalled()
    expect(mockRequireChangeTransferRequest).not.toBeCalled()
  })
})
