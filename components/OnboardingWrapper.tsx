import dynamic from 'next/dynamic'
import { createContext, ReactNode, useContext, useState } from 'react'

const OnboardingModal = dynamic(() => import('./User/Modal/OnboardingModal').then(mod => mod.OnboardingModal))

export const OnboardContext = createContext({
  openOnboardModal: false,
  setOpenOnboardingModal: (value: boolean) => console.log('Init context', value),
})

export const OnboardContextProvider = ({ children }: { children: ReactNode }) => {
  const [openOnboardModal, setOpenOnboardingModal] = useState(false)

  return (
    <OnboardContext.Provider
      value={{
        openOnboardModal,
        setOpenOnboardingModal,
      }}
    >
      {children}
    </OnboardContext.Provider>
  )
}

export const useOnboard = () => useContext(OnboardContext)

export const OnboardWrapper = () => {
  return <OnboardingModal />
}
