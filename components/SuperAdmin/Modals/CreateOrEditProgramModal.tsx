import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/shared/Button'
import { MultipleSelectInput, SelectInput, TextInput } from 'components/shared/FormInput'
import { Modal } from 'components/shared/Modal'
import { PROGRAM_TYPE_EXTERNAL, PROGRAM_TYPE_INTERNAL } from 'domain/programs/constants'
import { createProgramFormValidator } from 'domain/programs/validation'
import { Controller, SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { useAssociatedRequests } from '../shared/useAssociatedRequests'
import { useCreateOrEditProgramSubmit } from '../shared/useCreateOrEditProgramSubmit'
import { useEditableProgram } from '../shared/useEditableProgram'
import { useSetProgramCurrency } from '../shared/useSetProgramCurrency'
import { deliveryMethodOptions, generateApproversRoleOptions, generateViewersRoleOptions, paymentMethodOptions } from '../shared/utils'

interface CreateOrEditProgramModalProps {
  open: boolean
  onModalClosed: () => void
  approversData?: {
    roleId: number
    roleName: string
    roleDescription: string
  }[]
  viewersData?: {
    roleId: number
    roleName: string
    roleDescription: string
  }[]

  program?: {
    id: number
    name: string
    paymentMethod: string
    deliveryMethod: string
    approversRole: {
      roleId: number
      roleName: string
      roleDescription: string
    }[]
    viewersRole: {
      roleId: number
      roleName: string
      roleDescription: string
    }[]
    programCurrency: {
      name: string
      type: string
    }[]
    visibility: string
    signersWalletAddresses: { address: string }[]
    isArchived: boolean
  }

  isEditable?: boolean
  refreshPrograms: () => void
}

export const CreateOrEditProgramModal = ({
  open,
  onModalClosed,
  approversData = [],
  viewersData = [],
  program,
  isEditable = false,
  refreshPrograms,
}: CreateOrEditProgramModalProps) => {
  const approversRoleOptions = generateApproversRoleOptions(approversData)
  const viewersRoleOptions = generateViewersRoleOptions(viewersData)
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
    clearErrors,
  } = useForm({
    resolver: yupResolver(createProgramFormValidator),
    shouldFocusError: false,
    defaultValues: {
      name: '',
      paymentMethod: undefined,
      deliveryMethod: undefined,
      approversRole: [[]],
      viewersRole: [],
      programCurrency: [],
      visibility: undefined,
      signersWalletAddresses: [{ address: '' }],
    },
  })

  const {
    fields: approversRoleFields,
    remove: approversRoleRemove,
    append: approversRoleAppend,
  } = useFieldArray({
    control: control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'approversRole', // unique name for your Field Array
  })

  const {
    fields: signersWalletAddressesFields,
    remove: signersWalletAddressesRemove,
    append: signersWalletAddressesAppend,
  } = useFieldArray({
    control: control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'signersWalletAddresses', // unique name for your Field Array
  })

  const { paymentMethod, approversRole, signersWalletAddresses } = watch()

  useEditableProgram({ program, isEditable, setValue })

  useSetProgramCurrency({ setValue, paymentMethodOptions, paymentMethod })
  const { handleFormSubmit, setSubmitErrors, submitErrors } = useCreateOrEditProgramSubmit({
    onModalClosed,
    reset,
    isEditable,
    programId: program?.id ? String(program?.id) : undefined,
    refreshPrograms,
    dirtyFields,
    isArchived: program?.isArchived,
  })
  const { hasAssociatedRequests } = useAssociatedRequests({ programId: program?.id as number, isEditable })

  const handleClose = () => {
    setSubmitErrors(null)
    clearErrors()
    onModalClosed()
    setTimeout(() => reset(), 300)
  }

  return (
    <Modal className="rounded-md px-4 pt-5 pb-4 sm:p-6 w-full sm:max-w-xl" open={open} onModalClosed={handleClose} isPersistent>
      <div className="space-y-9 text-center">
        <h2 className="text-gray-900 text-lg font-medium">
          {isEditable ? `Edit ${program?.isArchived ? 'Archived' : ''} Program` : 'Create New Program'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<any>)} className="flex flex-col text-left space-y-5">
          <TextInput
            id="name"
            autoComplete="off"
            label="Program Name"
            placeholder="Enter program name"
            error={errors.name || submitErrors?.name}
            disabled={program?.isArchived}
            {...register('name')}
          />

          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <SelectInput
                {...field}
                id="visibility"
                placeholder="Select the program type"
                name="visibility"
                options={[
                  { value: PROGRAM_TYPE_EXTERNAL, label: 'External' },
                  { value: PROGRAM_TYPE_INTERNAL, label: 'Internal' },
                ]}
                label="Program Type"
                error={errors?.visibility || submitErrors?.visibility}
                disabled={program?.isArchived || hasAssociatedRequests}
              />
            )}
          />

          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <SelectInput
                {...field}
                id="paymentMethod"
                placeholder="Select the payment method"
                name="paymentMethod"
                options={paymentMethodOptions}
                label="Payment Method"
                error={errors?.paymentMethod || submitErrors?.paymentMethod}
                disabled={program?.isArchived || hasAssociatedRequests}
              />
            )}
          />

          <Controller
            control={control}
            name="deliveryMethod"
            render={({ field }) => (
              <SelectInput
                {...field}
                id="deliveryMethod"
                name="deliveryMethod"
                placeholder="Select the delivery method"
                options={deliveryMethodOptions}
                label="Delivery Method"
                error={errors.deliveryMethod || submitErrors?.deliveryMethod}
                disabled={program?.isArchived || hasAssociatedRequests}
              />
            )}
          />

          <fieldset>
            <div className="flex justify-between items-center text-sm font-medium leading-5">
              <legend className="text-gray-700">Approver(s)</legend>
              <div className="max-w-xs">
                <Button
                  className="text-indigo-700"
                  type="button"
                  variant="none"
                  toolTipText={program?.isArchived ? '' : 'Add up to three groups'}
                  onClick={() => approversRoleAppend([[]])}
                  disabled={approversRole.length > 2 || program?.isArchived}
                >
                  <div className="flex gap-1">
                    <PlusCircleIcon width={18} /> Add group
                  </div>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {approversRoleFields.map((field, idx) => {
                const options = [
                  ...approversRole[idx],
                  ...approversRoleOptions.filter(
                    (option: { roleId: number }) => !approversRole.flat().some(role => role?.roleId === option.roleId),
                  ),
                ]
                return (
                  <div className="flex gap-2" key={field.id}>
                    <Controller
                      control={control}
                      name={`approversRole.${idx}`}
                      render={({ field }) => (
                        <MultipleSelectInput
                          {...field}
                          options={options}
                          id={`approversRole.${idx}`}
                          placeholder={options.length ? 'Select the approver' : 'There are no approvers left to add to this group'}
                          error={errors?.approversRole || submitErrors?.approversRole}
                          disabled={program?.isArchived}
                        />
                      )}
                    />
                    {idx > 0 && !program?.isArchived && (
                      <button onClick={() => confirm('Delete this item?') && approversRoleRemove(idx)}>
                        <TrashIcon aria-label="Remove group" className="w-5 text-red-600" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          <Controller
            control={control}
            name="viewersRole"
            render={({ field }) => (
              <MultipleSelectInput
                {...field}
                label="Viewer(s)"
                id="viewersRole"
                options={viewersRoleOptions}
                placeholder={viewersRoleOptions.length ? 'Select the viewer' : 'No options available'}
                error={errors?.viewersRole || submitErrors?.viewersRole}
              />
            )}
          />

          <fieldset>
            <div className="flex justify-between items-center text-sm font-medium leading-5">
              <legend className="text-gray-700">Program Wallet(s)</legend>
              <div className="max-w-xs">
                <Button
                  className="text-indigo-700"
                  type="button"
                  variant="none"
                  toolTipText={program?.isArchived ? '' : 'Add up to five wallets'}
                  onClick={() => signersWalletAddressesAppend({ address: '' })}
                  disabled={program?.isArchived || (signersWalletAddresses && signersWalletAddresses.length > 4) || hasAssociatedRequests}
                >
                  <div className="flex gap-1">
                    <PlusCircleIcon width={18} /> Add wallet
                  </div>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {signersWalletAddressesFields.map((field, idx) => {
                return (
                  <div className="flex gap-2" key={field.id} style={{ maxWidth: '464px' }}>
                    <TextInput
                      id={`signersWalletAddresses.${idx}.address`}
                      placeholder="Enter program wallet"
                      error={errors?.signersWalletAddresses?.[idx]?.address || submitErrors?.signersWalletAddresses?.[idx]?.address}
                      {...register(`signersWalletAddresses.${idx}.address`)}
                      disabled={program?.isArchived || hasAssociatedRequests}
                    />
                    {idx > 0 && !program?.isArchived && !hasAssociatedRequests && (
                      <button onClick={() => confirm('Delete this item?') && signersWalletAddressesRemove(idx)}>
                        <TrashIcon aria-label="Remove wallet" className="w-5 text-red-600" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          <div className="flex space-x-3 mt-1">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
