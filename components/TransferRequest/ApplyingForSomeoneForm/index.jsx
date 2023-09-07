import { TrashIcon } from '@heroicons/react/24/outline'
import { PlusCircleIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'components/Authentication/Provider'
import { Button } from 'components/shared/Button'
import { Divider } from 'components/shared/Divider'
import { CheckboxInput, TextInput } from 'components/shared/FormInput'
import { GoBackConfirmation } from 'components/shared/GoBackConfirmation'
import { DRAFT_STATUS, SUBMITTED_STATUS } from 'domain/transferRequest/constants'
import {
  createTransferRequestDraftFormValidator,
  createTransferRequestSubmittedFormValidator,
} from 'domain/transferRequestDraft/validation'
import { api } from 'lib/api'
import { WalletSize, getDelegatedAddress } from 'lib/getDelegatedAddress'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { AttachmentInput } from '../TransferRequestForm/AttachmentInput'
import { ProgramInfo } from '../shared/ProgramInfo'
import { RequestAmountInput } from '../shared/RequestAmountInput'
import { RequestorReceiver } from '../shared/RequestorReceiver'
import { SelectProgramInput } from '../shared/SelectProgramInput'
import { useProgramCurrency } from '../shared/useProgramCurrency'

export const ApplyForSomeoneForm = () => {
  const { user } = useAuth()
  const router = useRouter()
  const [submitErrors, setSubmitErrors] = useState()
  const [openConfirmation, setOpenConfirmation] = useState(false)
  const [receiverShouldReview, setReceiverShouldReview] = useState(false)
  const [genericError, setGenericError] = useState('')

  const getResolver = () => {
    return yupResolver(receiverShouldReview ? createTransferRequestDraftFormValidator : createTransferRequestSubmittedFormValidator)
  }

  const {
    control,
    register,
    watch,
    setValue,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    shouldFocusError: false,
    resolver: getResolver(),
    defaultValues: {
      requests: [
        {
          programId: '',
          receiverEmail: '',
          team: '',
          amount: '',
          currencyUnitId: '',
          wallet: '',
          temporaryFileId: undefined,
        },
      ],
    },
  })

  const { fields, insert, remove } = useFieldArray({
    control,
    name: 'requests',
  })

  const { requests } = watch()

  const handleFormSubmit = async values => {
    const { data, error } = await api.post('/transfer-requests/applying-for-others', {
      receiverShouldReview,
      ...values,
    })

    if (error) {
      if (error.status === 500 || error.message) {
        return setGenericError(error.message)
      }

      return setSubmitErrors({ requests: error.errors })
    }

    const hasError = data?.filter(({ error }) => error).length > 0
    if (hasError) {
      return setSubmitErrors(data)
    } else {
      if (receiverShouldReview) {
        return router.replace(`/approvals?status=${DRAFT_STATUS}`)
      }
      return router.replace(`/approvals?status=${SUBMITTED_STATUS}`)
    }
  }

  const handleAddForm = () => {
    if (requests.length < 10) {
      insert(requests.length, {
        programId: '',
        receiverEmail: '',
        team: '',
        amount: '',
        currencyUnitId: '',
      })
    }
  }

  const handleReceiverShouldReview = () => {
    setReceiverShouldReview(prev => !prev)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="py-8 bg-white">
        <RequestorReceiver applyer={user?.email} />
        <Divider className="my-8" />

        <CheckboxInput id="id-ask-review" name="askReview" className="items-center mb-2" value={receiverShouldReview} onChange={handleReceiverShouldReview}>
          <span className="text-gray-700 font-medium text-sm">{`Ask the receivers to review and submit the requests`}</span>
        </CheckboxInput>

        {fields.map((field, index) => (
          <FormComponent
            key={field.id}
            register={register}
            index={index}
            errors={errors}
            submitErrors={submitErrors}
            clearErrors={clearErrors}
            control={control}
            approverPrograms={user?.approverPrograms}
            setValue={setValue}
            requests={requests}
            remove={remove}
            receiverShouldReview={receiverShouldReview}
          />
        ))}
      </div>

      <div className="w-max mb-8 text-left">
        <Button onClick={handleAddForm} disabled={requests.length > 9} toolTipText={requests.length > 9 ? 'Maximum is 10 requests' : ''}>
          <div className="flex justify-center items-center space-x-2">
            <span className="rounded-full text-white">
              <PlusCircleIcon className="h-5 w-5" />
            </span>
            <span className="text-white text-sm font-medium whitespace-nowrap">Add New Request</span>
          </div>
        </Button>
      </div>

      {genericError && <div className="text-red-600">{genericError}</div>}

      <Divider className="mb-5" />
      <div className="flex justify-center space-x-3">
        <>
          <div className="mr-4">
            <Button variant="outline" type="button" onClick={() => setOpenConfirmation(true)}>
              Back
            </Button>
          </div>

          <GoBackConfirmation isOpen={openConfirmation} setIsOpen={setOpenConfirmation} confirmGoBack={() => router.replace(`/`)} />
        </>
        <div>
          <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
            Submit All
          </Button>
        </div>
      </div>
    </form>
  )
}

const FormComponent = ({
  approverPrograms,
  control,
  errors,
  submitErrors,
  clearErrors,
  requests,
  register,
  setValue,
  index,
  remove,
  receiverShouldReview,
}) => {
  const { selectedProgram, paymentCurrency, requestCurrency } = useProgramCurrency({
    programs: approverPrograms,
    programId: requests?.[index].programId,
  })
  const delegatedAddress = getDelegatedAddress(requests[index].wallet, WalletSize.SHORT, selectedProgram?.blockchain.name)

  useEffect(() => {
    if (setValue) {
      setValue(`requests[${index}].currencyUnitId`, requestCurrency?.id)
    }
  }, [requestCurrency?.id, setValue, requests, index])

  useEffect(() => {
    if (receiverShouldReview) setValue(`requests[${index}].wallet`, '')
    clearErrors()
  }, [receiverShouldReview, setValue, index, clearErrors])

  return (
    <div className="bg-almost-white p-4 rounded-lg mt-6 space-y-4">
      <h3 className="text-gray-700 text-sm font-bold flex justify-between items-center">
        Request #00{index + 1}
        {index > 0 && (
          <Button variant="opacity-red" className="flex justify-center items-center w-max" onClick={() => remove(index)}>
            <TrashIcon className="h-4 mr-2" /> Delete
          </Button>
        )}
      </h3>

      {submitErrors?.[index]?.error?.message && <div className="text-red-500 text-sm">{submitErrors[index].error.message}</div>}

      <TextInput
        label={
          <>
            Receiver
            <Asterisk />
          </>
        }
        id="receiverEmail"
        type="email"
        placeholder="Insert receiver email..."
        error={errors.requests?.[index]?.receiverEmail || submitErrors?.requests?.[index]?.receiverEmail}
        {...register(`requests[${index}].receiverEmail`)}
      />

      <SelectProgramInput
        required
        control={control}
        programs={approverPrograms}
        name={`requests[${index}].programId`}
        error={errors.requests?.[index]?.programId || submitErrors?.requests?.[index]?.programId}
      />

      <TextInput
        label="Project Name"
        id="name"
        type="text"
        placeholder="Project/team (as was submitted in the event)"
        error={errors.requests?.[index]?.team || submitErrors?.requests?.[index]?.team}
        {...register(`requests[${index}].team`)}
      />

      <RequestAmountInput
        requestCurrency={requestCurrency}
        errors={errors}
        submitErrors={submitErrors}
        placeholder="Requested amount"
        value={requests[index].amount}
        required={!receiverShouldReview ? <Asterisk /> : ''}
        {...register(`requests[${index}].amount`, {
          setValueAs: val => {
            const parsedValue = String(val).replaceAll(/[, \s]+/g, '')
            return isNaN(parsedValue) ? 0 : parsedValue
          },
        })}
      />

      <div className="space-y-4">
        {!receiverShouldReview && (
          <span>
            <TextInput
              label="Wallet Address"
              id="wallet"
              type="text"
              placeholder="Insert a valid address"
              error={
                errors.requests?.[index]?.wallet || submitErrors?.requests?.[index]?.wallet || submitErrors?.requests?.[index]?.userWalletId
              }
              {...register(`requests[${index}].wallet`)}
            />
            {delegatedAddress?.fullAddress && (
              <p className="text-gray-500 text-sm break-all">{`Equivalent to: ${delegatedAddress.fullAddress}`}</p>
            )}
          </span>
        )}

        <AttachmentInput
          uploadingForOthers={true}
          setUserAttachmentId={val => {
            setValue(`requests[${index}].temporaryFileId`, val)
            clearErrors(`requests[${index}].temporaryFileId`)
          }}
        />

        <ProgramInfo paymentCurrency={paymentCurrency} requestCurrency={requestCurrency} selectedProgram={selectedProgram} />
      </div>
    </div>
  )
}

const Asterisk = () => <span className="text-indigo-500">*</span>
