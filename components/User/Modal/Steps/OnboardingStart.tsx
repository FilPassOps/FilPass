import { Button } from 'components/Shared-tmp/Button'

interface OnboardingStartProps {
  handleOnNextClick: () => void
  closeModal: () => void
}

export const OnboardingStart = ({ handleOnNextClick, closeModal }: OnboardingStartProps) => {
  const handleOnCancel = () => {
    closeModal()
  }

  return (
    <article className="flex flex-col items-center">
      <strong className="text-lg font-medium text-eerie-black mb-2">A few more steps</strong>
      <p className="text-sm text-auro-metal-saurus font-normal mb-6 text-center">
        Before you create transfer requests, fill out a bit of information.
      </p>
      <div className="flex w-full gap-3">
        <Button variant="outline" onClick={handleOnCancel}>
          Cancel
        </Button>
        <Button onClick={handleOnNextClick}>Next</Button>
      </div>
    </article>
  )
}
