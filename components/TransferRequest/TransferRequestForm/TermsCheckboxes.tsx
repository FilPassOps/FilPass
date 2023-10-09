import { CheckboxInput } from 'components/shared/FormInput'
import { AppConfig } from 'config'

interface TermsCheckboxesProps {
  errors: any
  terms: {
    transferAuthorization: boolean
    walletAddress: boolean
    soleControl: boolean
    satisfactionOfObligations: boolean
    informedDecision: boolean
    tax: boolean
    release: boolean
    sanctions: boolean
  }
  register: any
  setValue: any
}

interface OnChangeProps {
  key: string
  checked: boolean
  setValue: any
  text: string
}

export const TermsCheckboxes = ({ errors, terms, register, setValue }: TermsCheckboxesProps) => {
  return (
    <div className="space-y-4">
      <CheckboxInput
        id="terms.transferAuthorization"
        value={terms.transferAuthorization || ''}
        error={errors.terms?.transferAuthorization}
        {...register('terms.transferAuthorization', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'transferAuthorization', checked: e.target.checked, setValue, text: transferAuthorizationText }),
        })}
      >
        <p className="text-sm font-medium">Transfer Authorization</p>
        <p className="text-sm text-gray-500">{transferAuthorizationText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.walletAddress"
        value={terms.walletAddress || ''}
        {...register('terms.walletAddress', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'walletAddress', checked: e.target.checked, setValue, text: walletAddressText }),
        })}
        error={errors.terms?.walletAddress}
      >
        <p className="text-sm font-medium">Wallet Address</p>
        <p className="text-sm text-gray-500">{walletAddressText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.soleControl"
        value={terms.soleControl || ''}
        {...register('terms.soleControl', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'soleControl', checked: e.target.checked, setValue, text: soleControlText }),
        })}
        error={errors.terms?.soleControl}
      >
        <p className="text-sm font-medium">Sole Control</p>
        <p className="text-sm text-gray-500">{soleControlText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.satisfactionOfObligations"
        value={terms.satisfactionOfObligations || ''}
        {...register('terms.satisfactionOfObligations', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'satisfactionOfObligations', checked: e.target.checked, setValue, text: satisfactionOfObligationsText }),
        })}
        error={errors.terms?.satisfactionOfObligations}
      >
        <p className="text-sm font-medium">Satisfaction of Obligations</p>
        <p className="text-sm text-gray-500">{satisfactionOfObligationsText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.informedDecision"
        value={terms.informedDecision || ''}
        {...register('terms.informedDecision', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'informedDecision', checked: e.target.checked, setValue, text: informedDecisionText }),
        })}
        error={errors.terms?.informedDecision}
      >
        <p className="text-sm font-medium">Informed Decision</p>
        <p className="text-sm text-gray-500">{informedDecisionText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.tax"
        value={terms.tax || ''}
        {...register('terms.tax', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'tax', checked: e.target.checked, setValue, text: taxText }),
        })}
        error={errors.terms?.tax}
      >
        <p className="text-sm font-medium">Tax</p>
        <p className="text-sm text-gray-500">{taxText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.release"
        value={terms.release || ''}
        error={errors.terms?.release}
        {...register('terms.release', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'release', checked: e.target.checked, setValue, text: releaseText }),
        })}
      >
        <p className="text-sm font-medium">Release</p>
        <p className="text-sm text-gray-500">{releaseText}</p>
      </CheckboxInput>

      <CheckboxInput
        id="terms.sanctions"
        value={terms.sanctions || ''}
        error={errors.terms?.sanctions}
        {...register('terms.sanctions', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ key: 'sanctions', checked: e.target.checked, setValue, text: sanctionsText }),
        })}
      >
        <p className="text-sm font-medium">Sanctions</p>
        <p className="text-sm text-gray-500">{sanctionsText}</p>
      </CheckboxInput>
    </div>
  )
}

const transferAuthorizationText = `You authorize ${AppConfig.app.name} to transfer any and all tokens owed to you to the address you are providing, or to one or more wallets controlled by it. You represent that you own and control the address you are providing.`

const walletAddressText = `You represent that the crypto address you are providing is correct. You are acknowledging that providing an incorrect wallet address could result in unrecoverable loss of some or all of the Crypto assets or tokens that ${AppConfig.app.name} is transferring to you, and that ${AppConfig.app.name} and affiliated entities will not be liable in the event you provide an inaccurate wallet address.`

const soleControlText = `You understand and agree that, once tokens have been transferred to the provided address, the crypto asset or tokens are in your sole control. You agree that ${AppConfig.app.name} will not be responsible for any loss or theft of such tokens after they have been transferred.You represent that the crypto address you are providing is correct. You are acknowledging that providing an incorrect wallet address could result in unrecoverable loss of some or all of the Crypto assets or tokens that ${AppConfig.app.name} is transferring to you, and that ${AppConfig.app.name} and affiliated entities will not be liable in the event you provide an inaccurate wallet address.`

const satisfactionOfObligationsText = `You acknowledge that, upon delivery of the crypto assets or tokens to the wallet address you are providing, such crypto assets or tokens will be deemed to be delivered in full, and the obligations of the Company to deliver such crypto assets or tokens to you will be deemed satisfied.`

const informedDecisionText = `You represent that you have acquired sufficient information about crypto assets or tokens and wallet technology to reach an informed and knowledgeable decision regarding receipt of crypto assets or tokens.`

const taxText = `You acknowledge that transferring tokens to your wallet, and your use of those crypto assets or tokens, may have significant tax consequences and that you are solely responsible for any taxes due as a result of the transfer. You further acknowledge that ${AppConfig.app.name} cannot provide you with tax advice, and recognize that it is your obligation, if you so desire, to seek independent counsel to determine the full extent of your tax liability under applicable laws and regulations. You further acknowledge and agree that ${AppConfig.app.name} shall be entitled to withhold taxes on any transfer, as required by law, in ${AppConfig.app.name} sole discretion.`

const releaseText = `In exchange for good and valuable consideration, the sufficiency of which is hereby acknowledged, you hereby agree to release and forever discharge the Company, its officers, directors, employees and other personnel, shareholders and agents, and their respective affiliates (collectively, the "Released Parties") from all causes of action, expenses (including attorneys' fees and costs), damages, judgments, claims and demands whatsoever, whether known or unknown, now accrued or hereafter accruing, in law or equity, against any Released Party which you ever had, now have, or may in the future have for any claim arising out of the timing of the Company's distribution of crypto assets or tokens to you via the ${AppConfig.app.name} tool. The Company shall work in good faith to distribute crypto assets or tokens owed to you in a timely manner.`

const sanctionsText = `You represent that you (or the entity you represent) are not 50% or more owned or controlled by an individual or entity that is the target of sanctions administered by the Office of Foreign Assets Control of the United States Treasury Department, the United States Department of State, the United Nations Security Council, the European Union, or Her Majesty’s Treasury (collectively, “Sanctions”). You represent and warrant that your conduct related to the payment(s) made via ${AppConfig.app.name} is in compliance with applicable Sanctions in all material respects.`

function onChange({ key, checked, setValue, text }: OnChangeProps) {
  setValue(`terms.${key}`, checked)

  if (checked) {
    setValue(`terms.${key}Text`, text)
  } else {
    setValue(`terms.${key}Text`, '')
  }
}
