import { api } from 'lib/api'
import { useEffect, useState } from 'react'

export const useAssociatedRequests = ({ programId, isEditable }) => {
  const [hasAssociatedRequests, setAssociatedRequests] = useState(isEditable)

  const checkAssociatedRequests = async () => {
    if (!programId && !isEditable) return setAssociatedRequests(false)
    setAssociatedRequests(true)

    const { data, error } = await api.get(`/programs/${programId}/associated-requests`)
    if (error) {
      console.error(error)
      return
    }
    setAssociatedRequests(data.length > 0)
  }

  useEffect(() => {
    checkAssociatedRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId])

  return { hasAssociatedRequests }
}
