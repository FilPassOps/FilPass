import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/shared/Button'
import PersonalInformationFieldGroup, { PersonalInformationFieldGroupValues } from 'components/User/PersonalInformationFieldGroup'
import { personalInformationCheckValidator } from 'domain/user/validation'
import { useForm } from 'react-hook-form'

export type FormValue = PersonalInformationFieldGroupValues

interface OnboardingPersonalInformationProps {
  onBackClick: () => void
  onFormSubmit: (values: FormValue) => void
}

export const OnboardingPersonalInformation = ({ onBackClick, onFormSubmit }: OnboardingPersonalInformationProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValue>({
    resolver: yupResolver(personalInformationCheckValidator),
    shouldFocusError: true,
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: undefined,
      countryResidence: '',
    }
  })

  return (
    <form className="grid auto-rows-min grid-cols-2 gap-x-3 gap-y-6" onSubmit={handleSubmit(onFormSubmit)}>
      <fieldset className="flex flex-col items-center gap-3 col-span-2">
        <legend className="text-center mb-6">
          <h2 className="text-gray-900 font-medium text-lg">Personal Information Check</h2>
          <p className="text-gray-500 font-normal text-sm mt-2">
            Personal Information will be used to verify you can legally receive tokens. This information will not be shared and will only be
            viewed by our compliance team.
          </p>
        </legend>
        <PersonalInformationFieldGroup control={control} register={register} errors={errors} />
      </fieldset>
      <Button variant="outline" disabled={isSubmitting} loading={isSubmitting} onClick={onBackClick}>
        Back
      </Button>
      {/* @ts-ignore */}
      <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
        Next
      </Button>
    </form>
  )
}
