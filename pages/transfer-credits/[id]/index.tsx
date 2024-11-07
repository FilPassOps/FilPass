import { Layout } from 'components/Layout'
import { withUserSSR } from 'lib/ssr'
import Head from 'next/head'
import { Button, LinkButton } from 'components/Shared/Button'
import { ReactElement, useState } from 'react'
import { AppConfig } from 'config/system'
import { getUserCreditById } from 'domain/transfer-credits/get-user-credit-by-id'
import Timestamp from 'components/Shared/Timestamp'
import { DateTime } from 'luxon'
import { Divider } from 'components/Shared/Divider'
import { api } from 'lib/api'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { ethers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { useContract } from 'components/Web3/useContract'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { getTicketGroupsByUserCreditId } from 'domain/transfer-credits/get-split-tickets-group-by-user-credit-id'
import { getAvailableTicketsNumber } from 'domain/transfer-credits/get-available-tickets-number'
import { CreateTicketsModal } from 'components/User/Modal/CreateTicketsModal'
import { TicketGroupList } from 'components/User/TicketGroupList'
import { ErrorAlert } from 'components/User/Alerts'
import { CreditTicketStatus } from '@prisma/client'

export interface CreditTicket {
  id: number
  height: string
  token: string
  status: CreditTicketStatus
}

interface CreditTransaction {
  id: number
  receiver: {
    walletAddress: string
  }
  status: string
  transactionHash: string
}

export interface UserCreditDetails {
  id: number
  totalHeight: string
  totalSubmitTicket: string
  totalRefunds: string
  updatedAt: Date
  submitTicketStartsAt: Date
  submitTicketExpiresAt: Date
  refundStartsAt: Date
  amount: string
  creditTransactions: CreditTransaction[]
  creditTickets: CreditTicket[]
  contract: {
    address: string
    deployedFromAddress: string
  }
}

export interface TicketGroup {
  ticketGroupId: string
  totalTickets: number
  createdAt: Date
}

interface TransferCreditDetailsProps {
  data: {
    userCreditDetails: UserCreditDetails
    ticketGroups: TicketGroup[]
    availableTicketsNumber: number
  }
}

const TransferCreditDetails = ({ data }: TransferCreditDetailsProps) => {
  const { dispatch, close } = useAlertDispatcher()
  const { userCreditDetails, availableTicketsNumber } = data

  const { refundAmount } = useContract(data.userCreditDetails.contract.address ?? null)

  const [createTicketsModalOpen, setCreateTicketsModalOpen] = useState(false)
  const [isRefundLoading, setIsRefundLoading] = useState(false)

  const { token, network } = AppConfig.network.getFilecoin()

  const isSubmitTicketExpired = new Date(userCreditDetails.submitTicketExpiresAt) < new Date()
  const isRefundStarted = new Date(userCreditDetails.refundStartsAt) < new Date()

  const currentHeight = ethers.BigNumber.from(userCreditDetails.totalSubmitTicket).add(userCreditDetails.totalRefunds)
  const currentCredits = ethers.BigNumber.from(userCreditDetails.totalHeight).sub(currentHeight)

  const parsedCurrentCredits = formatUnits(currentCredits, token.decimals)

  const hasCredits = currentCredits.gt(0)

  const handleRefund = async () => {
    try {
      setIsRefundLoading(true)
      const systemWalletAddress = process.env.NEXT_PUBLIC_SYSTEM_WALLET_ADDRESS

      if (!systemWalletAddress) {
        dispatch({
          type: 'error',
          title: 'Refund failed',
          config: {
            closeable: true,
          },
          body: () => (
            <ErrorAlert handleClose={() => close()}>
              <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">
                Something went wrong with the oracle wallet. Please contact support if.
              </span>
            </ErrorAlert>
          ),
        })
        return false
      }

      const result = await refundAmount(systemWalletAddress, userCreditDetails.creditTransactions[0].receiver.walletAddress)

      if (result) {
        await api.post('/transfer-credits/refund-credits', {
          hash: result.hash,
          id: userCreditDetails.id,
        })

        dispatch({
          type: 'success',
          title: 'Refund transaction sent',
          config: {
            closeable: true,
          },
          body: () => (
            <>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Your refund transaction has been successfully sent and is being processed.
              </p>
              <div className="mt-4 text-sm text-gray-500 text-center mb-4">
                <a
                  href={`${network?.blockExplorer.url}/${result.hash}`}
                  onClick={() => close()}
                  rel="noreferrer"
                  target="_blank"
                  className="underline text-green-700"
                >
                  Check the message
                </a>
              </div>
            </>
          ),
        })
      }
    } catch (error: any) {
      dispatch({
        type: 'error',
        title: 'Refund failed',
        config: {
          closeable: true,
        },
        body: () => (
          <ErrorAlert handleClose={() => close()}>
            <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">{getPaymentErrorMessage(error)}</span>
          </ErrorAlert>
        ),
      })
      return false
    } finally {
      setIsRefundLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`Credit Details - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="container w-full max-w-3xl mx-auto">
        <div className="py-6">
          {isRefundStarted && hasCredits && (
            <div className="mb-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              <p className="font-bold">Attention</p>
              <p suppressHydrationWarning>
                This credit has expired on <strong>{new Date(userCreditDetails.submitTicketExpiresAt).toLocaleString()}</strong>. <br />
                You can only refund your credits or top up to continue using the service with this Receiver.
              </p>
            </div>
          )}
          {!hasCredits && (
            <div className="mb-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              <p className="font-bold">Attention</p>
              <p>
                You currently have <strong>0</strong> credits. Please buy top up your credits to continue using the service with this
                Receiver.
              </p>
            </div>
          )}

          <dl className={`sm:grid sm:grid-cols-2 sm:grid-flow-col items-center`}>
            <div>
              <div>
                <dt className="text-gray-900 font-medium">Receiver</dt>
                <dd className="text-sm text-gray-500">{userCreditDetails.creditTransactions[0].receiver.walletAddress}</dd>
              </div>
              <div>
                <dt className="text-gray-900 font-medium">Contract</dt>
                <dd className="text-sm text-gray-500">{userCreditDetails.contract.address}</dd>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-gray-500 flex items-end flex-col">
              <div className="flex flex-col sm:justify-end text-end">
                <dt className="text-gray-900 font-medium">Credits Locked Until:</dt>
                <dd className="text-sm text-gray-500">
                  <Timestamp
                    date={new Date(userCreditDetails.submitTicketExpiresAt).toISOString()}
                    format={DateTime.DATETIME_SHORT_WITH_SECONDS}
                  />
                </dd>
              </div>
              <div className="flex flex-col sm:justify-end text-end">
                <dt className="text-gray-900 font-medium">Refund Starts on:</dt>
                <dd className="text-sm text-gray-500">
                  <Timestamp
                    date={new Date(userCreditDetails.refundStartsAt).toISOString()}
                    format={DateTime.DATETIME_SHORT_WITH_SECONDS}
                  />
                </dd>
              </div>
            </div>
          </dl>

          <Divider className="my-8" />

          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Credit Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Current Credits:</p>
              <p className=" text-deep-koamaru">{parsedCurrentCredits}</p>
            </div>
            <div className="col-span-1">
              <p className="text-gray-600 font-semibold">Available Tickets:</p>
              <p className=" text-deep-koamaru">{availableTicketsNumber}</p>
            </div>
          </div>
        </div>

        <div className="">
          <Divider className="my-8" />
          <h2 className="text-2xl font-semibold text-deep-koamaru mb-4">Ticket Groups</h2>
          <TicketGroupList ticketGroups={data.ticketGroups} userCreditId={userCreditDetails.id} />
        </div>
        <Divider className="my-8" />
        <div className="py-6 flex items-center justify-center gap-4">
          <LinkButton href="/transfer-credits" className="w-fit" variant="outline" disabled={isRefundLoading}>
            Back
          </LinkButton>
          <Button
            onClick={() => {
              setCreateTicketsModalOpen(true)
            }}
            variant="primary"
            className="w-fit"
            disabled={isSubmitTicketExpired || isRefundLoading}
            toolTipText={isSubmitTicketExpired ? 'This credit has expired' : ''}
          >
            <p>Create Tickets</p>
          </Button>

          <LinkButton
            href={`/transfer-credits/top-up?to=${userCreditDetails.creditTransactions[0].receiver.walletAddress}`}
            variant="primary"
            className="w-fit"
            disabled={isRefundLoading}
          >
            Top Up
          </LinkButton>
          <div className="w-fit">
            <WithMetaMaskButton
              targetChainId={network.chainId}
              onClick={handleRefund}
              connectWalletLabel="Connect MetaMask to refund"
              switchChainLabel="Switch network to refund"
              variant="red"
              disabled={!isSubmitTicketExpired || !isRefundStarted || !hasCredits}
              toolTipText={
                !isSubmitTicketExpired
                  ? ' This credit has not expired yet'
                  : !isRefundStarted
                  ? 'This credit cannot be refunded yet'
                  : !hasCredits
                  ? 'No more credits to refund'
                  : ''
              }
            >
              Refund Credits
            </WithMetaMaskButton>
          </div>
        </div>
      </div>
      <CreateTicketsModal
        onModalClosed={() => setCreateTicketsModalOpen(false)}
        open={createTicketsModalOpen}
        userCreditId={userCreditDetails.id.toString()}
        currentCredits={currentCredits}
        availableTicketsNumber={availableTicketsNumber}
      />
    </>
  )
}

export default TransferCreditDetails

TransferCreditDetails.getLayout = function getLayout(page: ReactElement) {
  return <Layout title="Credit Details">{page}</Layout>
}

export const getServerSideProps = withUserSSR(async ({ params, user }: any) => {
  const { data } = await getUserCreditById({ id: params.id, userId: user.id })

  const userCreditDetails = data ? JSON.parse(JSON.stringify(data)) : null

  const { data: ticketGroups } = await getTicketGroupsByUserCreditId({ userCreditId: userCreditDetails.id })

  const { data: availableTicketsNumber } = await getAvailableTicketsNumber({ userId: user.id, userCreditId: userCreditDetails.id })

  return {
    props: {
      data: {
        userCreditDetails,
        ticketGroups: JSON.parse(JSON.stringify(ticketGroups)),
        availableTicketsNumber,
      },
    },
  }
})
