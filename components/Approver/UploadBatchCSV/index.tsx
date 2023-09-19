import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { yupResolver } from '@hookform/resolvers/yup'
import { useAuth } from 'components/Authentication/Provider'
import { SelectProgramInput } from 'components/TransferRequest/shared/SelectProgramInput'
import { useProgramCurrency } from 'components/TransferRequest/shared/useProgramCurrency'
import { Button, LinkButton } from 'components/shared/Button'
import { Divider } from 'components/shared/Divider'
import { UploadFileButton } from 'components/shared/FormInput'
import { Modal } from 'components/shared/Modal'
import { CheckCircleThinIcon } from 'components/shared/icons/CheckCircleThinIcon'
import { MAX_INTEGER_VALUE } from 'domain/constants'
import JsFileDownload from 'js-file-download'
import { BaseApiResult, api } from 'lib/api'
import { classNames } from 'lib/classNames'
import yup from 'lib/yup'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { PreviewTable } from './PreviewTable'
import { handleDownloadCSVTemplate } from './csvTemplate'

interface FileData {
  file: {
    data: string
    originalname: string
  }
  requests: {
    Email: string
    Custodian: string
    Name: string
    Amount: string
    'Wallet Address'?: string
    'Should Receiver Review'?: string
    Hash?: string
    Addresses?: string
    programId?: number
  }[]
  hasCustodian: boolean
}

interface ModalComponentProps {
  openModal: boolean
  onModalClosed: () => void
  errors?: any[]
}

interface OpenFileProps {
  file: {
    data: string
    originalname: string
  }
}

interface Form {
  programId: number
  currencyUnitId?: number
}

export const BatchCSV = () => {
  const { user } = useAuth()
  const [uploadErrors, setUploadErrors] = useState<any>()
  const [isLoading, setLoading] = useState(false)
  const [isLoadingSubmit, setLoadingSubmit] = useState(false)
  const [fileData, setFileData] = useState<FileData>()
  const [submitError, setSubmitError] = useState<any>()
  const [modalOpen, setModalOpen] = useState(false)
  const [hasCustodian, setHasCustodian] = useState(false)

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(
      yup.object({
        programId: yup.number().integer().positive().max(MAX_INTEGER_VALUE).required(),
        currencyUnitId: yup.number().integer().positive().max(MAX_INTEGER_VALUE),
      }),
    ),
    defaultValues: {
      programId: undefined,
    },
  })

  const { programId } = watch()

  useEffect(() => {
    setFileData(undefined)
    setUploadErrors(undefined)
  }, [programId])

  const handleUploadCSV = async (file: File) => {
    setUploadErrors(undefined)
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('data', JSON.stringify({ programId }))

    const { error, data } = (await api.postForm('/transfer-requests/upload-csv', formData)) as BaseApiResult

    if (error) {
      setUploadErrors(error.errors)
    }
    setLoading(false)
    setFileData(data)
    setHasCustodian(data?.hasCustodian || false)
  }

  const handleSubmitForm = async (values: Form) => {
    setLoadingSubmit(true)
    if (!programId) return
    setSubmitError(undefined)
    const requests = fileData?.requests?.map((request, index) => {
      const shouldReceiverReviewStr = request['Should Receiver Review']
      return {
        amount: request.Amount,
        receiverEmail: request.Email,
        team: request?.Hash || request?.Name || request.Email,
        wallet: request['Wallet Address'] || request['Addresses'],
        programId: request.programId || values.programId,
        currencyUnitId: values.currencyUnitId,
        shouldReceiverReview: shouldReceiverReviewStr === 'true' || shouldReceiverReviewStr === 'yes' || shouldReceiverReviewStr === '1',
        row: index + 2,
      }
    })

    const { error } = await api.post('/transfer-requests/batch-csv', {
      requests: requests,
    })

    if (error) {
      setSubmitError(error?.errors || [{ message: error?.message }])
    }
    setModalOpen(true)
    setLoadingSubmit(false)
  }
  const { requestCurrency } = useProgramCurrency({
    programs: user?.approverPrograms,
    programId: programId,
  })

  useEffect(() => {
    if (requestCurrency) {
      setValue('currencyUnitId', requestCurrency?.id)
      clearErrors('currencyUnitId')
    }
  }, [clearErrors, requestCurrency, setValue])

  return (
    <>
      <form onSubmit={handleSubmit(handleSubmitForm)}>
        <div className="bg-anti-flash-white rounded-lg p-4 space-y-4">
          <h2 className="text-sm text-gray-700 font-bold">Batch transfer</h2>
          <p className="text-sm text-gray-500">
            Add up to 500 entries at once. Download the CSV template to fill in the details in the correct format.
          </p>
          <div className="max-w-max">
            <Button variant="primary-lighter" onClick={handleDownloadCSVTemplate}>
              Download CSV template
            </Button>
          </div>
          <Divider />
          <SelectProgramInput
            required
            control={control}
            programs={user?.approverPrograms}
            name="programId"
            error={errors.programId as any}
            label="Select Program"
            disabled={hasCustodian}
          />

          {hasCustodian && (
            <div className="my-7 text-sm rounded-lg p-4 space-y-4 text-gamboge-orange bg-papaya-whip">
              {`We detected the CSV you uploaded contains the "Custodian" field, we'll use that field as the program(s) of transfer requests.`}
            </div>
          )}

          <div className="w-48">
            <UploadFileButton onChange={handleUploadCSV} disabled={isLoading || !programId} loading={isLoading} accept=".csv">
              Upload CSV
            </UploadFileButton>
          </div>

          {uploadErrors && (
            <ul className="w-full mt-4 ml-8 space-y-1">
              {uploadErrors?.map((error: any) => (
                <li key={error?.message} className={classNames('text-sm w-full whitespace-nowrap text-red-400 list-disc')}>
                  {error?.message}
                </li>
              ))}
            </ul>
          )}
          {fileData && (
            <div className="w-full space-y-5">
              <DownloadFile file={fileData?.file} />
              <div className="text-green-600 text-sm font-medium flex items-center ml-7">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Upload successful
              </div>
            </div>
          )}
        </div>
        {fileData && <PreviewTable data={fileData?.requests} program={user?.approverPrograms?.find(program => program.id === programId)} />}
        {!fileData && <Divider className="my-8" />}

        <div className="my-8 flex justify-center space-x-3 w-full">
          <div className="max-w-max">
            <LinkButton variant="outline" href="/my-transfer-requests">
              Back
            </LinkButton>
          </div>
          <div>
            <Button type="submit" disabled={!fileData || isLoadingSubmit} loading={isLoadingSubmit}>
              Submit All
            </Button>
          </div>
        </div>
      </form>
      <ModalComponent openModal={modalOpen} onModalClosed={() => setModalOpen(false)} errors={submitError} />
    </>
  )
}

const ModalComponent = ({ openModal, onModalClosed, errors = [] }: ModalComponentProps) => {
  return (
    <Modal
      open={openModal}
      onModalClosed={() => {
        if (errors.length > 0) {
          onModalClosed()
        }
      }}
      isCloseable={errors.length > 0}
    >
      {errors.length === 0 ? (
        <div className="flex flex-col justify-center items-center p-6">
          <CheckCircleThinIcon className="text-green-500 mt-8" />

          <h1 className="my-12 font-bold text-2xl">Transfer requests submitted.</h1>
          <div>
            <LinkButton href="/approvals?status=SUBMITTED">Check status</LinkButton>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col justify-center items-center p-2">
            <h1 className="my-4 font-bold text-1xl">Error creating transfer requests:</h1>
            <div className="w-full my-4 text-center space-y-1">
              {errors?.map(error => (
                <p key={error?.message} className="text-sm w-full text-red-400 list-disc">
                  {error?.message}
                </p>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" onClick={onModalClosed}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

const DownloadFile = ({ file }: OpenFileProps) => {
  const handleDownloadFile = async () => {
    const blob = new Blob([file?.data], { type: 'text/csv' })
    JsFileDownload(blob, file?.originalname || 'Batch-transfer-request.csv')
  }
  return (
    <div className="flex items-center">
      <DocumentTextIcon className="w-6 h-6 mr-2" />
      <button type="button" className="text-sm text-indigo-500 font-bold hover:underline cursor-pointer" onClick={handleDownloadFile}>
        {file?.originalname}
      </button>
    </div>
  )
}
