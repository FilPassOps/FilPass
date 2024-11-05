import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contract with the account:', deployer.address)

  const Contract = await ethers.getContractFactory('FilPass')
  const contract = await Contract.deploy()

  await contract.deployed()

  console.log(`Contract deployed to ${contract.address}`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
