import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { useCurrency } from 'components/Currency/Provider'
import { Button } from 'components/shared/Button'
import { NumberInput, TextInput } from 'components/shared/FormInput'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import { FilecoinIcon } from 'components/shared/icons/chains/FilecoinIcon'
import { updateCurrencyRateValidator } from 'domain/currency/validation'
import { api } from 'lib/api'
import yup from 'lib/yup'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { TOKEN } from 'system.config'

type FormValue = yup.InferType<typeof updateCurrencyRateValidator>

export const TokenPrice = () => {
  const { filecoin, refresh } = useCurrency()
  const [submitErrors, setSubmitErrors] = useState<string | { message: string }>()
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  const updatedAt = DateTime.fromISO(filecoin?.updatedAt).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<yup.InferType<typeof updateCurrencyRateValidator>>({
    resolver: yupResolver(updateCurrencyRateValidator),
    defaultValues: {
      rate: undefined,
      name: TOKEN.symbol,
    },
  })
  const { rate, name } = watch()

  useEffect(() => {
    setValue('rate', filecoin?.rate)
  }, [filecoin?.rate, setValue])

  const handleFormSubmit = async (values: FormValue) => {
    if (Object.keys(errors).length > 0) {
      return
    }

    const { error } = await api.patch(`/currency/${values.name}`, values)
    if (error) {
      setSubmitErrors(error.errors)
      return
    }

    refresh()
  }

  const handleRefreshClick = async () => {
    setLoadingRefresh(true)
    const { data, error } = await api.get(`/currency/${name}/market-rate`)
    if (error) {
      setSubmitErrors(error)
      return
    }
    setLoadingRefresh(false)
    setValue('rate', data.rate.toString())
  }

  return (
    <div className="flex flex-col bg-gray-100 p-4">
      <h1 className="font-medium mb-2 text-lg">Token Price</h1>
      <p className="mb-5 text-xs text-gray-500 whitespace-nowrap">Updated: {updatedAt}</p>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="mb-3 relative">
          <FilecoinIcon className="w-6 h-6 absolute left-3 top-2 z-10" />
          <TextInput
            // @ts-ignore
            className="pl-11 pointer-events-none font-medium text-gray-600"
            readOnly
            value={TOKEN.symbol}
          />
        </div>
        <div className="mb-3 relative">
          <span className="absolute z-10 left-3 top-1.5 font-medium text-gray-600">$</span>
          <NumberInput
            // @ts-ignore
            className="pl-7 pr-10"
            rightIcon={
              <>
                {loadingRefresh ? (
                  <LoadingIndicator className="text-indigo-500" />
                ) : (
                  <ArrowPathIcon className="h-5 w-5 text-indigo-500 cursor-pointer" onClick={handleRefreshClick} />
                )}
              </>
            }
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
