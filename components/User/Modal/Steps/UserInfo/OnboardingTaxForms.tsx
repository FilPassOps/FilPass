import { yupResolver } from '@hookform/resolvers/yup'
import { PageAlert } from 'components/Layout/Alerts'
import { Button } from 'components/shared/Button'
import { CheckRadioInput } from 'components/shared/FormInput'
import { SelectFormFileInput } from 'components/TransferRequest/TransferRequestForm/SelectFormFileInput'
import { taxFormValidator } from 'domain/user/validation'
import yup from 'lib/yup'
import { useForm } from 'react-hook-form'

export type FormValue = yup.Asserts<typeof taxFormValidator>

interface OnboardingTaxFormsProps {
  onBackClick: () => void
  onFormSubmit: (values: FormValue) => void
  isUpdateTaxFormModal?: boolean
}

export const OnboardingTaxForms = ({ onBackClick, onFormSubmit, isUpdateTaxFormModal = false }: OnboardingTaxFormsProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(taxFormValidator),
    shouldFocusError: true,
  })

  const { isUSResident, userFileId } = watch()

  return (
    <form onSubmit={handleSubmit(values => onFormSubmit(values as FormValue))}>
      <h1 className="text-center text-lg leading-6 font-medium mb-2">{isUpdateTaxFormModal && 'Time to Update your '}Form W8 / Form W9</h1>
      <p className={`${errors.isUSResident ? 'text-red-500' : 'text-gray-500'} text-sm text-center mb-6`}>
        State your residency and upload the associated tax form. It&apos;s mandatory to update your tax form if your information changes.
      </p>
      <div className="flex flex-col gap-6 items-center">
        <div>
          <CheckRadioInput
            // @ts-ignore
            checkboxPosition="justify-center"
            formId="onboarding"
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

        <div className="flex flex-col items-center">
          <SelectFormFileInput
            userFileId={userFileId}
            isUSResident={isUSResident}
            setUserFileId={(value: string) => {
              setValue('userFileId', value)
              clearErrors('userFileId')
            }}
          />
          <ErrorMessage message={errors?.userFileId?.message?.toString()} />

          <PageAlert type="info">
            <p>To avoid delays in your approval, please double-check your tax form for the following:</p>
            <ol className="list-disc pl-5">
              <li>The dates must follow a MMDDYYYY</li>
              <li>The form must be signed</li>
            </ol>
          </PageAlert>
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="outline" disabled={isSubmitting} loading={isSubmitting} onClick={onBackClick}>
          Back
        </Button>
        {/* @ts-ignore */}
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Next
        </Button>
      </div>
    </form>
  )
}

const ErrorMessage = ({ message }: { message: string | undefined }) => {
  if (!message) return null

  return <div className="text-sm text-red-600 font-medium py-1">{message}</div>
}
