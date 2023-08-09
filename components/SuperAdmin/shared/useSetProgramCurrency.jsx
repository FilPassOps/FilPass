import { useEffect } from 'react'

export const useSetProgramCurrency = ({ setValue, paymentMethodOptions, paymentMethod }) => {
  useEffect(() => {
    setValue(
      'programCurrency',
      paymentMethodOptions.find((option) => option.value === paymentMethod)?.programCurrency
    )
  }, [paymentMethod, paymentMethodOptions, setValue])
}
