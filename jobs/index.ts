import Bottleneck from 'bottleneck'
import checkSanctions from 'jobs/check-sanctions'
import deactivateAllUsersTaxForms from 'jobs/deactivate-all-users-tax-form'
import schedule from 'node-schedule'
import { SANCTION_CHECK_ENABLED } from 'system.config'
import blockchainWatcher from './blockchain-watcher'
import checkAwaitingTaxFormReviewNotification from './check-awaiting-tax-form-review-notification'
import checkPendingTransfer from './check-pending-transfer'
import requiresChangeNotification from './requires-change-notification'

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

if (SANCTION_CHECK_ENABLED) {
  schedule.scheduleJob('0 * * * *', checkSanctions)
}

schedule.scheduleJob('0 0 1 1 *', deactivateAllUsersTaxForms)

schedule.scheduleJob('0 6 * * *', requiresChangeNotification)
schedule.scheduleJob('0 16 * * *', checkAwaitingTaxFormReviewNotification)

schedule.scheduleJob('* * * * *', job(blockchainWatcherLimiter, blockchainWatcher))
schedule.scheduleJob('*/2 * * * *', job(checkPendingTransferLimiter, checkPendingTransfer))

console.log(`> Jobs started...`)
