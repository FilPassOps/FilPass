import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/shared/Button'
import { CheckRadioInput } from 'components/shared/FormInput'
import { SelectFormFileInput } from 'components/TransferRequest/TransferRequestForm/SelectFormFileInput'
import { taxFormValidator } from 'domain/user/validation'
import yup from 'lib/yup'
import { useForm } from 'react-hook-form'

export type FormValue = yup.Asserts<typeof taxFormValidator>

interface TaxFormsProps {
  onFormSubmit: (values: FormValue) => Promise<void>
}

export const TaxForm = ({ onFormSubmit }: TaxFormsProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: yupResolver(taxFormValidator),
    shouldFocusError: true,
  })

  const { isUSResident, userFileId } = watch()

  return (
    <form
      className="w-full"
      onSubmit={handleSubmit(async values => {
        await onFormSubmit(values as FormValue)
        reset()
      })}
    >
      <div className="w-full flex flex-col md:flex-row items-start gap-4">
        <div className="w-full md:w-1/2 flex items-start">
          <div>
            <CheckRadioInput
              // @ts-ignore
              label="Are you a US Resident?"
              options={['Yes', 'No']}
              value={isUSResident}
              error={errors.isUSResident}
              {...register('isUSResident', {
                onChange: () => setValue('userFileId', ''),
              })}
            />
            <ErrorMessage message={errors?.isUSResident?.message?.toString()} />
          </div>
        </div>
        <div>
          <SelectFormFileInput
            isUSResident={isUSResident}
            userFileId={userFileId}
            setUserFileId={(value: string) => {
              setValue('userFileId', value)
              clearErrors('userFileId')
            }}
          />
          <ErrorMessage message={errors?.userFileId?.message?.toString()} />
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <Button className="w-24  ml-auto" variant="outline" disabled={isSubmitting} loading={isSubmitting} onClick={() => reset()}>
          Cancel
        </Button>
        {/* @ts-ignore */}
        <Button className="w-40" type="submit" disabled={isSubmitting || !isDirty} loading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}

const ErrorMessage = ({ message }: { message: string | undefined }) => {
  if (!message) return null

  return <div className="text-sm text-red-600 font-medium py-1">{message}</div>
}
