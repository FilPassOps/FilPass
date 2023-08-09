import { formatCurrency, formatCrypto } from 'lib/currency'
import { USD } from 'domain/currency/constants'

interface CurrencyProps {
  amount?: number
  requestCurrency?: string
  paymentUnit?: string
}

const Currency = ({ amount = 0, requestCurrency = '', paymentUnit = 'FIL' }: CurrencyProps) => {
  if (requestCurrency === USD) {
    return (
      <div className="text-deep-koamaru font-normal text-sm leading-tight w-0 min-w-full break-all whitespace-normal 2xl:truncate">
        {formatCurrency(amount)} in {paymentUnit}
      </div>
    )
  }

  return (
    <div className="text-deep-koamaru font-normal text-sm leading-tight w-0 min-w-full break-all whitespace-normal 2xl:truncate">
      {formatCrypto(amount)} {paymentUnit}
    </div>
  )
}

export default Currency

export const CryptoAmount: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <div className="bg-indigo-100 rounded-md shadow-sm px-4 py-2 text-indigo-700 text-sm leading-5 font-medium text-center break-all whitespace-normal 2xl:truncate">
      {children}
    </div>
  )
}
