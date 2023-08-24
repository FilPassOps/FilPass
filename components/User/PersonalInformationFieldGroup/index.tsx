import { DateInput, SelectInput, TextInput } from 'components/shared/FormInput'
import { Countries } from 'domain/transferRequest/countries'
import { Control, Controller, DeepRequired, FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

export interface PersonalInformationFieldGroupValues extends FieldValues {
  firstName: string
  lastName: string
  dateOfBirth: Date
  countryResidence: string
}

interface PersonalInformationFieldGroupProps<T extends FieldValues = FieldValues> {
  register: UseFormRegister<T & any>
  control: Control<T & any, object>
  errors: FieldErrorsImpl<DeepRequired<T & any>>
}

export default function PersonalInformationFieldGroup<T extends PersonalInformationFieldGroupValues>({
  register,
  control,
  errors,
}: PersonalInformationFieldGroupProps<T>) {
  return (
    <>
      <TextInput
        //@ts-ignore
        label="First Name"
        id="firstName"
        type="text"
        error={errors.firstName}
        {...register('firstName')}
      />
      <TextInput
        //@ts-ignore
        label="Last Name"
        id="lastName"
        type="text"
        error={errors.lastName}
        {...register('lastName')}
      />
      <Controller
        control={control}
        name="dateOfBirth"
        render={({ field }) => (
          <DateInput
            //@ts-ignore
            label="Date of Birth"
            id="dateOfBirth"
            error={errors.dateOfBirth}
            placeholder="MM/DD/YYYY"
            max={new Date()}
            pattern={'m/d/Y'}
            format={(date: Date) => {
              const month = date.getMonth() + 1
              const day = date.getDate()
              const year = date.getFullYear()
              return [String(month).padStart(2, '0'), String(day).padStart(2, '0'), year].join('/')
            }}
            parse={(stringValue: string) => {
              const yearMonthDay = stringValue.split('/')
              return new Date(Number(yearMonthDay[2]), Number(yearMonthDay[0]) - 1, Number(yearMonthDay[1]))
            }}
            {...field}
          />
        )}
      />
      <Controller
        control={control}
        name="countryResidence"
        render={({ field }) => (
          <SelectInput
            {...field}
            //@ts-ignore
            id="countryResidence"
            placeholder="Select your country of residence"
            name="countryResidence"
            options={Countries}
            label="Country of Residence"
            error={errors.countryResidence}
          />
        )}
      />
    </>
  )
}
