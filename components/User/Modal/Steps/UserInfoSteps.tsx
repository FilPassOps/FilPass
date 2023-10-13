import { CheckIcon } from '@heroicons/react/24/solid'
import { useAuth } from 'components/Authentication/Provider'
import { LoadingIndicator } from 'components/Shared-tmp/LoadingIndicator'
import { api } from 'lib/api'
import _ from 'lodash'
import { UpdateUserResponse } from 'pages/api/users/current'
import { Fragment, ReactNode, useEffect, useState } from 'react'
import { OnboardingTermsAndConditions, FormValue as TermsAndConditionsData } from './UserInfo/OnboardingTermsAndConditions'

export interface UserInfoStepsProps {
  toBeginning: () => void
  toEnd: () => void
  totalSteps: number
}

export const UserInfoSteps = ({ toBeginning, toEnd, totalSteps }: UserInfoStepsProps) => {
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditionsData>()

  useEffect(() => {
    async function sendData() {
      try {
        const result = await api.post<UpdateUserResponse>('/users/current', {
          terms: termsAndConditions?.terms,
          isOnboarded: true,
        })
        if (result.status !== 200) {
          alert('Please try again later')
        }
      } catch (error) {
        alert('Please try again later')
        console.error(error)
      } finally {
        toEnd()
      }
    }

    if (totalSteps === activeStep) {
      sendData()
    }
  }, [activeStep, termsAndConditions, toEnd, totalSteps])

  const handleBackClick = () => {
    if (activeStep === 0) {
      toBeginning()
    } else {
      setActiveStep(curr => --curr)
    }
  }

  const handleNextStep = async () => {
    setActiveStep(curr => ++curr)
  }

  const onTermsAndConditionsSubmit = (values: TermsAndConditionsData) => {
    setTermsAndConditions(values)
    handleNextStep()
  }

  const steps = [
    {
      show: !user?.terms,
      widget: <OnboardingTermsAndConditions onBackClick={handleBackClick} onFormSubmit={onTermsAndConditionsSubmit} />,
    },
  ]

  const widgetsToShow = steps.filter(widget => widget.show)

  return (
    <div>
      {totalSteps > 1 && (
        <div className="flex justify-center items-center pb-6">
          {_.range(totalSteps).map(index => (
            <Fragment key={index}>
              <Stepper done={activeStep > index} active={activeStep === index} />
              {index + 1 < totalSteps && <Separator done={activeStep > index} />}
            </Fragment>
          ))}
        </div>
      )}
      {widgetsToShow.map((widget, index) => (
        <StepWrapper key={index} active={activeStep === index}>
          {widget.widget}
        </StepWrapper>
      ))}
      <StepWrapper active={activeStep === totalSteps}>
        <div className="flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col gap-4 items-center py-28">
            <LoadingIndicator className="text-indigo-600 h-8 w-8" />
            <p className="text-gray-800 font-normal">Saving</p>
          </div>
        </div>
      </StepWrapper>
    </div>
  )
}

const StepWrapper = ({ active, children }: { active: boolean; children: ReactNode }) => (
  <div className={active ? 'block' : 'hidden'}>{children}</div>
)
const Separator = ({ done }: { done: boolean }) => <div className={`${done ? 'bg-indigo-600' : 'bg-gray-200'} h-0.5  w-20`}></div>

const Stepper = ({ done, active }: { done: boolean; active: boolean }) => {
  if (active) {
    return (
      <div className="h-8 w-8 rounded-full border-2 border-indigo-600 flex items-center justify-center">
        <div className="h-2.5 w-2.5 rounded-full border-2 border-indigo-600 bg-indigo-600"></div>
      </div>
    )
  }
  if (done) {
    return (
      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white px-1">
        <CheckIcon />
      </div>
    )
  }
  return <div className="h-8 w-8 rounded-full border-2 border-gray-300"></div>
}
