import { detailedDiff } from 'deep-object-diff'

export function compareObjects({ oldValue, newValue, filterFn = (value) => value }) {
  const filteredOldValue = filterFn(oldValue)
  const filteredNewValue = filterFn(newValue)

  const { added, deleted, updated } = detailedDiff(filteredOldValue, filteredNewValue)

  const changes = []

  Object.entries(added).forEach(([key, value]) => {
    changes.push({
      field: key,
      newValue: value?.toString(),
      oldValue: null,
    })
  })

  Object.keys(deleted).forEach((key) => {
    changes.push({
      field: key,
      newValue: null,
      oldValue: filteredOldValue[key]?.toString(),
    })
  })

  Object.keys(updated).forEach((key) => {
    changes.push({
      field: key,
      newValue: filteredNewValue[key]?.toString(),
      oldValue: filteredOldValue[key]?.toString(),
    })
  })

  return changes
}