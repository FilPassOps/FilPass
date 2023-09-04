import Bottleneck from 'bottleneck'
import schedule from 'node-schedule'
import blockchainWatcher from './blockchain-watcher'
import checkPendingTransfer from './check-pending-transfer'
import requiresChangeNotification from './requires-change-notification'
import { logger } from 'lib/logger'

const blockchainWatcherLimiter = new Bottleneck({
  maxConcurrent: 1,
})
const checkPendingTransferLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const job = (limiter: Bottleneck, job: () => Promise<void>) => {
  return async () => {
    try {
      await limiter.schedule({ expiration: 1000 * 60 * 10 }, job)
    } catch (error) {
      if (error instanceof Bottleneck.BottleneckError && error.message !== 'This job has been dropped by Bottleneck') {
        console.error(error)
      }
    }
  }
}

schedule.scheduleJob('0 6 * * *', requiresChangeNotification)

schedule.scheduleJob('* * * * *', job(blockchainWatcherLimiter, blockchainWatcher))
schedule.scheduleJob('*/2 * * * *', job(checkPendingTransferLimiter, checkPendingTransfer))

logger.info(`> Jobs scheduled...`)
