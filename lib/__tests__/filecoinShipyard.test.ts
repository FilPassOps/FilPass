import { getMasterWallet } from 'lib/filecoin'
import * as shipyard from 'lib/filecoinShipyard'

describe('filecoin shipyard', () => {
  describe('gas estimate message gas', () => {
    it(
      'should estimate gas',
      async () => {
        const masterWallet = getMasterWallet()

        const message = {
          Version: 0,
          To: masterWallet.address,
          From: masterWallet.address,
          Nonce: 0,
          Value: '0',
          GasLimit: 0,
          GasFeeCap: '0',
          GasPremium: '0',
          Method: 0,
          Params: '',
        }

        const gas = await shipyard.gasEstimateMessageGas(message)

        expect(gas.GasLimit).toBeDefined()
        expect(gas.GasFeeCap).toBeDefined()
        expect(gas.GasPremium).toBeDefined()
      },
      10 * 1000
    )

    it(
      'should throw error',
      async () => {
        const message = {
          Version: 0,
          To: '',
          From: '',
          Nonce: 0,
          Value: '0',
          GasLimit: 0,
          GasFeeCap: '0',
          GasPremium: '0',
          Method: 0,
          Params: '',
        }

        await expect(shipyard.gasEstimateMessageGas(message)).rejects.toThrowError()
      },
      10 * 1000
    )
  })
})
