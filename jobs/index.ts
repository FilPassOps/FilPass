import Bottleneck from 'bottleneck'
import { logger } from 'lib/logger'
import schedule from 'node-schedule'
import checkPendingTransfer from './check-pending-transfer'
import requiresChangeNotification from './requires-change-notification'
import checkCreditTransactionPayment from './check-credit-transaction-payment'

const checkPendingTransferLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const checkCreditTransactionPaymentLimiter = new Bottleneck({
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
schedule.scheduleJob('*/2 * * * *', job(checkPendingTransferLimiter, checkPendingTransfer))
schedule.scheduleJob('* * * * *', job(checkCreditTransactionPaymentLimiter, checkCreditTransactionPayment))

logger.info(`> Jobs scheduled...`)
