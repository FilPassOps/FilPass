import Bottleneck from 'bottleneck'
import { logger } from 'lib/logger'
import schedule from 'node-schedule'

import checkBuyCreditsTransaction from './check-buy-credits-transaction'
import checkRefundTransaction from './check-refund-transaction'
import checkSubmitTicketTransaction from './check-submit-ticket-transaction'
import checkDeployContractTransaction from './check-deploy-contract-transaction'
import checkExpiredTicketGroups from './check-expired-ticket-groups'
const checkBuyCreditsTransactionLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const checkRefundTransactionLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const checkSubmitTicketTransactionLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const checkDeployContractTransactionLimiter = new Bottleneck({
  maxConcurrent: 1,
})

const checkExpiredTicketGroupsLimiter = new Bottleneck({
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
schedule.scheduleJob('* * * * *', job(checkDeployContractTransactionLimiter, checkDeployContractTransaction))
schedule.scheduleJob('* * * * *', job(checkExpiredTicketGroupsLimiter, checkExpiredTicketGroups))

schedule.scheduleJob('* * * * *', job(checkBuyCreditsTransactionLimiter, checkBuyCreditsTransaction))
schedule.scheduleJob('* * * * *', job(checkRefundTransactionLimiter, checkRefundTransaction))
schedule.scheduleJob('* * * * *', job(checkSubmitTicketTransactionLimiter, checkSubmitTicketTransaction))

logger.info(`> Jobs scheduled...`)
