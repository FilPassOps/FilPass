import { Prisma } from '@prisma/client'
import config from 'chains.config'
import { transferPaymentConfirm } from 'domain/transfer/transfers-payment-confirm'
import { ethers } from 'ethers'
import prisma from 'lib/prisma'
import { MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'
import { ForwardAnyEvent } from 'typechain-types/contracts/MultiForwarder'

const provider = new ethers.providers.JsonRpcProvider(config.chain.rpcUrls[0])
const signer = provider.getSigner()
const multiForwarder = MultiForwarderFactory.connect(config.multiforwarder, signer)
const filterAny = multiForwarder.filters.ForwardAny()
const filter = multiForwarder.filters.Forward()
const DELAYED_BLOCKS = 10 // approx 5 minutes

export default async function run() {
  const currentBlock = (await provider.getBlockNumber()) - DELAYED_BLOCKS
  try {
    const block = await prisma.blockTracker.findFirstOrThrow({ select: { blockNumber: true } })
    const toBlock = currentBlock
    const fromBlock = block?.blockNumber ?? toBlock - 1

    if (fromBlock >= toBlock) return

    const chunkSize = 100

    for (let i = fromBlock; i < toBlock; i += chunkSize) {
      const _startBlock = i
      const _endBlock = Math.min(toBlock, i + chunkSize)

      console.log(`Start block: ${_startBlock} - End block: ${_endBlock}`)

      const [forwardAnyEvents, forwardEvents] = await Promise.all([
        multiForwarder.queryFilter(filterAny, _startBlock, _endBlock),
        multiForwarder.queryFilter(filter, _startBlock, _endBlock),
      ])
      const uniqueEventMap = new Map<string, ForwardAnyEvent>()

      for (const event of forwardAnyEvents) {
        uniqueEventMap.set(event.transactionHash, event)
      }
      for (const event of forwardEvents) {
        uniqueEventMap.set(event.transactionHash, event)
      }

      for (const [, event] of uniqueEventMap) {
        const [id, from, to, value] = event.args
        transferPaymentConfirm({ id, from, to, value, transactionHash: event.transactionHash })
      }

      await prisma.blockTracker.updateMany({ data: { blockNumber: _endBlock + 1 } })
      console.log('Updated block number:', _endBlock + 1)
    }
  } catch (error: any) {
    console.error(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      console.log('Creating block tracker...')
      await prisma.blockTracker.create({ data: { blockNumber: currentBlock } })
      return
    }
    const errorBody = error.body && JSON.parse(error.body)
    if (errorBody?.error?.code === 1) {
      await prisma.blockTracker.updateMany({ data: { blockNumber: currentBlock } })
    }
  }
}
