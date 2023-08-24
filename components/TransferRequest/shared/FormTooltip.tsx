import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid'
import { Button } from 'components/shared/Button'
import { Modal } from 'components/shared/Modal'
import { useState } from 'react'

interface FormTooltipProps {
  type: 'W9_FORM' | 'W8_FORM'
}

export const FormTooltip = ({ type }: FormTooltipProps) => {
  const [modalOpen, setModalOpen] = useState(false)
  return (
    <>
      <div className="cursor-pointer" onClick={() => setModalOpen(true)}>
        <QuestionMarkCircleIcon className="h-5 w-5 text-indigo-500" />
      </div>

      <Modal open={modalOpen} onModalClosed={() => setModalOpen(false)}>
        <div className="space-y-7">
          {type === 'W9_FORM' ? <W9Form /> : <W8Form />}
          <Button onClick={() => setModalOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  )
}

const W9Form = () => (
  <div className="space-y-7 text-gray-500 text-sm">
    <h2 className="font-medium text-lg text-gray-900 text-center">About Form W9</h2>

    <p>
      As a U.S. resident, you will need to complete and sign a Form W-9 before we can deliver your tokens. At the end of the tax year, you
      will receive an IRS form 1099.
    </p>
    <p>You can find a blank IRS form W-9 here:</p>
    <a className="text-indigo-500" href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" rel="noopener noreferrer">
      https://www.irs.gov/pub/irs-pdf/fw9.pdf
    </a>
  </div>
)

const W8Form = () => (
  <div className="space-y-7 text-gray-500 text-sm">
    <h2 className="font-medium text-lg text-gray-900 text-center">About Form W8</h2>
    <p>
      Please complete and upload a form W-8. Choose one of five types, depending on your entity. We encourage you to consult with your own
      tax or financial adviser to determine which form is appropriate for you.
    </p>
    {w8bullets.map(item => (
      <div key={item.description}>
        <p>{item.description}</p>
        <p>
          Instructions:{' '}
          <a className="text-indigo-500" target="_blank" rel="noopener noreferrer" href={item.instructions}>
            {item.instructions}
          </a>
        </p>
        <p>
          Form:{' '}
          <a className="text-indigo-500" target="_blank" rel="noopener noreferrer" href={item.form}>
            {item.form}
          </a>
        </p>
      </div>
    ))}
    <p>
      The IRS requires us to withhold FIL from payments to non-U.S. citizens who live outside of the United States unless we can associate
      the payee with a completed, signed form W-8.
    </p>
  </div>
)

const w8bullets = [
  {
    description:
      '1. W-8-BEN, Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting (Individuals).',
    instructions: 'https://www.irs.gov/instructions/iw8ben',
    form: 'https://www.irs.gov/pub/irs-pdf/fw8ben.pdf',
  },
  {
    description: '2. W-8-BEN-E, Certificate of Status of Beneficial Owner for United States Tax Withholding and Reporting (Entities).',
    instructions: 'https://www.irs.gov/instructions/iw8bene',
    form: 'https://www.irs.gov/pub/irs-pdf/fw8bene.pdf',
  },
  {
    description:
      '3. W-8-ECI, Certificate of Foreign Person’s Claim That Income is Effectively Connected With the Conduct of a Trade or Business in the United States.',
    instructions: 'https://www.irs.gov/pub/irs-pdf/iw8eci.pdf',
    form: 'https://www.irs.gov/pub/irs-pdf/fw8eci.pdf',
  },
  {
    description:
      '4. W-8-EXP, Certificate of Foreign Government or Other Foreign Organization for United States Tax Withholding and Reporting.',
    instructions: 'https://www.irs.gov/pub/irs-pdf/iw8exp.pdf',
    form: 'https://www.irs.gov/pub/irs-pdf/fw8exp.pdf',
  },
  {
    description:
      '5. W-8-IMY, Certificate of Foreign Intermediary, Foreign Flow-Through Entity, or Certain U.S. Branches for United States Tax Withholding and Reporting.',
    instructions: 'https://www.irs.gov/individuals/international-taxpayers/form-w-8imy',
    form: 'https://www.irs.gov/pub/irs-pdf/fw8imy.pdf',
  },
]
