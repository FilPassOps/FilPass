import { Controller } from 'react-hook-form'
import { SelectInput } from 'components/shared/FormInput'
import { useMemo } from 'react'

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
}) => {
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
