import { AppConfig, TokenOptions, isERC20Token } from 'config'
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
}

export const deliveryMethodOptions = [
  {
    value: ONE_TIME,
    label: deliveryMethodConst[ONE_TIME],
  },
]

export const formatPaymentMethod = (request_unit_name?: string, payment_unit_name?: string) => {
  if (!request_unit_name && !payment_unit_name) {
    return '-'
  }

  if (!request_unit_name && payment_unit_name) {
    return payment_unit_name
  }

  return `Request in ${request_unit_name} and Pay in ${payment_unit_name}`
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

export const formatProgramViewersRole = (program: Program) => {
  if (!program?.viewersRole) {
    return []
  }

  return program?.viewersRole?.map(r => ({
    label: r.email,
    value: r.email,
    roleId: r.roleId,
  }))
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

export const formatRequestPaymentToken = ({
  isUSD,
  blockchainName,
  tokenSymbol,
}: {
  isUSD: boolean
  blockchainName: string
  tokenSymbol: string
}) => {
  if (isUSD || !tokenSymbol || !blockchainName) {
    return undefined
  }

  const token = AppConfig.network.getTokenBySymbolAndBlockchainName(tokenSymbol as TokenOptions, blockchainName)
  const blockchain = AppConfig.network.getChainByToken(token)

  return isERC20Token(token) ? token.erc20TokenAddress : blockchain?.chainId
}
