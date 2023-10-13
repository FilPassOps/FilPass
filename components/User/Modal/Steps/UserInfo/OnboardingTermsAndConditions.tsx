import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/Shared-tmp/Button'
import { TermsCheckboxes } from 'components/TransferRequest/TransferRequestForm/TermsCheckboxes'
import { termsValidator } from 'domain/user/validation'
import yup from 'lib/yup'
import { useForm } from 'react-hook-form'

const validator = yup.object({ terms: termsValidator }).required()

export type FormValue = yup.InferType<typeof validator>

interface OnboardingTermsAndConditionsProps {
  onBackClick: () => void
  onFormSubmit: (values: FormValue) => void
}

export const OnboardingTermsAndConditions = ({ onBackClick, onFormSubmit }: OnboardingTermsAndConditionsProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(validator),
    shouldFocusError: true,
    defaultValues: {
      terms: {
        informedDecision: undefined,
        release: undefined,
        satisfactionOfObligations: undefined,
        soleControl: undefined,
        tax: undefined,
        transferAuthorization: undefined,
        sanctions: undefined,
        walletAddress: undefined,
        informedDecisionText: '',
        releaseText: '',
        satisfactionOfObligationsText: '',
        soleControlText: '',
        taxText: '',
        transferAuthorizationText: '',
        sanctionsText: '',
        walletAddressText: '',
      },
    },
  })

  const { terms } = watch()

  return (
    <form onSubmit={handleSubmit(values => onFormSubmit(values))}>
      <h1 className="text-center text-lg leading-6 font-medium mb-2">Terms & Conditions</h1>
      <p className={`${errors.terms ? 'text-red-500' : 'text-gray-500'} text-sm text-center mb-6`}>
        Indicate your agreement with the following terms and conditions.
      </p>
      <div className="max-h-96 overflow-y-scroll p-1">
        <TermsCheckboxes terms={terms} setValue={setValue} errors={errors} register={register} />
      </div>
      <div className="flex gap-3 pt-4">
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
