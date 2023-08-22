import { deliveryMethod as deliveryMethodConst, ONE_TIME } from 'domain/programs/constants'
import { CONFIG } from 'system.config'
import { formatPaymentMethod } from './formatPaymentMethod'

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
        },
        {
          name: chain.symbol,
          type: 'PAYMENT',
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
        },
        {
          name: chain.symbol,
          type: 'PAYMENT',
        },
      ],
    })
  }
  return options
}

export const paymentMethodOptions = createPaymentMethodOptions()

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
