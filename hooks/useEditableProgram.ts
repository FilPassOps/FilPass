import { useEffect } from 'react'
import {
  formatProgramApproversRole,
  formatProgramViewersRole,
  formatRequestPaymentToken,
} from '../components/SuperAdmin/Shared/utils'
import { USD } from 'domain/currency/constants'
import { REQUEST_TOKEN } from 'domain/programs/constants'

interface UseEditableProgramProps {
  program: any
  isEditable: boolean
  setValue: any
}

export const useEditableProgram = ({ program, isEditable, setValue }: UseEditableProgramProps) => {
  const _approversRole = formatProgramApproversRole(program)
  const _viewersRole = formatProgramViewersRole(program)
  const _requestType = program?.request_unit_name === USD ? USD : REQUEST_TOKEN
  const _paymentToken = formatRequestPaymentToken({
    tokenSymbol: program?.payment_unit_name,
    blockchainName: program?.payment_blockchain,
    isUSD: false,
  })

  useEffect(() => {
    if (program && isEditable) {
      setValue('name', program?.program_name)
      setValue('requestType', _requestType)
      setValue('paymentToken', _paymentToken)
      setValue('deliveryMethod', program?.delivery_method)
      setValue('approversRole', _approversRole)
      setValue('viewersRole', _viewersRole)
      setValue('visibility', program?.visibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, isEditable])
}
