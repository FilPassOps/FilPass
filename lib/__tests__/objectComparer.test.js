import * as objectDiff from 'deep-object-diff'
import { compareObjects } from 'lib/objectComparer'

jest.mock('deep-object-diff')

describe('objectComparer', () => {
  objectDiff.detailedDiff.mockReturnValue({
    added: {
      added_field: 10,
    },
    deleted: {
      deleted_field: 20,
    },
    updated: {
      updated_field: 30,
    },
  })

  it('should return changes calling filter function', () => {
    const filterFn = jest.fn((value) => {
      if (value === 1) {
        return {
          deleted_field: 40,
          updated_field: 50,
        }
      }

      if (value === 2) {
        return {
          updated_field: 60,
        }
      }
    })

    const changes = compareObjects({ oldValue: 1, newValue: 2, filterFn })

    expect(changes).toEqual(
      expect.arrayContaining([
        {
          field: 'added_field',
          oldValue: null,
          newValue: '10',
        },
        {
          field: 'deleted_field',
          oldValue: '40',
          newValue: null,
        },
        {
          field: 'updated_field',
          oldValue: '50',
          newValue: '60',
        },
      ])
    )
  })

  it('should return changes with default filter function', () => {
    const changes = compareObjects({
      oldValue: {
        deleted_field: 40,
        updated_field: 50,
      },
      newValue: {
        updated_field: 60,
      },
    })

    expect(changes).toEqual(
      expect.arrayContaining([
        {
          field: 'added_field',
          oldValue: null,
          newValue: '10',
        },
        {
          field: 'deleted_field',
          oldValue: '40',
          newValue: null,
        },
        {
          field: 'updated_field',
          oldValue: '50',
          newValue: '60',
        },
      ])
    )
  })
})
