import { expect } from 'chai'
import { ethers } from 'hardhat'

import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { MultiForwarder } from 'typechain-types'

describe('MultiForwarder', function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners()

    const multiForwarder = (await ethers.deployContract('MultiForwarder')) as MultiForwarder

    return { multiForwarder, owner, addr1, addr2, addr3, addr4 }
  }

  it('Should forward to multiple addresses with different amounts', async function () {
    const { multiForwarder, owner, addr1, addr2, addr3, addr4 } = await loadFixture(deployTokenFixture)

    expect(await owner.getBalance()).to.not.equal(0)

    const value1 = ethers.utils.parseEther('0.01')
    const value2 = ethers.utils.parseEther('0.02')
    const value3 = ethers.utils.parseEther('0.03')
    const value4 = ethers.utils.parseEther('0.04')
    const total = ethers.utils.parseEther('0.1')

    await expect(
      multiForwarder.forward('unique-id', [addr1.address, addr2.address, addr3.address, addr4.address], [value1, value2, value3, value4], {
        value: total,
      }),
    ).to.changeEtherBalances([owner, addr1, addr2, addr3, addr4], [ethers.utils.parseEther('-0.1'), value1, value2, value3, value4])
  })

  it('Should emit Forward event', async function () {
    const { multiForwarder, owner, addr1, addr2 } = await loadFixture(deployTokenFixture)

    const value1 = ethers.utils.parseEther('0.04')
    const value2 = ethers.utils.parseEther('0.06')
    const total = ethers.utils.parseEther('0.1')

    await expect(multiForwarder.forward('unique-id', [addr1.address, addr2.address], [value1, value2], { value: total }))
      .to.emit(multiForwarder, 'Forward')
      .withArgs('unique-id', owner.address, [addr1.address, addr2.address], [value1, value2], total)
  })

  it('Should revert if addresses and amounts are empty', async function () {
    const { multiForwarder } = await loadFixture(deployTokenFixture)

    const total = ethers.utils.parseEther('0.1')

    await expect(multiForwarder.forward('unique-id', [], [], { value: total })).to.be.revertedWith(
      'addresses and amounts must not be empty',
    )
  })

  it('Should revert if addresses are more than 100', async function () {
    const { multiForwarder, addr1 } = await loadFixture(deployTokenFixture)

    const addresses = Array(101).fill(addr1.address)
    const values = Array(101).fill(ethers.utils.parseEther('0.01'))

    const total = ethers.utils.parseEther('1.01')

    await expect(multiForwarder.forward('unique-id', addresses, values, { value: total })).to.be.revertedWith(
      'addresses must not be more than 100',
    )
  })

  it('Should revert if the total value is not equal to the sum of the amounts', async function () {
    const { multiForwarder, addr1 } = await loadFixture(deployTokenFixture)

    const addresses = Array(10).fill(addr1.address)
    const values = Array(10).fill(ethers.utils.parseEther('0.01'))

    const total = ethers.utils.parseEther('0.09')

    await expect(multiForwarder.forward('unique-id', addresses, values, { value: total })).to.be.revertedWith(
      'msg.value must be equal to the sum of all amounts',
    )
  })
})
