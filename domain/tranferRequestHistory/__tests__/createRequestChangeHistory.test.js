import * as Big from 'big.js'
import * as createRequestHistoryModule from 'domain/tranferRequestHistory/createRequestChangeHistory'
import * as objectComparer from 'lib/objectComparer'

jest.mock('lib/objectComparer')
jest.mock('big.js')

const mockEncrypt = jest.fn()
jest.mock('lib/emissaryCrypto', () => ({
  encrypt: params => mockEncrypt(params),
  encryptPII: params => mockEncrypt(params),
}))

beforeEach(() => {
  mockEncrypt.mockReset()
})

describe('createRequestChangeHistory', () => {
  it('should return undefined when there are no changes', async () => {
    objectComparer.compareObjects.mockReturnValue([])

    const history = await createRequestHistoryModule.createRequestChangeHistory(
      {},
      {
        newValue: 1,
        oldValue: 2,
        transferRequestId: 3,
        userRoleId: 4,
      }
    )

    expect(history).toBeUndefined()
    expect(objectComparer.compareObjects).toBeCalledWith({
      newValue: 1,
      oldValue: 2,
      filterFn: createRequestHistoryModule.getFilteredObject,
    })
  })

  it('should encrypt values when fields contain sensitive data', async () => {
    objectComparer.compareObjects.mockReturnValue([
      {
        field: 'amount',
        oldValue: 10,
        newValue: 20,
      },
      {
        field: 'team',
        oldValue: 'old_team',
        newValue: 'new_team',
      },
    ])

    mockEncrypt.mockImplementation(value => {
      switch (value) {
        case 'old_team':
          return 'old_team_encrypted'
        case 'new_team':
          return 'new_team_encrypted'
        case 10:
          return 'old_amount_encrypted'
        case 20:
          return 'new_amount_encrypted'
        default:
          throw new Error(`encryption shouldn't be called with '${value}'`)
      }
    })

    const createMany = jest.fn().mockImplementation(() => true)

    const prisma = {
      transferRequestHistory: {
        createMany: params => createMany(params),
      },
    }

    const history = await createRequestHistoryModule.createRequestChangeHistory(prisma, {
      newValue: 1,
      oldValue: 2,
      transferRequestId: 3,
      userRoleId: 4,
    })

    expect(history).toEqual(true)
    expect(createMany.mock.calls[0][0].data).toEqual(
      expect.arrayContaining([
        {
          field: 'team',
          oldValue: 'old_team_encrypted',
          newValue: 'new_team_encrypted',
          userRoleId: 4,
          transferRequestId: 3,
        },
        {
          field: 'amount',
          oldValue: 'old_amount_encrypted',
          newValue: 'new_amount_encrypted',
          userRoleId: 4,
          transferRequestId: 3,
        },
      ])
    )
  })

  it('should not encrypt values when fields do not sensitive data', async () => {
    objectComparer.compareObjects.mockReturnValue([
      {
        field: 'not_sensitive',
        oldValue: 10,
        newValue: 20,
      },
    ])

    const createMany = jest.fn().mockImplementation(() => true)

    const prisma = {
      transferRequestHistory: {
        createMany: params => createMany(params),
      },
    }

    const history = await createRequestHistoryModule.createRequestChangeHistory(prisma, {
      newValue: 1,
      oldValue: 2,
      transferRequestId: 3,
      userRoleId: 4,
    })

    expect(history).toEqual(true)
    expect(mockEncrypt).not.toBeCalled()
    expect(createMany.mock.calls[0][0].data).toEqual(
      expect.arrayContaining([
        {
          field: 'not_sensitive',
          oldValue: 10,
          newValue: 20,
          userRoleId: 4,
          transferRequestId: 3,
        },
      ])
    )
  })

  describe('getFilteredObject', () => {
    it('should remove request fields', () => {
      const request = {
        createdAt: '',
        updatedAt: '',
        notifications: '',
        transfers: '',
        history: '',
        reviews: '',
        currencyUnitId: '',
        expectedTransferDate: '',
        amount: 10,
        id: 20,
      }

      const filteredObject = createRequestHistoryModule.getFilteredObject(request)

      expect(filteredObject.id).toEqual(20)
      expect(filteredObject).toBeDefined()
      expect(filteredObject.createdAt).toBeUndefined()
      expect(filteredObject.updatedAt).toBeUndefined()
      expect(filteredObject.notifications).toBeUndefined()
      expect(filteredObject.transfers).toBeUndefined()
      expect(filteredObject.history).toBeUndefined()
      expect(filteredObject.reviews).toBeUndefined()
      expect(filteredObject.currencyUnitId).toBeUndefined()
      expect(filteredObject.expectedTransferDate).toBeUndefined()
    })

    it('should limit amount decimal fields', () => {
      const toFixed = jest.fn().mockReturnValue(25)
      Big.default.mockReturnValue({
        toFixed,
      })

      const filteredObject = createRequestHistoryModule.getFilteredObject({
        amount: 10.000001,
      })

      expect(filteredObject.amount).toEqual(25)
      expect(toFixed).toBeCalledWith(2)
      expect(Big.default).toBeCalledWith(10.000001)
    })
  })
})
