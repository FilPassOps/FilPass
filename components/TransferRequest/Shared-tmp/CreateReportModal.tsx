import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from 'components/Shared-tmp/Button'
import { CheckboxInput, SelectInput } from 'components/Shared-tmp/FormInput'
import { Modal } from 'components/Shared-tmp/Modal'
import { PAID_STATUS } from 'domain/transfer-request/constants'
import { createReportValidator } from 'domain/transfer-request/validation'
import yup from 'lib/yup'
import { Controller, useForm } from 'react-hook-form'

export interface CreateReportModalProps {
  open: boolean
  onModalClosed: () => void
  totalItems: number
  pageSize: number
  page: number
  showPaidStatusColumns: boolean
  isDisbursement?: boolean
  status?: string
  handleDownloadCSV: (values: CreateReportFieldValues) => Promise<void>
}

export type CreateReportFieldValues = yup.InferType<typeof createReportValidator>

type PageValues = 'SINGLE_PAGE' | 'ALL'

interface PageSelectorItemsType {
  label: string
  value: PageValues
}

export const CreateReportModal = ({
  open,
  onModalClosed,
  totalItems,
  pageSize,
  page,
  showPaidStatusColumns,
  handleDownloadCSV,
  isDisbursement = false,
  status,
}: CreateReportModalProps) => {
  const pageSelectorItems = [
    {
      label: `From current page (Items ${page * pageSize - pageSize + 1}-${pageSize * page > totalItems ? totalItems : pageSize * page})`,
      value: 'SINGLE_PAGE',
    },
    {
      label: `From all items in table (Items 1-${totalItems})`,
      value: 'ALL',
    },
  ] as PageSelectorItemsType[]

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportFieldValues>({
    resolver: yupResolver(createReportValidator),
    shouldFocusError: true,
    defaultValues: {
      pageSelected: 'SINGLE_PAGE',
      columns: {
        address: true,
        amount: true,
        createDate: true,
        name: true,
        number: true,
        program: true,
        status: true,
        receiverEmail: isDisbursement && showPaidStatusColumns,
        paidFilAmount: showPaidStatusColumns,
        filfoxLink: showPaidStatusColumns,
      },
    },
  })

  const onFormSubmit = async (values: CreateReportFieldValues) => {
    await handleDownloadCSV(values)
  }

  return (
    <Modal open={open} onModalClosed={onModalClosed} isCloseable>
      <h2 className="text-gray-900 text-lg text-center font-medium mb-6">Create Report</h2>
      <form className="space-y-6" onSubmit={handleSubmit(onFormSubmit)}>
        <Controller
          control={control}
          name="pageSelected"
          render={({ field }) => (
            <SelectInput
              {...field}
              // @ts-ignore
              id="pageSelected"
              name="pageSelected"
              options={pageSelectorItems}
              label="Select page"
              error={errors.pageSelected}
            />
          )}
        />
        <fieldset className="space-y-4">
          <legend className="text-gray-700 font-medium text-base">Select the columns to be included in your export:</legend>
          {errors.columns && (
            <p role="alert" className="mt-1 text-sm text-red-500">
              {errors.columns?.message}
            </p>
          )}
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="number" {...register('columns.number')}>
            <span className="text-gray-700 font-medium text-sm">Number</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="program" {...register('columns.program')}>
            <span className="text-gray-700 font-medium text-sm">Program</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="name" {...register('columns.name')}>
            <span className="text-gray-700 font-medium text-sm">Name</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="createDate" {...register('columns.createDate')}>
            <span className="text-gray-700 font-medium text-sm">{isDisbursement && status === PAID_STATUS ? 'Paid' : 'Create'} Date</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="address" {...register('columns.address')}>
            <span className="text-gray-700 font-medium text-sm">Address</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="amount" {...register('columns.amount')}>
            <span className="text-gray-700 font-medium text-sm">Amount</span>
          </CheckboxInput>
          {/* @ts-ignore */}
          <CheckboxInput className="items-center" id="status" {...register('columns.status')}>
            <span className="text-gray-700 font-medium text-sm">Status</span>
          </CheckboxInput>
          {showPaidStatusColumns && (
            <>
              {isDisbursement && (
                // @ts-ignore
                <CheckboxInput className="items-center" id="receiverEmail" {...register('columns.receiverEmail')}>
                  <span className="text-gray-700 font-medium text-sm">Receiver Email</span>
                </CheckboxInput>
              )}
              {/* @ts-ignore */}
              <CheckboxInput className="items-center" id="filAmount" {...register('columns.paidFilAmount')}>
                <span className="text-gray-700 font-medium text-sm">Paid FIL Amount</span>
              </CheckboxInput>
              {/* @ts-ignore */}
              <CheckboxInput className="items-center" id="filfoxLink" {...register('columns.filfoxLink')}>
                <span className="text-gray-700 font-medium text-sm">Filfox link</span>
              </CheckboxInput>
            </>
          )}
          <div className="flex space-x-3 pt-1">
            <Button variant="outline" onClick={onModalClosed}>
              Cancel
            </Button>
            {/* @ts-ignore */}
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              <div className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-5" />
                Download as CSV
              </div>
            </Button>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
