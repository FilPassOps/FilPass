import JsFileDownload from 'js-file-download'
import { api } from 'lib/api'
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
    setLoadingFile(false)

    const buffer = Buffer.from(data.file.data, 'base64')

    return JsFileDownload(buffer, fileName || `${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}`, data.info[0])
  }

  return {
    loadingFile,
    fileError,
    handleDownloadFile,
  }
}
