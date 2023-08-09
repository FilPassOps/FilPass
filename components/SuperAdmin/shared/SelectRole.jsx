import { MultipleSelectInput } from 'components/shared/FormInput'
import {
  ADDRESS_MANAGER_ROLE,
  APPROVER_ROLE,
  COMPLIANCE_ROLE,
  CONTROLLER_ROLE,
  FINANCE_ROLE,
  SUPERADMIN_ROLE,
  VIEWER_ROLE,
} from 'domain/auth/constants'
import { api } from 'lib/api'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

export const SelectRoles = ({ user, scrolled }) => {
  const [submitErrors, setSubmitErrors] = useState()
  const [isLoading, setLoading] = useState(false)

  const approverOption = { value: APPROVER_ROLE, label: 'Approver', disabled: false, tooltip: undefined }
  const viewerOption = { value: VIEWER_ROLE, label: 'Viewer', disabled: false, tooltip: undefined }

  const rolesOptions = [
    approverOption,
    { value: CONTROLLER_ROLE, label: 'Controller', disabled: false, tooltip: undefined },
    { value: ADDRESS_MANAGER_ROLE, label: 'Address Manager', disabled: false, tooltip: undefined },
    { value: SUPERADMIN_ROLE, label: 'Superadmin', disabled: false, tooltip: undefined },
    { value: COMPLIANCE_ROLE, label: 'Compliance' },
    { value: FINANCE_ROLE, label: 'Finance' },
    viewerOption,
  ]

  const defaultRolesValues = rolesOptions.filter(option => user?.roles?.includes(option.value))

  const {
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    shouldFocusError: false,
    defaultValues: {
      roles: defaultRolesValues,
    },
  })

  const handleFormSubmit = async values => {
    setLoading(true)
    const { error } = await api.post(`/roles/${user.id}`, { roles: values })

    if (error) {
      setSubmitErrors(errors.error)
    }
    setLoading(false)
  }

  const rolesValue = watch('roles')

  if (rolesValue.some(({ value }) => value === VIEWER_ROLE)) {
    approverOption.disabled = true
    approverOption.tooltip = 'To make this user an approver, remove their viewer role.'
  }

  if (rolesValue.some(({ value }) => value === APPROVER_ROLE)) {
    viewerOption.disabled = true
    viewerOption.tooltip = 'To make this user a viewer, remove their approver role.'
  }

  return (
    <div className="relative">
      <div className="absolute w-full" style={{ maxWidth: 255, top: scrolled && -19 }}>
        <Controller
          control={control}
          name="roles"
          id="roles"
          render={({ field }) => (
            <MultipleSelectInput
              {...field}
              variant="invisible"
              options={rolesOptions}
              placeholder="Default User"
              error={errors?.roles || submitErrors?.roles}
              onChange={async values => {
                setValue('roles', values)
                await handleFormSubmit(values)
              }}
              disabled={isLoading}
              truncate
            />
          )}
        />
      </div>
    </div>
  )
}
