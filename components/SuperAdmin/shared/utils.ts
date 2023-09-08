import { deliveryMethod as deliveryMethodConst, ONE_TIME } from 'domain/programs/constants'
import { CONFIG } from 'system.config'
import { formatPaymentMethod } from './formatPaymentMethod'

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
  paymentMethodOptions.find(option => option.label === formatPaymentMethod(program?.request_unit_name, program?.payment_unit_name))

const createPaymentMethodOptions = () => {
  let index = 1
  const options = []
  for (const chain of CONFIG.chains) {
    options.push({
      value: index++,
      label: formatPaymentMethod(chain.symbol, chain.symbol),
      programCurrency: [
        {
          name: chain.symbol,
          type: 'REQUEST',
          blockchain: chain.name,
        },
        {
          name: chain.symbol,
          type: 'PAYMENT',
          blockchain: chain.name,
        },
      ],
    })
    options.push({
      value: index++,
      label: formatPaymentMethod(CONFIG.fiatPaymentUnit, chain.symbol),
      programCurrency: [
        {
          name: CONFIG.fiatPaymentUnit,
          type: 'REQUEST',
          blockchain: chain.name,
        },
        {
          name: chain.symbol,
          type: 'PAYMENT',
          blockchain: chain.name,
        },
      ],
    })
  }
  return options
}

export const paymentMethodOptions = createPaymentMethodOptions()

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

export const groupProgramApproversRole = (approversRole: { roleId: number }[][], programId: number) => {
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
