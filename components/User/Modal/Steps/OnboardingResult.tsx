import { CheckIcon } from '@heroicons/react/24/outline'
import { Button } from 'components/shared/Button'

interface OnboardingResultProps {
  handleSuccess: () => void
}

export const OnboardingResult = ({ handleSuccess }: OnboardingResultProps) => {
  return (
    <article className="flex flex-col items-center">
      <div className="rounded-full w-12 h-12 flex justify-center items-center mb-5 bg-green-100">
        <CheckIcon height={20} width={20} color="#059669" />
      </div>
      <strong className="text-lg font-medium text-eerie-black mb-2">You are all set</strong>
      <p className="text-sm text-auro-metal-saurus font-normal mb-6 text-center">
        Make changes to your personal info at any time in Profile & Settings.
      </p>
      <Button onClick={handleSuccess}>Continue</Button>
    </article>
  )
}
