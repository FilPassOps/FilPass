import { useAuth } from 'components/Authentication/Provider'
import { useOnboard } from 'components/OnboardingWrapper'
import { Modal } from 'components/shared/Modal'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { OnboardingResult } from './Steps/OnboardingResult'
import { OnboardingStart } from './Steps/OnboardingStart'
import { UserInfoSteps } from './Steps/UserInfoSteps'

export const OnboardingModal = () => {
  const { openOnboardModal, setOpenOnboardingModal } = useOnboard()
  const [activeStep, setActiveStep] = useState(0)
  const { user, refresh } = useAuth()
  const router = useRouter()

  const closeModal = useCallback(() => {
    setOpenOnboardingModal(false)
  }, [setOpenOnboardingModal])

  useEffect(() => {
    closeModal()
    setActiveStep(0)
  }, [closeModal, router])

  const handleSuccess = async () => {
    closeModal()
    refresh()

    setTimeout(() => setActiveStep(0), 500)
  }

  const totalSteps = [!user?.piiUpdatedAt, !user?.terms, !user?.isTaxFormActive].filter(Boolean).length

  return (
    <Modal open={openOnboardModal} onModalClosed={() => {}} isCloseable={false}>
      {activeStep === 0 && <OnboardingStart handleOnNextClick={() => setActiveStep(curr => ++curr)} closeModal={closeModal} />}
      {activeStep === 1 && <UserInfoSteps toBeginning={() => setActiveStep(0)} toEnd={() => setActiveStep(2)} totalSteps={totalSteps} />}
      {activeStep === 2 && <OnboardingResult handleSuccess={handleSuccess} />}
    </Modal>
  )
}
