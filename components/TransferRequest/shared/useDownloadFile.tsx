import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
import { classNames } from 'lib/classNames'
import { DateTime } from 'luxon'
import { useState } from 'react'

interface UseDownloadFileProps {
  fileId: string
  uploadingForOthers?: boolean
  fileName?: string
}

export const useDownloadFile = ({ fileId, uploadingForOthers = false, fileName }: UseDownloadFileProps) => {
  const [loadingFile, setLoadingFile] = useState(false)
  const [fileError, setFileError] = useState(false)

  const apiCall = async () => {
    if (uploadingForOthers) {
      return await api.get(`/files/temporary/${fileId}`)
    }

    return await api.get(`/files/${fileId}`)
  }

  const handleDownloadFile = async () => {
    setLoadingFile(true)
    const { data, error } = await apiCall()

    if (error || !data.file?.data || !data.info?.length) {
      setFileError(true)
      setLoadingFile(false)

      return
    }
    console.log(data)
    setLoadingFile(false)

    const buffer = Buffer.from(data.file.data, 'base64')

    return JsFileDownload(buffer, fileName || `${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}-tax`, data.info[0])
  }

  return {
    loadingFile,
    fileError,
    handleDownloadFile,
  }
}

interface DownloadFileProps {
  fileId: string
  filename?: string
  uploadingForOthers?: boolean
}

export const DownloadFile = ({ fileId, filename, uploadingForOthers = false }: DownloadFileProps) => {
  const { loadingFile, fileError, handleDownloadFile } = useDownloadFile({ fileId, uploadingForOthers, fileName: filename })

  return (
    <>
      <div className="flex items-center">
        <DocumentTextIcon className="w-6 h-6 mr-2 flex-shrink-0" />
        <button
          className={classNames(
            'text-sm text-indigo-500 font-bold hover:underline cursor-pointer',
            loadingFile && 'opacity-50 cursor-wait'
          )}
          disabled={loadingFile}
          onClick={handleDownloadFile}
        >
          {filename}
        </button>
        {loadingFile && <LoadingIndicator className="text-indigo-500 ml-2" />}
      </div>
      {fileError && <p className="text-red-500 text-sm">Failed to download file. Please, try again.</p>}
    </>
  )
}
