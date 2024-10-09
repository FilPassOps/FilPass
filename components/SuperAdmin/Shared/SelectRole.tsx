import { Role } from '@prisma/client'
import { MultipleSelectInput } from 'components/Shared/FormInput'
import { ADDRESS_MANAGER_ROLE, SUPERADMIN_ROLE, VIEWER_ROLE } from 'domain/auth/constants'
import { BaseApiResult, api } from 'lib/api'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface SelectRolesProps {
  user: {
    id: string
    roles: string[]
  }
  scrolled: boolean
}

interface RoleOption {
  value: Role
  label: string
  disabled?: boolean
  tooltip?: string
}

export const SelectRoles = ({ user, scrolled }: SelectRolesProps) => {
  const [submitErrors, setSubmitErrors] = useState<any>()
  const [isLoading, setLoading] = useState(false)

  const viewerOption: RoleOption = { value: VIEWER_ROLE, label: 'Viewer', disabled: false, tooltip: undefined }

  const rolesOptions = [
    { value: ADDRESS_MANAGER_ROLE, label: 'Address Manager', disabled: false, tooltip: undefined },
    { value: SUPERADMIN_ROLE, label: 'Superadmin', disabled: false, tooltip: undefined },
    viewerOption,
  ]

  const defaultRolesValues = rolesOptions.filter(option => user?.roles?.includes(option.value))

  const {
    control,
    formState: { errors },
    setValue,
  } = useForm({
    shouldFocusError: false,
    defaultValues: {
      roles: defaultRolesValues,
    },
  })

  const handleFormSubmit = async (values: Role) => {
    setLoading(true)
    const { error } = (await api.post(`/roles/${user.id}`, { roles: values })) as BaseApiResult

    if (error) {
      setSubmitErrors(error.errors)
    }
    setLoading(false)
  }

  return (
    <div className="relative">
      <div className="absolute w-full" style={{ maxWidth: 255, top: scrolled ? -19 : undefined }}>
        <Controller
          control={control}
          name="roles"
          render={({ field }) => (
            <MultipleSelectInput
              {...field}
              variant="invisible"
              id="roles"
              options={rolesOptions}
              placeholder="Default User"
              error={errors?.roles || submitErrors?.roles}
              onChange={async (values: any) => {
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
