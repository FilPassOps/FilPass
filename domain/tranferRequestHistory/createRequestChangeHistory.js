/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import Big from 'big.js'
import * as createRequestChangeModule from 'domain/tranferRequestHistory/createRequestChangeHistory'
import { encrypt, encryptPII } from 'lib/emissaryCrypto'
import { compareObjects } from 'lib/objectComparer'
import { HISTORY_ENCRYPTED_FIELDS_AMOUNT, HISTORY_ENCRYPTED_FIELDS_TEAM } from './constants'

export const createRequestChangeHistory = async (prisma, { userRoleId, transferRequestId, oldValue, newValue }) => {
  const changes = compareObjects({
    oldValue,
    newValue,
    filterFn: createRequestChangeModule.getFilteredObject,
  })

  if (changes.length > 0) {
    const parsedChanges = await Promise.all(
      changes.map(async change => {
        if (change.field === HISTORY_ENCRYPTED_FIELDS_TEAM) {
          const [encryptedOldValue, encryptedNewValue] = await Promise.all([encryptPII(change.oldValue), encryptPII(change.newValue)])
          return {
            field: change.field,
            oldValue: encryptedOldValue,
            newValue: encryptedNewValue,
          }
        }
        if (change.field === HISTORY_ENCRYPTED_FIELDS_AMOUNT) {
          const [encryptedOldValue, encryptedNewValue] = await Promise.all([encrypt(change.oldValue), encrypt(change.newValue)])
          return {
            field: change.field,
            oldValue: encryptedOldValue,
            newValue: encryptedNewValue,
          }
        }
        return change
      })
    )

    return prisma.transferRequestHistory.createMany({
      data: parsedChanges.map(change => ({
        ...change,
        userRoleId,
        transferRequestId,
      })),
    })
  }
}

export const getFilteredObject = request => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    countryResidence,
    isSanctioned,
    sanctionReason,
    createdAt,
    updatedAt,
    notifications,
    transfers,
    history,
    reviews,
    amount,
    currencyUnitId,
    expectedTransferDate,
    terms,
    ...rest
  } = request
  return { ...rest, amount: amount && new Big(amount).toFixed(2) }
}
