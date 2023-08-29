import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Url } from 'node:url'

interface GoBackConfirmationProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  confirmGoBack: () => void
}

export const GoBackConfirmationWithRouter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectRoute, setRedirectRoute] = useState<Url>()
  const { beforePopState, replace, pathname } = useRouter()

  useEffect(() => {
    if (window) {
      beforePopState(({ as: asUrl }) => {
        if (asUrl === pathname || asUrl === '/my-transfer-requests') {
          return true
        }
        setRedirectRoute(asUrl as unknown as Url)
        setIsOpen(true)
        return false
      })
    }

    return () => {
      beforePopState(() => true)
    }
  }, [beforePopState, pathname])

  const confirmGoBack = () => {
    replace(redirectRoute as Url)
  }

  return <GoBackConfirmation isOpen={isOpen} confirmGoBack={confirmGoBack} setIsOpen={setIsOpen} />
}

export const GoBackConfirmation = ({ isOpen, setIsOpen, confirmGoBack }: GoBackConfirmationProps) => {
  return (
    <Modal open={isOpen} onModalClosed={() => setIsOpen(false)}>
      <h2 className="text-gray-900 text-lg text-center font-medium mb-9">Leave Page</h2>
      <p className="text-gray-500 text-sm mb-9 text-center">You will lose any unsaved changes, are you sure you want to leave?</p>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="button" onClick={confirmGoBack}>
          Leave Page
        </Button>
      </div>
    </Modal>
  )
}
