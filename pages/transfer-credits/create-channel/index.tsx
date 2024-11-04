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
import { useMetaMask, WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { AppConfig } from 'config/system'
import { createChannelValidator } from 'domain/transfer-credits/validation'
import yup from 'lib/yup'
import { useContract } from 'components/Web3/useContract'
import { getPaymentErrorMessage } from 'components/Web3/utils'
import { withUserSSR } from 'lib/ssr'
import { getContractsByUserId } from 'domain/contracts/get-contracts-by-user-id'
import { Contract, DeployContractTransaction, UserWallet } from '@prisma/client'
import { getPendingContractTransactions } from 'domain/contracts/get-pending-contract-transactions'
import { getWalletsByUserId } from 'domain/wallet/get-wallets-by-user-id'
import { validateWalletAddress } from 'lib/blockchain-utils'

type FormValue = yup.InferType<typeof createChannelValidator>

interface CreateChannelProps {
  data: {
    contracts: Contract[]
    pendingContractTransactions: DeployContractTransaction[] | null
    wallets: UserWallet[]
  }
}

const CreateChannel = ({ data }: CreateChannelProps) => {
  const [receiverWalletError, setReceiverWalletError] = useState<{ message: string } | undefined>(undefined)
  const [metamaskWalletError, setMetamaskWalletError] = useState<{ message: string } | undefined>(undefined)
  const { dispatch, close } = useAlertDispatcher()
  const { wallet } = useMetaMask()

  const { network } = AppConfig.network.getFilecoin()

  const hasContracts = data.contracts?.length > 0

  const { depositAmount } = useContract(hasContracts ? data.contracts[0].address : null)

  const {
    register,
    formState: { errors, isSubmitting, defaultValues },
    reset,
    handleSubmit,
  } = useForm({
    resolver: yupResolver(createChannelValidator),
    defaultValues: {
      amount: 1,
      storageProviderWallet: '',
    },
    shouldFocusError: true,
    mode: 'onSubmit',
  })

  const handleFormSubmit = async (values: FormValue) => {
    try {
      if (!values.amount || !values.storageProviderWallet) return

      setReceiverWalletError(undefined)
      setMetamaskWalletError(undefined)

      const storageProviderWallet = validateWalletAddress(values.storageProviderWallet)

      if (!storageProviderWallet) {
        setReceiverWalletError({
          message: `Invalid receiver wallet address.`,
        })
        return
      }

      if (hasContracts) {
        const contract = data.contracts.find(contract => contract.deployedFromAddress === wallet)

        if (!contract) {
          setMetamaskWalletError({
            message: `Your contract is not deployed with this wallet address. Use the same wallet address as the one on Profile & Settings.`,
          })
          return
        }

        const { data: userCredit } = await api.post('/transfer-credits/get-user-credit-by-receiver-wallet', {
          receiverWallet: storageProviderWallet,
        })

        if (userCredit) {
          setReceiverWalletError({
            message: `You already have a channel with this receiver.`,
          })
          return
        }

        setMetamaskWalletError(undefined)
        await handleDepositAmount(values, storageProviderWallet)
      } else {
        if (!data.wallets || data.wallets.length === 0) {
          setMetamaskWalletError({
            message: `You have no wallets registered. Please register a wallet on Profile & Settings first.`,
          })
          return
        }

        const existingWallet = data.wallets.find(dataWallet => dataWallet.address === wallet)

        if (!existingWallet) {
          setMetamaskWalletError({
            message: `Use the same wallet address as the one on Profile & Settings.`,
          })
          return
        }

        if (data.pendingContractTransactions && data.pendingContractTransactions.length > 0) {
          setMetamaskWalletError({
            message: `Your contract deployment is currently in progress. Check your transaction status on Profile & Settings.`,
          })
          return
        }

        setMetamaskWalletError({
          message: `You do not have a contract deployed. Please deploy a contract on Profile & Settings first.`,
        })
        return
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleDepositAmount = async (values: FormValue, storageProviderWallet: string) => {
    try {
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

      const result = await depositAmount(systemWalletAddress, storageProviderWallet, 1, values.amount.toString())

      if (result) {
        await api.post('/transfer-credits', {
          hash: result.hash,
          from: result.from,
          to: storageProviderWallet,
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
        <title>{`Create Channel - ${AppConfig.app.name}`}</title>
      </Head>
      <div className="h-full max-w-3xl mx-auto">
        <form className="flex flex-col gap-4 mt-5 h-full flex-grow">
          <div className="flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-2">
              <TextInput
                label="MetaMask Wallet"
                id="metaMaskWallet"
                type="text"
                disabled={true}
                value={wallet || '-'}
                error={metamaskWalletError}
              />
            </div>
            <div className="flex flex-col gap-2">
              <TextInput
                label="Receiver Wallet"
                id="storageProviderWallet"
                type="text"
                placeholder="Insert a valid address"
                error={errors.storageProviderWallet || receiverWalletError}
                {...register(`storageProviderWallet`)}
              />
              <p className="text-gray-600 text-xs">Check if you are transferring to the correct receiver wallet.</p>
            </div>

            <NumberInput
              label="Amount"
              placeholder="Insert the amount in FIL"
              error={errors.amount}
              decimalScale={6}
              defaultValue={defaultValues?.amount}
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
                onClick={handleSubmit(handleFormSubmit)}
                connectWalletLabel={`Connect MetaMask to Create Channel`}
                switchChainLabel={`Switch network to Create Channel`}
              >
                Create Channel
              </WithMetaMaskButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateChannel

CreateChannel.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Create Channel" containerClass="">
      {page}
    </Layout>
  )
}

export const getServerSideProps = withUserSSR(async function getServerSideProps({ user }) {
  const { data } = await getContractsByUserId({ userId: user.id })

  const { data: pendingContractTransactions } = await getPendingContractTransactions({ userId: user.id })

  const { data: wallets } = await getWalletsByUserId({ userId: user.id })

  return {
    props: {
      data: {
        contracts: JSON.parse(JSON.stringify(data)),
        pendingContractTransactions: pendingContractTransactions ? JSON.parse(JSON.stringify(pendingContractTransactions)) : null,
        wallets: JSON.parse(JSON.stringify(wallets)),
      },
    },
  }
})
