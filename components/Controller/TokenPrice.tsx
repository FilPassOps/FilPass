import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/Shared/Button'
import { NumberInput } from 'components/Shared/FormInput'
import { LoadingIndicator } from 'components/Shared/LoadingIndicator'
import useCurrency from 'hooks/useCurrency'
import { AppConfig } from 'config'
import { updateCurrencyRateValidator } from 'domain/currency/validation'
import { api } from 'lib/api'
import yup from 'lib/yup'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { SelectTokenInput } from 'components/Shared/SelectTokenInput'

type FormValue = yup.InferType<typeof updateCurrencyRateValidator>

export const TokenPrice = () => {
  const [submitErrors, setSubmitErrors] = useState<string | { message: string }>()
  const [loadingRefresh, setLoadingRefresh] = useState(false)

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<yup.InferType<typeof updateCurrencyRateValidator>>({
    resolver: yupResolver(updateCurrencyRateValidator),
    defaultValues: {
      rate: undefined,
      tokenIdentifier: undefined,
    },
  })

  const { rate, tokenIdentifier } = watch()

  const { mutate } = useCurrency(tokenIdentifier)

  const handleFormSubmit = async (values: FormValue) => {
    if (Object.keys(errors).length > 0) {
      return
    }

    const { error, data } = await api.patch(`/currency/${values.tokenIdentifier}`, values)
    if (error) {
      setSubmitErrors(error.errors)
      return
    }

    mutate(data.rate)
  }

  const handleRefreshClick = async () => {
    if (!tokenIdentifier) {
      return
    }
    setLoadingRefresh(true)
    const { data, error } = await api.get(`/currency/${tokenIdentifier}/market-rate`)
    if (error) {
      setSubmitErrors(error)
      setLoadingRefresh(false)
      return
    }
    setLoadingRefresh(false)
    setValue('rate', data.rate.toString())
  }

  const handleChangeNetwork = async (tokenIdentifier: string) => {
    if (!tokenIdentifier) {
      return
    }
    setLoadingRefresh(true)
    const { data, error } = await api.get(`/currency/${tokenIdentifier}`)
    if (error) {
      setSubmitErrors(error)
      setLoadingRefresh(false)
      return
    }
    setValue('rate', data.rate.toString())
    setLoadingRefresh(false)
    setSubmitErrors(undefined)
  }

  const rightIcon = AppConfig.app.enableCoinMarketApi ? (
    loadingRefresh ? (
      <LoadingIndicator className="text-teal-400" />
    ) : (
      <ArrowPathIcon className="h-5 w-5 text-teal-400 cursor-pointer" onClick={handleRefreshClick} />
    )
  ) : null

  return (
    <div className="flex flex-col bg-gray-100 p-4">
      <h1 className="font-medium mb-2 text-lg">Token Price</h1>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-3 relative">
          <SelectTokenInput control={control} errors={errors?.tokenIdentifier} submitErrors={submitErrors} onChange={handleChangeNetwork} />
        </div>
        <div className="mb-3 relative">
          <NumberInput
            // @ts-ignore
            className="pl-7 pr-10"
            leftIcon={<>$</>}
            rightIcon={rightIcon}
            value={rate}
            decimalScale={2}
            thousandSeparator={true}
            autoComplete="off"
            allowNegative={false}
            error={errors.rate || submitErrors}
            {...register('rate', {
              setValueAs: value => {
                const parsedValue = value.replaceAll(/[, \s]+/g, '')
                return isNaN(parsedValue) ? 0 : parsedValue
              },
            })}
          />
        </div>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          Submit
        </Button>
      </form>
    </div>
  )
}
