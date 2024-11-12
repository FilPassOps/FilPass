import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { api } from 'lib/api'
import { LoadingIndicator } from 'components/Shared/LoadingIndicator'

type FormInputs = {
  hash: string
  email: string
  receiverWallet: string
  transactionType: 'REFUND' | 'SUBMIT_TICKET' | 'BUY_CREDIT'
  reason: string
}

type TransactionResult = {
  status: string
  message: string
  details?: any
}

export const CheckTransaction = () => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormInputs>()
  const [result, setResult] = useState<TransactionResult>()
  const [error, setError] = useState<string>()

  const onSubmit = async (data: FormInputs) => {
    try {
      setError(undefined)
      const response = await api.post('/admin/check-transaction', data)
      setResult(response.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while checking the transaction')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 w-[600px] p-4 border border-black rounded-md flex flex-col gap-2">
      <h1 className="font-bold">Check Transaction</h1>

      <div className="flex gap-2 items-center justify-between">
        <label className="w-1/3" htmlFor="hash">
          Transaction Hash
        </label>
        <input className="w-2/3 rounded-md border p-2" type="text" placeholder="0x..." required {...register('hash')} />
      </div>

      <div className="flex gap-2 items-center justify-between">
        <label className="w-1/3" htmlFor="receiverWallet">
          Receiver Wallet
        </label>
        <input
          className="w-2/3 rounded-md border p-2"
          type="text"
          placeholder="0x..."
          required
          {...register('receiverWallet')}
        />
      </div>

      <div className="flex gap-2 items-center justify-between">
        <label className="w-1/3" htmlFor="email">
          Email
        </label>
        <input className="w-2/3 rounded-md border p-2" type="email" placeholder="user@example.com" required {...register('email')} />
      </div>

      <div className="flex gap-2 items-center justify-between">
        <label className="w-1/3" htmlFor="transactionType">
          Transaction Type
        </label>
        <select className="w-2/3 rounded-md border p-2" required {...register('transactionType')}>
          <option value="">Select type...</option>
          <option value="REFUND">REFUND</option>
          {/* <option value="SUBMIT_TICKET">SUBMIT TICKET</option> */}
          <option value="BUY_CREDIT">BUY CREDIT</option>
        </select>
      </div>

      <button
        type="submit"
        className="py-2 px-4 rounded-md text-white bg-indigo-600"
        disabled={isSubmitting}
      >
        <div className="flex items-center justify-center gap-2">
          {isSubmitting && <LoadingIndicator className="" />}Check
        </div>
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-gray-100 border rounded-md">
          <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </form>
  )
}
