import { deliveryMethod as deliveryMethodConst, ONE_TIME } from 'domain/programs/constants'

interface ApproverRole {
  roleId: number
  email?: string
  groupIds?: number[]
}

interface ViewerRole {
  roleId: number
  email?: string
}

interface Program {
  request_unit_name?: string
  payment_unit_name?: string
  viewersRole?: ViewerRole[]
  approversRole?: ApproverRole[][]
  userRoleProgramGroupIds?: number[]
  signers_wallet_addresses?: string[]
}

export const generateApproversRoleOptions = (approversData: ApproverRole[]) =>
  (approversData &&
    approversData?.map(approverRole => ({
      roleId: approverRole.roleId,
      value: approverRole.email,
      label: approverRole.email,
    }))) ||
  []

export const generateViewersRoleOptions = (viewerData: ViewerRole[]) =>
  (viewerData &&
    viewerData?.map(viewerRole => ({
      roleId: viewerRole.roleId,
      value: viewerRole.email,
      label: viewerRole.email,
    }))) ||
  []

export const formatProgramCurrency = (program: Program) => {
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

export const findProgramPaymentMethod = (program: Program) =>
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

export const formatProgramViewersRole = (program: Program) =>
  program?.viewersRole?.map(r => ({
    label: r.email,
    value: r.email,
    roleId: r.roleId,
  }))

export const formatSignersWalletAddresses = (program: Program) => {
  if (program?.signers_wallet_addresses?.length === 0) {
    return [{ address: '' }]
  }
  return program?.signers_wallet_addresses?.map(addr => ({ address: addr }))
}

export const formatProgramApproversRole = (program: Program) => {
  //creates one entry to each group id value
  const result = new Map()

  if (!program?.approversRole) {
    return [[]]
  }

  const flattenedApproversRoleMap = program.approversRole.flatMap(approverGroup => approverGroup)

  if (program?.userRoleProgramGroupIds?.length) {
    program.userRoleProgramGroupIds.forEach(id => result.set(id, []))

    flattenedApproversRoleMap.forEach(role => {
      role.groupIds?.forEach(groupId => {
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

export const groupProgramApproversRole = (
  approversRole: { roleId: number; roleName: string; roleDescription: string }[],
  programId: number,
) => {
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
