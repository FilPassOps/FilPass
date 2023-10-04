import { SelectInput } from 'components/shared/FormInput'
import { Controller } from 'react-hook-form'
import { AppConfig } from 'system.config'
import { BlockchainIcon } from './icons/BlockchainIcon'

interface SelectNetworkInputProps {
  control: any
  errors?: any
  submitErrors?: any
  disabled?: boolean
  placeholder?: string
  label?: string
  onChange?: (chainId: string) => void
  chainIdFilter?: string
  listboxClassName?: string
}

export const SelectNetworkInput = ({
  control,
  errors,
  submitErrors,
  disabled,
  placeholder,
  label,
  onChange,
  chainIdFilter,
  listboxClassName,
}: SelectNetworkInputProps) => {
  const chainOptions = AppConfig.network.chains
    .filter(chain => (chainIdFilter ? chain.chainId === chainIdFilter : true))
    .map(chain => {
      return {
        label: (
          <div className="flex">
            <BlockchainIcon blockchainName={chain.name} className="mr-2" />
            <span className="font-medium">{chain.name}</span>
          </div>
        ),
        value: chain.chainId,
      }
    })

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Controller
          control={control}
          name="chainId"
          render={({ field }) => (
            <SelectInput
              {...field}
              id="chainId"
              name="chainId"
              options={chainOptions}
              placeholder={placeholder || 'List of networks'}
              label={label || 'Network'}
              emptyState="You haven't selected a network. Please select a network to continue."
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
