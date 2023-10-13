import { useEffect } from 'react'
import {
  findProgramPaymentMethod,
  formatProgramApproversRole,
  formatProgramCurrency,
  formatProgramViewersRole,
} from '../components/SuperAdmin/Shared/utils'

interface UseEditableProgramProps {
  program: any
  isEditable: boolean
  setValue: any
}

export const useEditableProgram = ({ program, isEditable, setValue }: UseEditableProgramProps) => {
  const _programCurrency = formatProgramCurrency(program)
  const _paymentMethod = findProgramPaymentMethod(program)?.value
  const _approversRole = formatProgramApproversRole(program)
  const _viewersRole = formatProgramViewersRole(program)

  useEffect(() => {
    if (program && isEditable) {
      setValue('name', program?.program_name)
      setValue('paymentMethod', _paymentMethod)
      setValue('deliveryMethod', program?.delivery_method)
      setValue('approversRole', _approversRole)
      setValue('viewersRole', _viewersRole)
      setValue('programCurrency', _programCurrency)
      setValue('visibility', program?.visibility)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program, isEditable])
}
