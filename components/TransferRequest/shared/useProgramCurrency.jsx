import { useMemo } from 'react'

export const useProgramCurrency = ({ defaultRequestProgram, programs = [], programId }) => {
  const { selectedProgram, paymentCurrency, requestCurrency } = useMemo(() => {
    const newPrograms = defaultRequestProgram ? [...programs, defaultRequestProgram] : programs
    const selectedProgram = newPrograms.find((p) => p.id === programId)
    let paymentCurrency, requestCurrency

    if (selectedProgram?.programCurrency) {
      for (const programCurrency of selectedProgram.programCurrency) {
        if (programCurrency.type === 'REQUEST') {
          requestCurrency = programCurrency.currency
        }
        if (programCurrency.type === 'PAYMENT') {
          paymentCurrency = programCurrency.currency
        }
      }
    }

    return { selectedProgram, paymentCurrency, requestCurrency }
  }, [defaultRequestProgram, programId, programs])

  return { selectedProgram, paymentCurrency, requestCurrency }
}
