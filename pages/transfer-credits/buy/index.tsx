import { Layout } from 'components/Layout'
import Head from 'next/head'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { api } from 'lib/api'
import { useAlertDispatcher } from 'components/Layout/Alerts'
import { ErrorAlert, SuccessAlert } from 'components/Controller/MetaMaskPayment/Alerts'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { ReactElement } from 'react'
import { LinkButton } from 'components/Shared/Button'
import { useContract } from 'hooks/useContract'
import { NumberInput, TextInput } from 'components/Shared/FormInput'
import { WithMetaMaskButton } from 'components/Web3/MetaMaskProvider'
import { AppConfig } from 'config/system'
import { buyTransferCreditsValidator } from 'domain/transfer-credits/validation'
import yup from 'lib/yup'
import { useRouter } from 'next/router'

type FormValue = yup.InferType<typeof buyTransferCreditsValidator>

const BuyCredits = () => {
  const router = useRouter()
  const to = router.query.to as string

  // TODO: Change to a better way to get the USDC
  const token = AppConfig.network.getTokenByTokenAddress('0x94a9d9ac8a22534e3faca9f4e7f2e2cf85d5e4c8')! // USDC
  const network = AppConfig.network.getChainByToken(token)!

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

  //   TODO: Guarantee we have USDC
  const { transferERC20 } = useContract(token)
  const { dispatch, close } = useAlertDispatcher()

  const handleFormSubmit = async (values: FormValue) => {
    try {
      if (!values.amount || !values.storageProviderWallet) return

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
                System wallet address is not set. Please contact the administrator.
              </span>
            </ErrorAlert>
          ),
        })
        return false
      }

      const result = await transferERC20(systemWalletAddress, values.amount.toString())

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
        <title>Buy Credits - Protocol Labs Transfer</title>
      </Head>
      <div className="h-full max-w-3xl mx-auto">
        <form className="flex flex-col gap-4 mt-5 h-full flex-grow">
          <div className="flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-2">
              <TextInput
                label="Storage Provider Wallet"
                id="storageProviderWallet"
                type="text"
                placeholder="Insert a valid address"
                error={errors.storageProviderWallet}
                {...register(`storageProviderWallet`)}
              />
              <p className="text-gray-600 text-xs">Check if you are transferring to the correct storage provider wallet.</p>
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
              <WithMetaMaskButton targetChainId={network.chainId} onClick={handleSubmit(handleFormSubmit)}>
                Buy Credits
              </WithMetaMaskButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BuyCredits

BuyCredits.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout title="Buy Credits" containerClass="">
      {page}
    </Layout>
  )
}

const getPaymentErrorMessage = (error: any) => {
  if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
    return <p>{`${errorsMessages.user_rejected_payment.message}`}</p>
  } else if (error.code === -32603 && error?.data?.message.includes('failed to estimate gas')) {
    if (error.data.message.includes('insufficient funds')) {
      return <p>{`${errorsMessages.not_enough_funds.message}`}</p>
    } else {
      return <p>{`${errorsMessages.check_account_balance.message}`}</p>
    }
  } else {
    return <p>{`${errorsMessages.error_during_payment.message}`}</p>
  }
}
