import { deliveryMethod as deliveryMethodConst, ONE_TIME } from 'domain/programs/constants'

export const generateApproversRoleOptions = approversData =>
  (approversData &&
    approversData?.map(approverRole => ({
      roleId: approverRole.roleId,
      value: approverRole.email,
      label: approverRole.email,
    }))) ||
  []

export const generateViewersRoleOptions = viewerData =>
  (viewerData &&
    viewerData?.map(approverRole => ({
      roleId: approverRole.roleId,
      value: approverRole.email,
      label: approverRole.email,
    }))) ||
  []

export const formatProgramCurrency = program => {
  if (!program?.payment_unit_name || !program?.request_unit_name) return []
  return [
    {
      name: program?.request_unit_name,
      type: 'REQUEST',
    },
    {
      name: program?.payment_unit_name,
      type: 'PAYMENT',
    },
  ]
}

export const findProgramPaymentMethod = program =>
  paymentMethodOptions.find(option => option.label === `Request in ${program?.request_unit_name} and Pay in ${program?.payment_unit_name}`)

export const paymentMethodOptions = [
  {
    value: 1,
    label: 'Request in FIL and Pay in FIL',
    programCurrency: [
      {
        name: 'FIL',
        type: 'REQUEST',
      },
      {
        name: 'FIL',
        type: 'PAYMENT',
      },
    ],
  },
  {
    value: 2,
    label: 'Request in USD and Pay in FIL',
    programCurrency: [
      {
        name: 'USD',
        type: 'REQUEST',
      },
      {
        name: 'FIL',
        type: 'PAYMENT',
      },
    ],
  },
]

export const formatProgramViewersRole = program =>
  program?.viewersRole?.map(r => ({
    label: r.email,
    value: r.email,
    roleId: r.roleId,
  }))

export const formatSignersWalletAddresses = program => {
  if (program?.signers_wallet_addresses?.length === 0) {
    return [{ address: '' }]
  }
  return program?.signers_wallet_addresses?.map(addr => ({ address: addr }))
}

export const formatProgramApproversRole = program => {
  //creates one entry to each group id value
  const result = new Map()

  if (!program?.approversRole) {
    return [[]]
  }

  const flattenedApproversRoleMap = program.approversRole.flatMap(approverGroup => approverGroup)

  if (program?.userRoleProgramGroupIds?.length) {
    program.userRoleProgramGroupIds.forEach(id => result.set(id, []))

    flattenedApproversRoleMap.forEach(role => {
      role.groupIds.forEach(groupId => {
        result.get(groupId)?.push({
          label: role.email,
          value: role.email,
          roleId: role.roleId,
        })
      })
    })

    return Array.from(result.values()).filter(group => group.length)
  }

  return [
    flattenedApproversRoleMap.map(role => ({
      label: role.email,
      value: role.email,
      roleId: role.roleId,
    })),
  ]
}

export const groupProgramApproversRole = (approversRole, programId) => {
  const groupedApproversRole = new Map()

  for (const role of approversRole.flat()) {
    let approverRole = groupedApproversRole.get(role.roleId)

    if (!approverRole) {
      approverRole = {
        programId: programId,
        userRoleId: role.roleId,
      }
      groupedApproversRole.set(role.roleId, approverRole)
    }
  }

  return Array.from(groupedApproversRole.values())
}

export const deliveryMethodOptions = [
  {
    value: ONE_TIME,
    label: deliveryMethodConst[ONE_TIME],
  },
]
