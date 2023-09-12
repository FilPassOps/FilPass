import { JsonRpcProvider } from '@ethersproject/providers'
import filecoinAddress from '@glif/filecoin-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'
import { MultiForwarder } from 'typechain-types'
import {
  DEFAULT_TIMEOUT,
  PADDED_WALLET_SIZE,
  TEST_ADDRESS_T0,
  TEST_ADDRESS_T1,
  TEST_ADDRESS_T2,
  TEST_ADDRESS_T3,
  TEST_ADDRESS_T4,
  UNIQUE_ID,
  getBalance,
  getContract,
  getPaddedAddress,
  getProvider,
} from './utils'

describe('MultiForwarder', function () {
  let multiForwarder: MultiForwarder
  let provider: JsonRpcProvider

  before(async () => {
    multiForwarder = await getContract()
    provider = getProvider()
  })

  describe('Forward', function () {
    describe('Forward method tests', function () {
      it('Should forward to a single address', async function () {
        const receiver = TEST_ADDRESS_T1
        const balance = await getBalance(receiver, provider)

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.01')

        const paddedAddress = getPaddedAddress(receiver)
        const addresses = [paddedAddress]
        const amounts = [value]

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.emit(multiForwarder, 'Forward')

        const newBalance = await getBalance(receiver, provider)
        expect(newBalance).to.equal(balance.add(value))
      }).timeout(DEFAULT_TIMEOUT)

      it('Should forward to multiple addresses with different amounts', async function () {
        const receiver1 = TEST_ADDRESS_T1
        const receiver2 = TEST_ADDRESS_T2
        const receiver3 = TEST_ADDRESS_T4
        const balance1 = await getBalance(receiver1, provider)
        const balance2 = await getBalance(receiver2, provider)
        const balance3 = await getBalance(receiver3, provider)

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.1')

        const t1Padded = getPaddedAddress(receiver1)
        const t2Padded = getPaddedAddress(receiver2)
        const t4Padded = getPaddedAddress(receiver3)

        const t1Addresses = Array.from({ length: 1 }, () => t1Padded)
        const t2Addresses = Array.from({ length: 1 }, () => t2Padded)
        const t4Addresses = Array.from({ length: 8 }, () => t4Padded)
        const values = Array.from({ length: 10 }, () => value)

        await expect(
          multiForwarder.forward(UNIQUE_ID, [...t1Addresses, ...t2Addresses, ...t4Addresses], values, {
            value: total,
          }),
        ).to.emit(multiForwarder, 'Forward')

        const newBalance1 = await getBalance(receiver1, provider)
        const newBalance2 = await getBalance(receiver2, provider)
        const newBalance3 = await getBalance(receiver3, provider)

        expect(newBalance1).to.equal(balance1.add(value))
        expect(newBalance2).to.equal(balance2.add(value))
        expect(newBalance3).to.equal(balance3.add(ethers.utils.parseEther('0.08')))
      }).timeout(DEFAULT_TIMEOUT)

      it('Should reject if addresses and amounts are empty', async function () {
        const total = ethers.utils.parseEther('0')
        const addresses: Uint8Array[] = []
        const amounts: string[] = []

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses and amounts must not be empty',
        )
      })

      it('Should reject if addresses and amounts are not the same length', async function () {
        const receiver = TEST_ADDRESS_T1

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.01')
        const paddedAddress = getPaddedAddress(receiver)

        const addresses = [paddedAddress]
        const amounts = [value, value]

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses and amounts must be the same length',
        )
      })

      it('Should reject if addresses are more than 100', async function () {
        const receiver = TEST_ADDRESS_T1

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('1.01')
        const paddedAddress = getPaddedAddress(receiver)

        const addresses = Array.from({ length: 101 }, () => paddedAddress)
        const amounts = Array.from({ length: 101 }, () => value)

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses must not be more than 100',
        )
      })

      it('Should reject if the total value is not equal to the sum of the amounts', async function () {
        const receiver = TEST_ADDRESS_T1

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.10')
        const paddedAddress = getPaddedAddress(receiver)

        const addresses = [paddedAddress, paddedAddress]
        const amounts = [value, value]

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'msg.value must be equal to the sum of all amounts',
        )
      })

      it('Should reject if the address is invalid', async function () {
        const invalidReceiver = '0x1234567890123456789012345678901234567890123456789012345678901234'

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.01')

        const addresses = [ethers.utils.hexZeroPad(invalidReceiver, PADDED_WALLET_SIZE)]
        const amounts = [value]

        await expect(multiForwarder.forward(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'address must be Secp256k1, Actor or Delegated',
        )
      })
    })

    describe('ForwardAny method tests', function () {
      it('Should forward to a single address', async function () {
        const receiver = TEST_ADDRESS_T3
        const balance = await getBalance(receiver, provider)

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.01')

        const address = filecoinAddress.newFromString(receiver).bytes
        const addresses = [address]
        const amounts = [value]

        await expect(
          multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, {
            value: total,
          }),
        ).to.emit(multiForwarder, 'ForwardAny')

        const newBalance = await getBalance(receiver, provider)
        expect(newBalance).to.equal(balance.add(value))
      }).timeout(DEFAULT_TIMEOUT)

      it('Should forward to multiple addresses with different amounts', async function () {
        const receiver0 = TEST_ADDRESS_T0
        const receiver1 = TEST_ADDRESS_T1
        const receiver2 = TEST_ADDRESS_T2
        const receiver3 = TEST_ADDRESS_T3
        const receiver4 = TEST_ADDRESS_T4

        const balance0 = await getBalance(receiver0, provider)
        const balance1 = await getBalance(receiver1, provider)
        const balance2 = await getBalance(receiver2, provider)
        const balance3 = await getBalance(receiver3, provider)
        const balance4 = await getBalance(receiver4, provider)

        const value0 = ethers.utils.parseEther('0.1')
        const value1 = ethers.utils.parseEther('0.2')
        const value2 = ethers.utils.parseEther('0.3')
        const value3 = ethers.utils.parseEther('0.1')
        const value4 = ethers.utils.parseEther('0.2')
        const total = ethers.utils.parseEther('0.9')

        const t0Address = filecoinAddress.newFromString(receiver0).bytes
        const t1Address = filecoinAddress.newFromString(receiver1).bytes
        const t2Address = filecoinAddress.newFromString(receiver2).bytes
        const t3Address = filecoinAddress.newFromString(receiver3).bytes
        const t4Address = filecoinAddress.newFromString(receiver4).bytes
        const addresses = [t0Address, t1Address, t2Address, t3Address, t4Address]
        const amounts = [value0, value1, value2, value3, value4]

        await expect(multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, { value: total })).to.emit(multiForwarder, 'ForwardAny')

        const newBalance0 = await getBalance(receiver0, provider)
        const newBalance1 = await getBalance(receiver1, provider)
        const newBalance2 = await getBalance(receiver2, provider)
        const newBalance3 = await getBalance(receiver3, provider)
        const newBalance4 = await getBalance(receiver4, provider)

        expect(newBalance0).to.equal(balance0.add(value0))
        expect(newBalance1).to.equal(balance1.add(value1))
        expect(newBalance2).to.equal(balance2.add(value2))
        expect(newBalance3).to.equal(balance3.add(value3))
        expect(newBalance4).to.equal(balance4.add(value4))
      }).timeout(DEFAULT_TIMEOUT)

      it('Should reject if addresses and amounts are empty', async function () {
        const total = ethers.utils.parseEther('0')
        const addresses: Uint8Array[] = []
        const amounts: string[] = []

        await expect(multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses and amounts must not be empty',
        )
      })

      it('Should reject if addresses and amounts are not the same length', async function () {
        const receiver = TEST_ADDRESS_T3

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.01')
        const address = filecoinAddress.newFromString(receiver).bytes

        const addresses = [address]
        const amounts = [value, value]

        await expect(multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses and amounts must be the same length',
        )
      })

      it('Should reject if addresses are more than 45', async function () {
        const receiver = TEST_ADDRESS_T3

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.46')

        const address = filecoinAddress.newFromString(receiver).bytes
        const addresses = Array.from({ length: 46 }, () => address)
        const amounts = Array.from({ length: 46 }, () => value)

        await expect(multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'addresses must not be more than 45',
        )
      })

      it('Should reject if the total value is not equal to the sum of the amounts', async function () {
        const receiver = TEST_ADDRESS_T3

        const value = ethers.utils.parseEther('0.01')
        const total = ethers.utils.parseEther('0.10')

        const address = filecoinAddress.newFromString(receiver).bytes
        const addresses = [address, address]
        const amounts = [value, value]

        await expect(multiForwarder.forwardAny(UNIQUE_ID, addresses, amounts, { value: total })).to.be.rejectedWith(
          'msg.value must be equal to the sum of all amounts',
        )
      })
    })
  })
})
