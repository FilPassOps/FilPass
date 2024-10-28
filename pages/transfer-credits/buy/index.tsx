import { Layout } from 'components/Layout'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { api } from 'lib/api'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { ErrorAlert, SuccessAlert } from 'components/User/Alerts'
import { ReactElement, useState } from 'react'
import { LinkButton } from 'components/Shared/Button'
import { NumberInput, TextInput } from 'components/Shared/FormInput'
import { WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { AppConfig } from 'config/system'
import { buyTransferCreditsValidator } from 'domain/transfer-credits/validation'
import yup from 'lib/yup'
import { useRouter } from 'next/router'
import { useContract } from 'components/Web3/useContract'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { DeployContractModal } from 'components/User/Modal/DeployContractModal'
import { withUserSSR } from 'lib/ssr'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { Contract, DeployContractTransaction } from '@prisma/client'
import { getPendingContractTransactions } from 'domain/contracts/get-pending-contract-transactions'

type FormValue = yup.InferType<typeof buyTransferCreditsValidator>

interface BuyCreditsProps {
  data: {
    contracts: Contract[]
    pendingContractTransactions: DeployContractTransaction[] | null
  }
}

const BuyCredits = ({ data }: BuyCreditsProps) => {
  const [open, setOpen] = useState(false)
  const { dispatch, close } = useAlertDispatcher()
  const router = useRouter()

  const to = router.query.to as string

  const token = AppConfig.network.getTokenBySymbolAndBlockchainName('tFIL', 'Filecoin')
  const network = AppConfig.network.getChainByToken(token)!

  const hasContracts = data.contracts?.length > 0

  const { depositAmount } = useContract(hasContracts ? data.contracts[0].address : null)

  const {
    register,
    formState: { errors, isSubmitting },
    reset,
    handleSubmit,
  } = useForm({
    resolver: yupResolver(buyTransferCreditsValidator),
    defaultValues: {
      amount: 0,
      storageProviderWallet: to || '',
    },
    shouldFocusError: true,
  })

  const handleFormSubmit = async (values: FormValue) => {
    try {
      if (!values.amount || !values.storageProviderWallet) return

      if (data.contracts.length === 0) {
        setOpen(true)
        return
      }

      const systemWalletAddress = process.env.NEXT_PUBLIC_SYSTEM_WALLET_ADDRESS

      if (!systemWalletAddress) {
        dispatch({
          type: 'error',
          title: 'Payment failed',
          config: {
            closeable: true,
          },
          body: () => (
            <ErrorAlert handleClose={() => close()}>
              <span className="text-sm text-gray-600 text-center first-letter:uppercase pt-2">
                Something went wrong with the oracle wallet. Please contact support if the problem persists.
              </span>
            </ErrorAlert>
          ),
        })
        return false
      }

      const result = await depositAmount(systemWalletAddress, values.storageProviderWallet, 1, values.amount.toString())

      if (result) {
        await api.post('/transfer-credits', {
          hash: result.hash,
          from: result.from,
          to: values.storageProviderWallet,
          amount: values.amount,
        })

        dispatch({
          type: 'success',
          title: 'Payment sent',
          config: {
            closeable: true,
          },
          body: () => <SuccessAlert hash={result.hash} blockExplorerUrl={network?.blockExplorer.url} handleClose={() => close()} />,
        })
      }
    } catch (error: any) {
      dispatch({
        type: 'error',
        title: 'Payment failed',
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
    }
  }

  return (
    <div className="h-full min-h-screen">
      <Head>
        <title>Create Channel</title>
      </Head>
      <div className="h-full max-w-3xl mx-auto">
        <form className="flex flex-col gap-4 mt-5 h-full flex-grow">
          <div className="flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-2">
              <TextInput
                label="Receiver Wallet"
                id="storageProviderWallet"
                type="text"
                placeholder="Insert a valid address"
                error={errors.storageProviderWallet}
                {...register(`storageProviderWallet`)}
              />
              <p className="text-gray-600 text-xs">Check if you are transferring to the correct receiver wallet.</p>
            </div>

            <NumberInput
              //  @ts-ignore
              label="Amount"
              placeholder="Insert the amount in FIL"
              error={errors.amount}
              decimalScale={6}
              {...register('amount', {
                setValueAs: val => {
                  const parsedValue = parseFloat(String(val).replaceAll(/[, \s]+/g, ''))
                  return isNaN(parsedValue) ? 0 : parsedValue
                },
              })}
            />
          </div>
          <div className="flex items-center justify-end col-span-2 gap-3">
            <div className="w-24" onClick={() => reset()}>
              <LinkButton href="/transfer-credits" variant="outline" disabled={isSubmitting}>
                Cancel
              </LinkButton>
            </div>
            <div className="w-fit">
              <WithMetaMaskButton
                targetChainId={network.chainId}
                onClick={hasContracts ? handleSubmit(handleFormSubmit) : () => setOpen(true)}
                connectWalletLabel={`Connect MetaMask to ${to ? 'Top Up' : 'Create Channel'}`}
                switchChainLabel={`Switch network to ${to ? 'Top Up' : 'Create Channel'}`}
              >
                {to ? 'Top Up' : 'Create Channel'}
              </WithMetaMaskButton>
            </div>
          </div>
        </form>
      </div>
      <DeployContractModal
        open={open}
        onModalClosed={() => setOpen(false)}
        contractAddress={data.contracts[0]?.address}
        pendingContractTransactions={data.pendingContractTransactions}
      />
    </div>
  )
}

export default BuyCredits

BuyCredits.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Create Channel" containerClass="">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user }) {
  const { data } = await getContractsByUserId({ userId: user.id })

  const pendingContractTransactions = await getPendingContractTransactions({ userId: user.id })

  return {
    props: {
      data: {
        contracts: JSON.parse(JSON.stringify(data)),
        pendingContractTransaction: pendingContractTransactions ? JSON.parse(JSON.stringify(pendingContractTransactions)) : null,
      },
    },
  }
})
