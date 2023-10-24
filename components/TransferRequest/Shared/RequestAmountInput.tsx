import { NumberInput } from 'components/Shared/FormInput'
import _get from 'lodash/get'
import { forwardRef } from 'react'

interface RequestAmountInputProps {
  requestCurrency: {
    name: string
  }
  value: any
  errors?: any
  submitErrors?: any
  placeholder?: string
  name: string
  required?: boolean
}

export const RequestAmountInput = forwardRef<HTMLInputElement, RequestAmountInputProps>(
  ({ requestCurrency, value, errors, submitErrors, placeholder, name, required, ...props }, ref) => (
    <NumberInput
      id={name}
      name={name}
      label={
        <>
          Request Amount{requestCurrency ? ` in  ${requestCurrency.name}` : ''}
          {required}
        </>
      }
      rightIcon={requestCurrency?.name}
      decimalScale={2}
      thousandSeparator={true}
      value={value}
      placeholder={placeholder}
      error={_get(errors, name) || _get(submitErrors, name)}
      ref={ref}
      {...props}
    />
  ),
)

RequestAmountInput.displayName = 'RequestAmountInput'

export default RequestAmountInput
