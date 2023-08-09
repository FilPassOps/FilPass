import { createForOthers } from '../createForOthers'

const mockCreateTransferRequestDraft = jest.fn()
jest.mock('domain/transferRequestDraft/createTransferRequestDraft', () => ({
  createTransferRequestDraft: (params: any) => mockCreateTransferRequestDraft(params),
}))

const mockBatchCreateTransferRequest = jest.fn()
jest.mock('domain/transferRequest/batchCreateTransferRequest', () => ({
  batchCreateTransferRequest: (params: any) => mockBatchCreateTransferRequest(params),
}))

describe('createForOthers', () => {
  it('should call createTransferRequestDraft or batchCreateTransferRequest based on receiverShouldReview param', async () => {
    const params = {
      receiverShouldReview: false,
      requests: [
        {
          wallet: 'abcd',
          receiverEmail: 'abcd@email.com',
          row: 1,
        },
        {
          wallet: 'abcd',
          receiverEmail: 'abcd@email.com',
          row: 2,
        },
      ],
      requesterId: 10,
      approverRoleId: 20,
      approver: { email: 'approver@email.com' },
    }

    await createForOthers(params)

    expect(mockBatchCreateTransferRequest).toBeCalledWith({
      requests: params.requests,
      requesterId: params.requesterId,
      approverRoleId: params.approverRoleId,
      isBatchCsv: false,
    })

    params.receiverShouldReview = true

    await createForOthers(params)

    expect(mockCreateTransferRequestDraft).toBeCalledWith({
      requests: params.requests,
      requesterId: params.requesterId,
      approverRoleId: params.approverRoleId,
    })
  })

  it('should not call createTransferRequestDraft or batchCreateTransferRequest if approver email is on the payload', async () => {
    const params = {
      receiverShouldReview: false,
      requests: [
        {
          wallet: 'abcd',
          receiverEmail: 'abcd@email.com',
          row: 1,
        },
        {
          wallet: 'abcd',
          receiverEmail: 'approver@email.com',
          row: 2,
        },
      ],
      requesterId: 10,
      approverRoleId: 20,
      approver: { email: 'approver@email.com' },
    }

    await createForOthers(params)

    expect(mockBatchCreateTransferRequest).not.toBeCalled()

    params.receiverShouldReview = true

    await createForOthers(params)

    expect(mockCreateTransferRequestDraft).not.toBeCalled()
  })
})
