import config from 'chains.config'
import { baseEmail } from 'domain/notifications/constants'
import { transferPaymentConfirm } from 'domain/transfer/transfers-payment-confirm'
import { ethers } from 'ethers'
import { decryptPII } from 'lib/emissaryCrypto'
import prisma from 'lib/prisma'
import { sendBatchEmail } from 'lib/sendEmail'
import { MultiForwarder__factory as MultiForwarderFactory } from 'typechain-types'

interface EmailReminderRecipient {
  email: string
}

const contractInterface = MultiForwarderFactory.createInterface()
const blockExplorerUrl = config.chain.blockExplorerUrls[0]
const provider = new ethers.providers.JsonRpcProvider(config.chain.rpcUrls[0])

export default async function run() {
  const receipt = await provider.getTransactionReceipt('0x1a17dea4597367fdfa439d13122ad31beaae438582adb2d2e9ac84653c4c2113')
  console.log('🚀 ~ file: check-pending-transfer.ts:25 ~ run ~ receipt:', receipt)

  try {
    const pendingTransfers = await prisma.transfer.findMany({
      where: {
        status: 'PENDING',
        txHash: { not: null },
        isActive: true,
        updatedAt: {
          lte: new Date(new Date().getTime() - 10 * 60 * 1000), // 10 minutes ago
        },
      },
      select: {
        txHash: true,
      },
      distinct: ['txHash'],
    })

    if (pendingTransfers.length <= 0) {
      return
    }

    const failedTransactions = []
    const failedTransferRequestPublicIds = []

    for (const { txHash } of pendingTransfers) {
      if (!txHash) {
        continue
      }

      const receipt = await provider.getTransactionReceipt('0x1a17dea4597367fdfa439d13122ad31beaae438582adb2d2e9ac84653c4c2113')

      if (!receipt) {
        continue
      }

      // status 1 = Success
      if (receipt.status === 1) {
        const logparsed = contractInterface.parseLog({
          data: receipt.logs[0].data,
          topics: receipt.logs[0].topics,
        })
        const { id, from, to, value } = logparsed.args
        transferPaymentConfirm({ id, from, to, value, transactionHash: txHash })
      } else {
        //ExitCode != 0 = Failed
        await prisma.transfer.updateMany({
          where: {
            txHash: txHash,
            isActive: true,
          },
          data: {
            status: 'FAILED',
            // notes: data.error, // TODO OPEN-SOURCE: Add error message
            isActive: false,
          },
        })
        const failedTransferRequests = await prisma.transfer.findMany({
          where: {
            txHash: txHash,
            status: 'FAILED',
          },
          select: {
            transferRequest: {
              select: {
                publicId: true,
              },
            },
          },
        })
        failedTransactions.push(txHash)
        failedTransferRequestPublicIds.push(...failedTransferRequests.map(({ transferRequest }) => transferRequest.publicId))
      }
    }

    if (failedTransactions.length <= 0) {
      return
    }

    const controllerUsers = await prisma.userRole.findMany({
      where: {
        role: {
          equals: 'CONTROLLER',
        },
        isActive: true,
        user: {
          isActive: true,
        },
      },
      select: {
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (controllerUsers.length < 1) {
      return
    }

    const recipients: EmailReminderRecipient[] = []

    const recipientsResult = await Promise.allSettled(
      controllerUsers.map(async userRole => {
        const email: string = await decryptPII(userRole.user.email)
        return {
          email,
        }
      }),
    )

    recipientsResult.forEach(item => {
      if (item.status === 'fulfilled') return recipients.push(item.value)
    })
    await sendBatchEmail({
      recipients,
      subject: `Transfer request payments have failed`,
      html: baseEmail(getBody(failedTransactions, failedTransferRequestPublicIds)),
    })
  } catch (error: any) {
    console.error(error)
  }
}

const getBody = (failedTransactions: string[], failedTransferRequestPublicIds: string[]) => {
  // prettier-ignore
  return `
  <tr>
    <td style="padding-left:32px; padding-right: 32px;padding-top: 48px;">
      <h1 style="margin-top:0;margin-bottom:35px;font-size:48px;line-height:48px;font-weight:800;letter-spacing:-0.02em; color:#4F46E5">
        Transfer request payments have failed
      </h1>
      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Hello, <br /> <br />
        The following transfer requests payments have been reverted by the blockchain. <br /> <br />
      </p>

      <p style="padding: 16px 10px; margin: 20px 0px; background: #4f46e5; color: white; border-radius: 6px; line-height:24px; font-weight: 500;">
        ${failedTransferRequestPublicIds
          .map(id => `<a href=${process.env.APP_URL}/disbursement/${id} style="color: white; text-decoration: underline;">${id}</a>`)
          .join(', ')}
      </p>

      <p style="margin:0; color: #6B7280;line-height: 24px;">
        Transaction hash list reverted: <br />
      </p>

      <ul style="font-size:12px;word-break: break-all;padding: 16px 10px; margin: 20px 0px; background: #4f46e5; color: white; border-radius: 6px; line-height:24px; font-weight: 500;">
        ${failedTransactions.map(
          txHash => `<li><a href=${blockExplorerUrl}/${txHash} style="color: white; text-decoration: underline;">${txHash}</a></li>`
        ).join('')}
      </ul>
    </td>
  </tr>
  `
}
