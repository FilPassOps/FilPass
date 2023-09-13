import { yupResolver } from '@hookform/resolvers/yup'
import { DateTime } from 'luxon'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAuth } from 'components/Authentication/Provider'
import { createTransferRequestValidator } from 'domain/transferRequest/validation'

import { Divider } from 'components/shared/Divider'
import { TextInput } from 'components/shared/FormInput'

import { ProgramVisibility } from '@prisma/client'
import { WalletModal } from '../WalletModal'
import { ProgramInfo } from '../shared/ProgramInfo'
import { RequestAmountInput } from '../shared/RequestAmountInput'
import { RequestorReceiver } from '../shared/RequestorReceiver'
import { SelectProgramInput } from '../shared/SelectProgramInput'
import { useProgramCurrency } from '../shared/useProgramCurrency'
import { AttachmentInput } from './AttachmentInput'
import { FooterButtons } from './FooterButtons'
import { SelectWalletInput } from './SelectWalletInput'
import { SubmittedModal } from './SubmittedModal'
import { useFormSubmit } from './useFormSubmit'

interface TransferRequestFormProps {
  isEditable?: boolean
  data?: any
  programs?: any[]
}

export const TransferRequestForm = ({ isEditable = false, data = null, programs = [] }: TransferRequestFormProps) => {
  const { user } = useAuth()
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const [hasUnhandledError, setHasUnhandledError] = useState(false)

  const defaultUserWallet = user?.wallets?.find(wallet => wallet.isDefault)
  const defaultRequestProgram = useMemo(() => {
    if (!data) {
      return
    }

    return {
      name: data.program_name,
      id: data.program_id,
      programCurrency: data.programCurrency,
    }
  }, [data])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createTransferRequestValidator),
    shouldFocusError: true,
    defaultValues: {
      amount: data?.amount || '',
      userAttachmentId: data?.attachment_id || undefined,
      programId: data?.program_id || '',
      userWalletId: data?.wallet_id || defaultUserWallet?.id || '',
      team: data?.team || '',
      expectedTransferDate: data?.expected_transfer_date || DateTime.now().plus({ days: 30 }).toISO(),
    },
  })

  const { amount, expectedTransferDate, programId, userAttachmentId } = watch()

  const { selectedProgram, paymentCurrency, requestCurrency } = useProgramCurrency({
    defaultRequestProgram,
    programs,
    programId: programId || data?.program_id,
  })

  const { submitErrors, openSubmittedModal, handleFormSubmit } = useFormSubmit({
    errors,
    data,
    isEditable,
  })

  useEffect(() => {
    if (requestCurrency) {
      setValue('currencyUnitId', requestCurrency?.id)
      clearErrors('currencyUnitId')
    }
  }, [clearErrors, requestCurrency, setValue])

  useEffect(() => {
    if (submitErrors) {
      setHasUnhandledError(
        (!!submitErrors?.errors && !submitErrors.errors.type) || (!!submitErrors?.errors && submitErrors.errors.type !== 'internal'),
      )
    }
  }, [submitErrors])

  const currencyUnitIdRegister = register('currencyUnitId')

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="py-8 bg-white">
          <RequestorReceiver
            applyer={data?.applyer || user?.email}
            receiver={data?.receiver || user?.email}
            issuedOn={data?.created_at}
            expectedTransferDate={expectedTransferDate}
          />
          <Divider className="my-8" />
          <div className="space-y-6">
            <div>
              <input
                type="hidden"
                id="currencyUnitId"
                name={currencyUnitIdRegister.name}
                onChange={currencyUnitIdRegister.onChange}
                onBlur={currencyUnitIdRegister.onBlur}
                //currencyUnitId is a hidden field. The ref prop should not be set to avoid react hook form focusing on an invisible field when there's an error
              />
            </div>
            <div className=" space-y-6">
              {data?.program_visibility === ProgramVisibility.INTERNAL ? (
                <TextInput label="Program" name="program" disabled defaultValue={data?.program_name} />
              ) : (
                <SelectProgramInput control={control} errors={errors} programs={programs} defaultProgram={defaultRequestProgram} />
              )}

              <TextInput
                label="Project Name"
                id="team"
                type="text"
                placeholder="Project/team (as was submitted in the event)"
                error={errors.team}
                {...register('team')}
              />
            </div>

            <SelectWalletInput
              submitErrors={submitErrors?.errors}
              errors={errors}
              data={data}
              control={control}
              onCreateWalletClick={() => setOpenWalletModal(true)}
              blockchainIdFilter={selectedProgram?.blockchainId}
              disabled={!programId}
            />

            <RequestAmountInput
              requestCurrency={requestCurrency}
              value={amount}
              errors={errors}
              {...register('amount', {
                setValueAs: val => {
                  const parsedValue = String(val).replaceAll(/[, \s]+/g, '')
                  return isNaN(Number(parsedValue)) ? 0 : parsedValue
                },
              })}
            />

            <ProgramInfo
              paymentCurrency={paymentCurrency}
              requestCurrency={requestCurrency}
              selectedProgram={selectedProgram}
              expectedTransferDate={expectedTransferDate}
            />

            <div className="w-full sm:max-w-[13rem]">
              <AttachmentInput
                userAttachmentId={userAttachmentId}
                setUserAttachmentId={val => {
                  setValue('userAttachmentId', val)
                  clearErrors('userAttachmentId')
                }}
              />
            </div>
          </div>
        </div>
        <Divider />

        <FooterButtons isEditable={isEditable} data={data} isSubmitting={isSubmitting} reset={reset} />
      </form>

      <WalletModal
        setUserWalletId={(val: number) => {
          setValue('userWalletId', val)
          clearErrors('userWalletId')
        }}
        open={openWalletModal}
        onModalClosed={() => setOpenWalletModal(false)}
        blockchain={selectedProgram?.blockchain.name}
      />

      <SubmittedModal openModal={openSubmittedModal && (!submitErrors || hasUnhandledError)} hasError={hasUnhandledError} />
    </>
  )
}
