import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { FilecoinDepositWithdrawRefund } from 'typechain-types'
import { anyUint } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { BigNumber } from 'ethers'

// Add this interface to match the DecodedToken struct in the contract
interface DecodedToken {
  iss: string
  jti: string
  exp: number
  iat: number
  ticket_type: string
  ticket_version: string
  funder: string
  sub: string
  aud: string
  ticket_lane: number
  lane_total_amount: BigNumber
  lane_guaranteed_amount: BigNumber
  lane_guaranteed_until: number
}

// Add this utility function to create DecodedToken objects
function createDecodedToken(
  funder: string,
  oracle: string,
  recipient: string,
  amount: BigNumber,
  expirationDays: number = 7,
): DecodedToken {
  const now = Math.floor(Date.now() / 1000)
  return {
    iss: 'https://example.com/.well-known/jwks.json',
    jti: ethers.utils.id(Date.now().toString()), // Generate a unique identifier
    exp: now + 3600, // 1 hour from now
    iat: now,
    ticket_type: 'filpass',
    ticket_version: '1',
    funder: funder,
    sub: oracle,
    aud: recipient,
    ticket_lane: 0,
    lane_total_amount: amount,
    lane_guaranteed_amount: amount,
    lane_guaranteed_until: now + expirationDays * 24 * 60 * 60,
  }
}

describe('FilecoinDepositWithdrawRefund', function () {
  async function deployContractFixture() {
    const [user, oracle1, oracle2, recipient1, recipient2] = await ethers.getSigners()

    const filpass = (await ethers.deployContract('FilecoinDepositWithdrawRefund')) as FilecoinDepositWithdrawRefund

    return { filpass, user, oracle1, oracle2, recipient1, recipient2 }
  }

  describe('Deployment', function () {
    it('Should set the right user', async function () {
      const { filpass, user } = await loadFixture(deployContractFixture)
      expect(await filpass.user()).to.equal(user.address)
    })
  })

  describe('Deposits', function () {
    it('Should allow user to deposit FIL', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await expect(filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount }))
        .to.emit(filpass, 'DepositMade')
        .withArgs(oracle1.address, recipient1.address, depositAmount, anyUint)

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.amount).to.equal(depositAmount)
    })

    it('Should extend refund time for first deposit', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      const expectedRefundTime = (await ethers.provider.getBlock('latest')).timestamp + (lockUpTime + 1) * 24 * 60 * 60
      expect(deposit.refundTime).to.be.closeTo(expectedRefundTime, 5) // Allow 5 seconds deviation
    })

    it('Should revert if non-user tries to deposit', async function () {
      const { filpass, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await expect(
        filpass.connect(oracle1).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount }),
      ).to.be.revertedWithCustomError(filpass, 'OnlyUserAllowed')
    })

    it('Should revert when attempting to deposit zero amount', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('0')
      const lockUpTime = 7

      await expect(
        filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount }),
      ).to.be.revertedWithCustomError(filpass, 'InsufficientDepositAmount')
    })

    it('Should revert when attempting to deposit with zero lock-up time', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 0

      await expect(
        filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount }),
      ).to.be.revertedWithCustomError(filpass, 'InvalidLockupTime')
    })

    it('Should correctly handle multiple deposits for the same Oracle-Recipient pair', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount1 = ethers.utils.parseEther('1')
      const depositAmount2 = ethers.utils.parseEther('2')
      const lockUpTime1 = 7
      const lockUpTime2 = 14

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime1, { value: depositAmount1 })
      const deposit1 = await filpass.deposits(oracle1.address, recipient1.address)
      const refundTime1 = deposit1.refundTime

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime2, { value: depositAmount2 })
      const deposit2 = await filpass.deposits(oracle1.address, recipient1.address)

      expect(deposit2.amount).to.equal(depositAmount1.add(depositAmount2))

      // Check refund time (should be the later of the two)
      expect(deposit2.refundTime).to.be.gt(refundTime1)
      const expectedRefundTime2 = (await ethers.provider.getBlock('latest')).timestamp + lockUpTime2 * 24 * 60 * 60
      expect(deposit2.refundTime).to.be.closeTo(expectedRefundTime2, 5) // Allow 5 seconds deviation
    })
  })

  describe('Withdrawals', function () {
    it('Should allow oracle to withdraw before refund time', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const decodedToken = createDecodedToken(user.address, oracle1.address, recipient1.address, depositAmount)

      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken))
        .to.emit(filpass, 'WithdrawalMade')
        .withArgs(oracle1.address, recipient1.address, depositAmount)

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.amount).to.equal(0)
      expect(deposit.exchangedSoFar).to.equal(depositAmount)
    })

    it('Should revert if withdrawal is attempted after refund time', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      // Fast forward time
      await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60])
      await ethers.provider.send('evm_mine', [])

      const decodedToken = createDecodedToken(user.address, oracle1.address, recipient1.address, depositAmount)

      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken)).to.be.revertedWithCustomError(filpass, 'WithdrawTimeExpired')

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.exchangedSoFar).to.equal(0)
    })

    it('Should revert when attempting to withdraw more than the deposited amount', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const withdrawAmount = ethers.utils.parseEther('2')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const decodedToken = createDecodedToken(user.address, oracle1.address, recipient1.address, withdrawAmount)

      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken)).to.be.revertedWithCustomError(filpass, 'InsufficientFunds')

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.exchangedSoFar).to.equal(0)
    })

    it('Should revert if withdrawal amount is zero', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const decodedToken = createDecodedToken(user.address, oracle1.address, recipient1.address, ethers.constants.Zero)

      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken)).to.be.revertedWithCustomError(filpass, 'InvalidWithdrawAmount')
    })

    it('Should allow partial withdrawals and correctly update the remaining balance', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('3')
      const partialWithdrawAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const decodedToken1 = createDecodedToken(user.address, oracle1.address, recipient1.address, partialWithdrawAmount)

      const decodedToken2 = createDecodedToken(user.address, oracle1.address, recipient1.address, partialWithdrawAmount.mul(2))

      // Partial withdrawal
      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken1))
        .to.emit(filpass, 'WithdrawalMade')
        .withArgs(oracle1.address, recipient1.address, partialWithdrawAmount)

      // Check remaining balance
      const remainingDeposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(remainingDeposit.amount).to.equal(depositAmount.sub(partialWithdrawAmount))
      expect(remainingDeposit.exchangedSoFar).to.equal(decodedToken1.lane_total_amount)

      // Another partial withdrawal
      await expect(filpass.connect(oracle1).withdrawAmount(decodedToken2))
        .to.emit(filpass, 'WithdrawalMade')
        .withArgs(oracle1.address, recipient1.address, partialWithdrawAmount)

      // Check final balance
      const finalDeposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(finalDeposit.amount).to.equal(depositAmount.sub(partialWithdrawAmount.mul(2)))
      expect(finalDeposit.exchangedSoFar).to.equal(decodedToken2.lane_total_amount)
    })
  })

  describe('Refunds', function () {
    it('Should allow user to refund after refund time', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60])
      await ethers.provider.send('evm_mine', [])

      await expect(filpass.connect(user).refundAmount(oracle1.address, recipient1.address))
        .to.emit(filpass, 'RefundMade')
        .withArgs(oracle1.address, recipient1.address, depositAmount)

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.amount).to.equal(0)
      expect(deposit.exchangedSoFar).to.equal(depositAmount)
    })

    it('Should refund all recipients for a specific oracle', async function () {
      const { filpass, user, oracle1, recipient1, recipient2 } = await loadFixture(deployContractFixture)
      const depositAmount1 = ethers.utils.parseEther('1')
      const depositAmount2 = ethers.utils.parseEther('2')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount1 })
      await filpass.connect(user).depositAmount(oracle1.address, recipient2.address, lockUpTime, { value: depositAmount2 })

      await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60])
      await ethers.provider.send('evm_mine', [])

      await expect(filpass.connect(user).refundAmount(oracle1.address, ethers.constants.AddressZero))
        .to.emit(filpass, 'RefundMade')
        .withArgs(oracle1.address, recipient1.address, depositAmount1)
        .to.emit(filpass, 'RefundMade')
        .withArgs(oracle1.address, recipient2.address, depositAmount2)

      const deposit1 = await filpass.deposits(oracle1.address, recipient1.address)
      const deposit2 = await filpass.deposits(oracle1.address, recipient2.address)
      expect(deposit1.amount).to.equal(0)
      expect(deposit1.exchangedSoFar).to.equal(depositAmount1)
      expect(deposit2.amount).to.equal(0)
      expect(deposit2.exchangedSoFar).to.equal(depositAmount2)
    })

    it('Should refund only eligible deposits when refunding all Oracles and Recipients', async function () {
      const { filpass, user, oracle1, oracle2, recipient1, recipient2 } = await loadFixture(deployContractFixture)
      const depositAmount1 = ethers.utils.parseEther('1')
      const depositAmount2 = ethers.utils.parseEther('2')
      const shortLockUpTime = 7
      const longLockUpTime = 30

      // Make deposits with different lock-up times
      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, shortLockUpTime, { value: depositAmount1 })
      await filpass.connect(user).depositAmount(oracle2.address, recipient2.address, longLockUpTime, { value: depositAmount2 })

      await ethers.provider.send('evm_increaseTime', [15 * 24 * 60 * 60]) // 15 days
      await ethers.provider.send('evm_mine', [])

      const refundTx = await filpass.connect(user).refundAmount(ethers.constants.AddressZero, ethers.constants.AddressZero)

      // Check for the emission of the RefundMade event for the first deposit
      await expect(refundTx).to.emit(filpass, 'RefundMade').withArgs(oracle1.address, recipient1.address, depositAmount1)

      // Check that the RefundMade event was not emitted for the second deposit
      const receipt = await refundTx.wait()
      const refundEvents = receipt.events?.filter(e => e.event === 'RefundMade')
      expect(refundEvents?.length).to.equal(1) // Only one RefundMade event should be emitted

      const deposit1 = await filpass.deposits(oracle1.address, recipient1.address)
      const deposit2 = await filpass.deposits(oracle2.address, recipient2.address)
      expect(deposit1.amount).to.equal(0)
      expect(deposit1.exchangedSoFar).to.equal(depositAmount1)
      expect(deposit2.amount).to.equal(depositAmount2)
      expect(deposit2.exchangedSoFar).to.equal(0)
    })

    it('Should refund remaining balance after partial withdrawals', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('3')
      const partialWithdrawAmount = ethers.utils.parseEther('1')
      const lockUpTime = 7

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      const decodedToken = createDecodedToken(user.address, oracle1.address, recipient1.address, partialWithdrawAmount)
      await filpass.connect(oracle1).withdrawAmount(decodedToken)

      await ethers.provider.send('evm_increaseTime', [8 * 24 * 60 * 60])
      await ethers.provider.send('evm_mine', [])

      // Refund remaining balance
      const remainingAmount = depositAmount.sub(partialWithdrawAmount)
      await expect(filpass.connect(user).refundAmount(oracle1.address, recipient1.address))
        .to.emit(filpass, 'RefundMade')
        .withArgs(oracle1.address, recipient1.address, remainingAmount)

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.amount).to.equal(0)
      expect(deposit.exchangedSoFar).to.equal(depositAmount)
    })

    it('Should revert when attempting to refund with no eligible funds', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const depositAmount = ethers.utils.parseEther('1')
      const lockUpTime = 30

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, lockUpTime, { value: depositAmount })

      await expect(
        filpass.connect(user).refundAmount(ethers.constants.AddressZero, ethers.constants.AddressZero),
      ).to.be.revertedWithCustomError(filpass, 'NoEligibleFundsToRefund')

      const deposit = await filpass.deposits(oracle1.address, recipient1.address)
      expect(deposit.amount).to.equal(depositAmount)
      expect(deposit.exchangedSoFar).to.equal(0)
    })
  })

  describe('Emergency Withdrawal', function () {
    it('Should allow user to perform emergency withdrawal', async function () {
      const { filpass, user, oracle1, recipient1 } = await loadFixture(deployContractFixture)
      const amount = ethers.utils.parseEther('1')

      await filpass.connect(user).depositAmount(oracle1.address, recipient1.address, 1, { value: amount })

      await ethers.provider.send('evm_increaseTime', [2 * 24 * 60 * 60])
      await ethers.provider.send('evm_mine', [])

      await expect(filpass.connect(user).emergencyWithdraw()).to.changeEtherBalance(user, amount)
    })

    it('Should revert emergency withdrawal if no funds are available', async function () {
      const { filpass, user } = await loadFixture(deployContractFixture)

      await expect(filpass.connect(user).emergencyWithdraw()).to.be.revertedWithCustomError(filpass, 'NoFundsToRefund')
    })
  })

  describe('Fallback and Receive Functions', function () {
    it('Should revert when sending Ether directly to the contract', async function () {
      const { filpass, user } = await loadFixture(deployContractFixture)
      const amount = ethers.utils.parseEther('1')

      await expect(
        user.sendTransaction({
          to: filpass.address,
          value: amount,
        }),
      ).to.be.revertedWithCustomError(filpass, 'DirectDepositsNotAllowed')
    })

    it('Should revert when calling a non-existent function', async function () {
      const { filpass, user } = await loadFixture(deployContractFixture)
      const amount = ethers.utils.parseEther('1')

      // Create a function selector for a non-existent function
      const nonExistentFunctionSelector = ethers.utils.id('nonExistentFunction()').slice(0, 10)

      await expect(
        user.sendTransaction({
          to: filpass.address,
          data: nonExistentFunctionSelector,
          value: amount,
        }),
      ).to.be.revertedWithCustomError(filpass, 'FunctionDoesNotExist')
    })
  })
})
