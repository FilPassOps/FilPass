import { SelectInput } from 'components/Shared/FormInput'
import { AppConfig, isERC20Token } from 'config'
import { Controller } from 'react-hook-form'
import { TokenIcon } from './TokenIcon'

interface SelectTokenInputProps {
  control: any
  errors?: any
  submitErrors?: any
  disabled?: boolean
  placeholder?: string
  label?: string
  onChange?: (tokenIdentifier: string) => void
  listboxClassName?: string
  name?: string
}

export const SelectTokenInput = ({
  control,
  errors,
  submitErrors,
  disabled,
  placeholder,
  label,
  onChange,
  listboxClassName,
  name,
}: SelectTokenInputProps) => {
  const tokenOptions = AppConfig.network.chains
    .map(chain => {
      return chain.tokens.map(token => {
        const tokenAddress = isERC20Token(token) ? token.erc20TokenAddress : undefined
        return {
          label: (
            <div className={'flex items-center text-sm text-gray-900'}>
              <TokenIcon blockchainName={chain.name} tokenSymbol={token.symbol} className="mr-2" />
              <span className="flex flex-shrink-0 flex-col justify-center items-start">
                <p className="ui-active:text-white break-all">{token.symbol}</p>
                <p className="text-gray-500 ui-active:text-white truncate text-xs">{chain.name}</p>
              </span>
            </div>
          ),
          value: tokenAddress ? tokenAddress : chain.chainId,
        }
      })
    })
    .flat()

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Controller
          control={control}
          name={name || 'tokenIdentifier'}
          render={({ field }) => (
            <SelectInput
              {...field}
              id={name || 'tokenIdentifier'}
              name={name || 'tokenIdentifier'}
              options={tokenOptions}
              placeholder={placeholder || 'List of tokens'}
              label={label || 'Token'}
              emptyState="You haven't selected a token. Please select a token to continue."
              error={errors || submitErrors}
              onBlur={field.onBlur}
              onChange={(value: any) => {
                field.onChange(value)
                onChange && onChange(value)
              }}
              ref={field.ref}
              value={field.value}
              disabled={disabled}
              listboxClassName={listboxClassName}
            />
          )}
        />
      </div>
    </>
  )
}
