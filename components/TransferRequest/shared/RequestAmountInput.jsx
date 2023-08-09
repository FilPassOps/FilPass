import { NumberInput } from 'components/shared/FormInput'
import _get from 'lodash/get'
import { forwardRef } from 'react'

export const RequestAmountInput = forwardRef(
  ({ requestCurrency, value, errors, submitErrors, placeholder, name, required, ...props }, ref) => (
    <NumberInput
      id={name}
      name={name}
      label={
        <>
          Request Amount {requestCurrency ? `in  ${requestCurrency.name}` : ''}
          {required}
        </>
      }
      rightIcon={requestCurrency?.name}
      decimalScale={2}
      thousandSeparator={true}
      value={value}
      placeholder={placeholder}
      error={_get(errors, name) || _get(submitErrors, name)}
      {...props}
      ref={ref}
    />
  )
)

RequestAmountInput.displayName = 'RequestAmountInput'

export default RequestAmountInput
