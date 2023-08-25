import { DocumentMagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'
import { Button } from 'components/shared/Button'
import { UploadFileButton } from 'components/shared/FormInput'
import { api } from 'lib/api'
import { useEffect, useState } from 'react'
import { useDownloadFile } from '../shared/useDownloadFile'
import { DeleteFileModal } from './DeleteFileModal'
import { FilecoinApiResult } from 'domain/utils/sendFILWithMaster'

interface AttachmentInputProps {
  userAttachmentId?: string
  setUserAttachmentId: (id?: string) => void
  uploadingForOthers?: boolean
  setAsActive?: boolean
  type?: string
  label?: string | JSX.Element
  disabled?: boolean
}

interface AttachmentData {
  publicId: string
  filename: string
}

export const AttachmentInput = ({
  userAttachmentId,
  setUserAttachmentId,
  uploadingForOthers,
  setAsActive = true,
  type = 'ATTACHMENT',
  label = 'Attachment (Max 3 MB)',
  disabled = false,
}: AttachmentInputProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [attachmentData, setAttachmentData] = useState<AttachmentData>()
  const [openDeleteFormModal, setOpenDeleteFormModal] = useState(false)
  const [error, setError] = useState<any>()

  const acceptableTypes = ['image/png', 'image/jpeg', 'image/heic', 'application/pdf']

  useEffect(() => {
    if (!userAttachmentId) {
      setAttachmentData(undefined)
    }
  }, [userAttachmentId])

  const apiCall = async (form: FormData) => {
    if (uploadingForOthers) {
      return (await api.postForm('/files/temporary', form)) as FilecoinApiResult
    }

    return (await api.postForm('/files', form)) as FilecoinApiResult
  }

  const handleFileUpload = async (file: any) => {
    if (!file) {
      return
    }

    const maxSize = 3145728
    if (file.size > maxSize) {
      return setError('Maximum file size is 3MB.')
    }

    if (!acceptableTypes.find(type => type === file.type)) {
      return setError('Unsupported file type, please upload a png, jpeg, pdf, heic file.')
    }

    setIsLoading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('data', JSON.stringify({ type, setAsActive }))
    const { error, data } = await apiCall(form)

    if (error) {
      alert('Error while uploading file. Please try again later.')
      return
    }

    setIsLoading(false)
    setAttachmentData(data)
    setUserAttachmentId(data.publicId)
  }

  const { loadingFile, handleDownloadFile } = useDownloadFile({
    fileId: attachmentData?.publicId as string,
    uploadingForOthers,
    fileName: attachmentData?.filename,
  })

  return (
    <>
      <div className="text-sm mb-2">{label}</div>
      {!attachmentData && (
        <UploadFileButton
          onChange={handleFileUpload}
          disabled={disabled || isLoading}
          loading={isLoading}
          accept={acceptableTypes.join(',')}
        >
          Upload
        </UploadFileButton>
      )}
      {attachmentData && (
        <div className="flex items-center gap-6 text-purple-500 text-sm font-bold">
          <div className="flex items-center gap-1">
            <div>
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <p className="flex-1 break-all leading-3">{attachmentData.filename}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="primary-lighter"
              buttonStyle="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 py-1 px-1"
              defaultStyle={false}
              onClick={handleDownloadFile}
              disabled={loadingFile}
            >
              <DocumentMagnifyingGlassIcon width={15} height={15} />
            </Button>
            <Button
              variant="opacity-red"
              buttonStyle="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 py-1 px-1"
              defaultStyle={false}
              onClick={() => {
                setOpenDeleteFormModal(true)
              }}
            >
              <XMarkIcon width={15} height={15} />
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      <DeleteFileModal
        openModal={openDeleteFormModal}
        uploadingForOthers={uploadingForOthers}
        onModalClosed={() => setOpenDeleteFormModal(false)}
        file={attachmentData}
        onDelete={() => {
          setTimeout(() => {
            setUserAttachmentId(undefined)
            setAttachmentData(undefined)
          }, 300)
        }}
      />
    </>
  )
}
