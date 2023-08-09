import { useEffect } from 'react'
import {
  findProgramPaymentMethod,
  formatProgramApproversRole,
  formatProgramCurrency,
  formatProgramViewersRole,
  formatSignersWalletAddresses,
} from './utils'

export const useEditableProgram = ({ program, isEditable, setValue }) => {
  const _programCurrency = formatProgramCurrency(program)
  const _paymentMethod = findProgramPaymentMethod(program)?.value
  const _approversRole = formatProgramApproversRole(program)
  const _viewersRole = formatProgramViewersRole(program)
  const _signersWalletAddresses = formatSignersWalletAddresses(program)

  useEffect(() => {
    if (program && isEditable) {
      setValue('name', program?.program_name)
      setValue('paymentMethod', _paymentMethod)
      setValue('deliveryMethod', program?.delivery_method)
      setValue('approversRole', _approversRole)
      setValue('viewersRole', _viewersRole)
      setValue('programCurrency', _programCurrency)
      setValue('signersWalletAddresses', _signersWalletAddresses)
      setValue('visibility', program?.visibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, isEditable])
}
