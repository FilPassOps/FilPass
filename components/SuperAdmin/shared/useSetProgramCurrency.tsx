import { useEffect } from 'react'

interface UseSetProgramCurrencyProps {
  setValue: any
  paymentMethodOptions: {
    value: number
    label: string
    programCurrency: {
      name: string
      type: string
    }[]
  }[]
  paymentMethod: number
}

export const useSetProgramCurrency = ({ setValue, paymentMethodOptions, paymentMethod }: UseSetProgramCurrencyProps) => {
  useEffect(() => {
    setValue('programCurrency', paymentMethodOptions.find(option => option.value === paymentMethod)?.programCurrency)
  }, [paymentMethod, paymentMethodOptions, setValue])
}
