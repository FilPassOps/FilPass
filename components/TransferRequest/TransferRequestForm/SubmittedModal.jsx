import { LinkButton } from 'components/shared/Button'
import { CheckCircleThinIcon } from 'components/shared/icons/CheckCircleThinIcon'
import { XCircleThinIcon } from 'components/shared/icons/XCircleThinIcon'
import { Modal } from 'components/shared/Modal'

export const SubmittedModal = ({ openModal, hasError }) => {
  return (
    <Modal open={openModal} onModalClosed={() => {}} isCloseable={false}>
      <div className="flex flex-col justify-center items-center sm:p-6">
        {hasError ? (
          <>
            <XCircleThinIcon className="text-red-500 mt-8" />

            <h1 className="my-7 font-bold text-2xl text-center">Sorry!</h1>
            <p className="text-sm text-gray-500 mb-8 text-center">
              Something went wrong while create the transfer request.<br />
              Please try again
            </p>
            <div>
              <LinkButton href="/my-transfer-requests">Try again</LinkButton>
            </div>
          </>
        ) : (
          <>
            <CheckCircleThinIcon className="text-green-500 mt-8" />

            <h1 className="my-12 font-bold text-2xl text-center">Transfer request submitted.</h1>
            <div>
              <LinkButton href="/my-transfer-requests">Check status</LinkButton>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
