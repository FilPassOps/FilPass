import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { matchWalletAddress } from 'lib/filecoinShipyard'
import { getDelegatedAddress } from 'lib/getDelegatedAddress'
import { generateEmailHash } from 'lib/password'
import prisma from 'lib/prisma'
import yup, { validate } from 'lib/yup'
import { sortedUniq } from 'lodash'
import errorsMessages from 'wordings-and-errors/errors-messages'
import { uploadBatchCsvValidator } from './validation'

const csvSchemaV1 = yup.object().shape({
  Email: yup.string().defined(),
  Amount: yup.string().defined(),
})

const csvSchemaV2 = yup.object().shape({
  Email: yup.string().defined(),
  Amount: yup.string().defined(),
  ApprovalForTransfer: yup.string().defined(),
  Custodian: yup.string().required(),
})

export async function uploadBatchCsv(params) {
  const { fields, errors } = await validate(uploadBatchCsvValidator, params)

  if (errors) {
    return {
      error: {
        status: 400,
        errors,
      },
    }
  }

  const { file, programId, approverId } = fields

  const program = await prisma.program.findUnique({ where: { id: programId } })

  const {
    data: requests,
    file: fileData,
    errors: verifyErrors,
    hasCustodian = false,
  } = await verifyCsv({
    file,
    prisma,
    program,
    approverId,
  })

  if (verifyErrors.length > 0) {
    return {
      error: {
        status: 400,
        errors: verifyErrors,
      },
    }
  }

  return {
    data: { requests, file: { ...file, data: fileData }, hasCustodian },
  }
}

const verifyCsv = async ({ file, prisma, program, approverId }) => {
  const fileData = fs.readFileSync(file.path, 'utf8')
  let records
  try {
    records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
      delimiter: [',', ';'],
    })
  } catch (error) {
    const errors = [{ message: 'CSV is not formatted correctly.' }]
    return { errors, data: records, file: fileData }
  }

  if (records.length === 0) {
    const errors = [{ message: 'No data found in CSV file.' }]
    return { errors, data: records, file: fileData }
  }

  if (records.length > 500) {
    const errors = [{ message: 'Error: 500+ detected. Maximum = 500 entries.' }]
    return { errors, data: records, file: fileData }
  }

  const validationObject = {
    records,
    prisma,
    program,
    fileData,
  }

  const isV2 = csvSchemaV2.isValidSync(records[0])
  if (isV2) {
    return await validateV2SchemaFile(validationObject, approverId)
  }

  const isV1 = csvSchemaV1.isValidSync(records[0])
  if (isV1) {
    return await validateV1SchemaFile(validationObject)
  }

  const errors = [{ message: 'Unkown CSV template' }]
  return { errors, data: records, file: fileData }
}

const validateV1SchemaFile = async validationObject => {
  const { records, prisma, program, fileData } = validationObject
  let errors = []
  const vestingVerify = verifyVesting(program, records, 'Vesting Start Epoch', 'Vesting Months')

  if (vestingVerify) {
    errors.push(vestingVerify)
  }

  const vestingMonthRange = verifyVestingMonthRange(records, 'Vesting Months')

  if (vestingMonthRange) {
    errors = [...errors, ...vestingMonthRange]
  }

  const { error: verifyEmailErrors } = verifyEmail(records)
  if (verifyEmailErrors) {
    verifyEmailErrors.forEach(error => errors.push(error))
  }

  const { error: amountErrors } = verifyAmount(records)
  if (amountErrors) {
    amountErrors.forEach(error => errors.push(error))
  }

  const { error: walletErrors } = await verifyWallet(records, prisma, 'Wallet Address')
  if (walletErrors) {
    walletErrors.forEach(error => errors.push(error))
  }

  return { errors, data: records, file: fileData }
}

const validateV2SchemaFile = async (validationObject, approverId) => {
  const { records, prisma, program, fileData } = validationObject

  let errors = []

  const vestingVerify = verifyVesting(program, records, 'VestingStartEpoch', 'VestingMonths')

  if (vestingVerify) {
    errors.push(vestingVerify)
  }

  const vestingMonthRange = verifyVestingMonthRange(records, 'VestingMonths')

  if (vestingMonthRange) {
    errors = [...errors, ...vestingMonthRange]
  }

  const { error: verifyEmailErrors } = verifyEmail(records)
  if (verifyEmailErrors) {
    verifyEmailErrors.forEach(error => errors.push(error))
  }

  const { error: amountErrors } = verifyAmount(records)
  if (amountErrors) {
    amountErrors.forEach(error => errors.push(error))
  }

  const { error: walletErrors } = await verifyWallet(records, prisma, 'Addresses')
  if (walletErrors) {
    walletErrors.forEach(error => errors.push(error))
  }

  const { error: approvalErrors } = verifyApprovalForTransfer(records)
  if (approvalErrors) {
    approvalErrors.forEach(error => errors.push(error))
  }

  const { error: custodianlErrors, hasCustodian } = await verifyCustodian(records, approverId, prisma)

  if (custodianlErrors.length) {
    custodianlErrors.forEach(error => errors.push(error))
  }

  return { errors, data: records, file: fileData, hasCustodian }
}

const verifyAmount = data => {
  let errors = []

  const amounts = data.map((row, index) => ({ amount: row.Amount, row: index + 2 }))
  const invalidAmounts = amounts.filter(({ amount }) => !yup.number().moreThan(0).isValidSync(amount))
  const requiredAmounts = amounts.filter(({ amount }) => !yup.number().required().isValidSync(amount))

  if (invalidAmounts.length > 0) {
    const pluralInvalidAmounts = invalidAmounts.length > 1 ? 's' : ''
    errors.push({
      message: `Invalid amount${pluralInvalidAmounts} detected in row${pluralInvalidAmounts} ${invalidAmounts
        .map(amount => amount.row)
        .join(', ')}. Amount must be a number greater than 0.`,
    })
  }

  if (requiredAmounts.length > 0) {
    const pluralRequiredAmounts = requiredAmounts.length > 1 ? 's' : ''
    errors.push({
      message: `Required amount${pluralRequiredAmounts} missing in row${pluralRequiredAmounts} ${requiredAmounts
        .map(amount => amount.row)
        .join(', ')}. Amount is required.`,
    })
  }

  return { error: errors.length > 0 ? errors : null }
}

const verifyEmail = data => {
  let errors = []
  const emails = data.map((row, index) => ({ email: row.Email, row: index + 2 }))
  const invalidEmails = emails.filter(email => !yup.string().email().isValidSync(email.email))
  const requiredEmails = emails.filter(email => !yup.string().email().required().isValidSync(email.email))

  if (invalidEmails.length > 0) {
    const pluralInvalidEmails = invalidEmails.length > 1 ? 's' : ''
    errors.push({
      message: `Invalid email${pluralInvalidEmails} found on row${pluralInvalidEmails} ${invalidEmails.map(email => email.row).join(', ')}`,
    })
  }

  if (requiredEmails.length > 0) {
    const pluralRequiredEmails = requiredEmails.length > 1 ? 's' : ''
    errors.push({
      message: `Missing email${pluralRequiredEmails} on row${pluralRequiredEmails} ${invalidEmails.map(email => email.row).join(', ')}`,
    })
  }

  return { error: errors.length > 0 ? errors : null }
}

const verifyWallet = async (data, prisma, propName) => {
  let errors = []

  const walletsWithEmails = await Promise.all(
    data.map(async (row, index) => ({
      wallet: row[propName],
      email: await generateEmailHash(row['Email']),
      row: index + 2,
    }))
  )

  const emailsArray = walletsWithEmails.map(({ email }) => email)

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      emailHash: { in: emailsArray },
    },
    select: {
      email: true,
      emailHash: true,
      id: true,
      wallets: {
        select: {
          id: true,
          address: true,
          isDefault: true,
        },
      },
    },
  })

  await Promise.all(
    walletsWithEmails.map(async ({ wallet, email, row }) => {
      if (!wallet) {
        const userWithDefaultWallet = users.find(user => user.emailHash === email && user.wallets.some(wallet => wallet.isDefault))

        if (!userWithDefaultWallet) {
          errors.push({ message: `No wallet or default wallet found on row ${row}` })
        }
        return {
          wallet: userWithDefaultWallet?.wallets?.[0],
          email: userWithDefaultWallet?.email,
        }
      }

      if (wallet) {
        const delegatedAddress = getDelegatedAddress(wallet)?.fullAddress
        const isWalletValid = await matchWalletAddress(delegatedAddress || wallet)
        if (!isWalletValid) {
          errors.push({ message: `Invalid wallet address on row ${row - 1}` })
        }
      }
    })
  )

  return { error: errors.length > 0 ? errors : null }
}

// previus params (program, records, vestingStartEpochPropName, vestingMonthsPropName)
const verifyVesting = () => {
  //TODO MSIG 1 of 2
  // const vestginParams = records.filter(row => row[vestingStartEpochPropName] || row[vestingMonthsPropName])

  // if (vestginParams.length > 0 && program.deliveryMethod !== MULTISIG_1_OF_2) {
  //   return errorsMessages.program_vesting_not_supported
  // }

  return false
}

const verifyVestingMonthRange = (records, propName) => {
  const errors = []
  records.forEach((row, index) => {
    const vestingMonth = row[propName]
    if (vestingMonth && (vestingMonth < 0 || vestingMonth > 200)) {
      errors.push({ message: `${errorsMessages.invalid_vesting_months_range.message} At line ${index + 2}` })
    }
  })

  return errors
}

const verifyApprovalForTransfer = records => {
  const errors = []
  records.forEach((row, index) => {
    const approval = row['ApprovalForTransfer']
    if (approval?.toLowerCase() !== 'true') {
      errors.push({ message: `Not approved for transfer on row ${index + 2}` })
    }
  })
  return { error: errors.length > 0 ? errors : null }
}

const verifyCustodian = async (records, approverId, prisma) => {
  const returnValue = { error: [], hasCustodian: false }

  const allPrograms = sortedUniq(records.map(row => row['Custodian']))
  const programs = await prisma.program.findMany({
    where: { name: { in: allPrograms }, isActive: true, isArchived: false },
    select: {
      id: true,
      name: true,
      userRolePrograms: {
        select: {
          userRoleId: true,
          isActive: true,
        },
      },
    },
  })

  await Promise.allSettled(
    records.map(async (row, index) => {
      const custodian = row['Custodian']

      if (custodian) {
        const program = programs.find(({ name }) => name.trim().toLowerCase() === custodian.trim().toLowerCase())

        if (!program) {
          returnValue.error.push({ message: `Custodian on line ${index + 2} does not exist` })
          return
        }

        if (!program.userRolePrograms.find(({ userRoleId, isActive }) => userRoleId === approverId && isActive === true)) {
          returnValue.error.push({ message: `Not an approver for Custodian on line ${index + 2}` })
          return
        }

        row.programId = program.id
        returnValue.hasCustodian = true
        return
      }

      returnValue.error.push({ message: `Custodian not defined on line ${index + 2}` })
    })
  )

  return returnValue
}
