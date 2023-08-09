import { clearDatabase, createController, createUser, createWallet } from 'test/helpers'
import { setDefault } from '../setDefault'

const mockVerify = jest.fn()
jest.mock('jsonwebtoken', () => ({
  verify: (token: string, salt: string) => mockVerify(token, salt),
}))

beforeAll(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await clearDatabase()
})

describe('setDefault', () => {
  it('Should set the new wallet as default', async () => {
    const defaultUser = await createUser('user@email.com')
    const newWallet = await createWallet(defaultUser.user.id, 'f1q4dihorm6cgudww7xtmvqr7cn7os7mp72yjnwha')

    mockVerify.mockImplementation((token, salt) => {
      expect(token).toEqual('abc123')
      expect(salt).toEqual(process.env.APP_SECRET)

      return {
        newDefaultWallet: newWallet,
      }
    })

    const { data } = await setDefault({ token: 'abc123' })
    const expectedData = { success: true }

    expect(data).toEqual(expectedData)
  })

  it('Should not log change, if no previous default wallet', async () => {
    const [controller] = await createController()
    const newWallet = await createWallet(controller.id, 'f1q4dihorm6cgudww7xtmvqr7cn7os7mp72yjnwha')

    mockVerify.mockImplementation((token, salt) => {
      expect(token).toEqual('abc123')
      expect(salt).toEqual(process.env.APP_SECRET)

      return {
        newDefaultWallet: newWallet,
      }
    })

    const { data } = await setDefault({ token: 'abc123' })
    const expectedData = { success: true }

    expect(data).toEqual(expectedData)
  })
})
