import { shortenAddress } from '../shortenAddress'

describe('shortenAddress', () => {
  it('should return shorten wallet address', () => {
    const fullAddress = 'f1q4dihorm6cgudww7xtmvqr7cn7os7mp72yjnwha'
    const address = shortenAddress(fullAddress)

    expect(address).not.toEqual(fullAddress)
    expect(address).toEqual('f1q4di...yjnwha')
  })
})
