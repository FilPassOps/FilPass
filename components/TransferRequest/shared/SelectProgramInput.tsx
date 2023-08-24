import { Controller } from 'react-hook-form'
import { SelectInput } from 'components/shared/FormInput'
import { useMemo } from 'react'

interface SelectProgramInputProps {
  required?: boolean
  control: any
  errors: any
  submitErrors: any
  programs?: {
    id: string
    name: string
  }[]
  defaultProgram?: {
    id: string
    name: string
  }
  name?: string
  error?: string
  label?: string
  disabled?: boolean
}

export const SelectProgramInput = ({
  required = false,
  control,
  errors,
  submitErrors,
  programs = [],
  defaultProgram,
  name = 'programId',
  error,
  label = 'Program',
  disabled,
}: SelectProgramInputProps) => {
  const programOptions = useMemo(() => {
    const options = programs.map(p => ({ value: p.id, label: p.name }))

    if (defaultProgram && !programs.some(p => p.id === defaultProgram.id)) {
      options.unshift({
        label: defaultProgram.name,
        value: defaultProgram.id,
      })
    }

    return options
  }, [defaultProgram, programs])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectInput
          {...field}
          id={name}
          name={name}
          placeholder="Select name of the program"
          options={programOptions}
          emptyState="You don't have any programs assigned to you."
          label={
            <>
              {label}
              {required && <span className="text-indigo-500">*</span>}
            </>
          }
          error={errors?.[name] || submitErrors?.[name] || error}
          disabled={disabled}
        />
      )}
    />
  )
}
