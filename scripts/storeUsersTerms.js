const { PLATFORM_NAME } = require('system.config').default
const { getPrismaClient } = require('../lib/prisma')

// update user terms on production - need to run only once
async function run() {
  const prisma = await getPrismaClient()
  const transferRequests = await prisma.transferRequest.findMany({
    where: {
      isActive: true,
    },
  })

  await Promise.all(
    transferRequests.map(async (request) => {
      await prisma.transferRequest.updateMany({
        where: {
          id: request.id,
        },
        data: {
          terms: {
            ...request.terms,
            informedDecisionText: `You represent that you have acquired sufficient information about crypto assets or tokens and wallet technology to reach an informed and knowledgeable decision regarding receipt of crypto assets or tokens.`,
            releaseText: `In exchange for good and valuable consideration, the sufficiency of which is hereby acknowledged, you hereby agree to release and forever discharge the Company, its officers, directors, employees and other personnel, shareholders and agents, and their respective affiliates (collectively, the "Released Parties") from all causes of action, expenses (including attorneys' fees and costs), damages, judgments, claims and demands whatsoever, whether known or unknown, now accrued or hereafter accruing, in law or equity, against any Released Party which you ever had, now have, or may in the future have for any claim arising out of the timing of the Company's distribution of crypto assets or tokens to you.`,
            satisfactionOfObligationsText: `You acknowledge that, upon delivery of the crypto assets or tokens to the wallet address you are providing, such crypto assets or tokens will be deemed to be delivered in full, and the obligations of the Company to deliver such crypto assets or tokens to you will be deemed satisfied.`,
            soleControlText: `You understand and agree that, once tokens have been transferred to the provided address, the crypto asset or tokens are in your sole control. You agree that ${PLATFORM_NAME} will not be responsible for any loss or theft of such tokens after they have been transferred.You represent that the crypto address you are providing is correct. You are acknowledging that providing an incorrect wallet address could result in unrecoverable loss of some or all of the Crypto assets or tokens that ${PLATFORM_NAME} is transferring to you, and that ${PLATFORM_NAME} and affiliated entities will not be liable in the event you provide an inaccurate wallet address.`,
            taxText: `You acknowledge that transferring tokens to your wallet, and your use of those crypto assets or tokens, may have significant tax consequences. You agree that you are solely responsible for paying your own taxes, and ${PLATFORM_NAME} cannot provide you with tax advice.`,
            transferAuthorizationText: `You authorize ${PLATFORM_NAME} to transfer any and all tokens owed to you to the address you are providing, or to one or more wallets controlled by it. You represent that you own and control the address you are providing.`,
            walletAddressText: `You represent that the crypto address you are providing is correct. You are acknowledging that providing an incorrect wallet address could result in unrecoverable loss of some or all of the Crypto assets or tokens that ${PLATFORM_NAME} is transferring to you, and that ${PLATFORM_NAME} and affiliated entities will not be liable in the event you provide an inaccurate wallet address.`,
          },
        },
      })
    })
  )
  console.info('Done')
}

run()
  .then((res) => {
    console.log(res)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to load database users: ', err)
    process.exit(1)
  })
