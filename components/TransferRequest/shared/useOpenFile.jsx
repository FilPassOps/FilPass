import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { LoadingIndicator } from 'components/shared/LoadingIndicator'
import { api } from 'lib/api'
import { classNames } from 'lib/classNames'
import { useState } from 'react'

export const useOpenFile = ({ fileId, uploadingForOthers }) => {
  const [loadingFile, setLoadingFile] = useState(false)
  const [fileError, setFileError] = useState(false)

  const apiCall = async () => {
    if (uploadingForOthers) {
      return await api.get(`/files/temporary/${fileId}`)
    }

    return await api.get(`/files/${fileId}`)
  }

  const handleOpenFile = async () => {
    const newWindow = window.open('', '_blank')
    setFileError(false)
    setLoadingFile(true)

    const { data, error } = await apiCall()
    setLoadingFile(false)

    if (error) {
      setFileError(true)
      return
    }

    const { file, info } = data
    const [mime] = info
    const pdfBlob = new Blob([new Uint8Array(file.data).buffer], { type: mime })
    const objectURL = URL.createObjectURL(pdfBlob, { type: mime })
    newWindow.location = objectURL
  }

  return {
    loadingFile,
    fileError,
    handleOpenFile,
  }
}

export const OpenFile = ({ fileId, filename, type = 'application/pdf' }) => {
  const { loadingFile, fileError, handleOpenFile } = useOpenFile({ fileId, type })

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
          onClick={handleOpenFile}
        >
          {filename}
        </button>
        {loadingFile && <LoadingIndicator className="text-indigo-500 ml-2" />}
      </div>
      {fileError && <p className="text-red-500 text-sm">Failed to load file. Please, try again.</p>}
    </>
  )
}
