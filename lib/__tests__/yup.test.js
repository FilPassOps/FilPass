import { validate } from '../yup'

const mockedValidate = jest.fn()

beforeEach(() => {
  mockedValidate.mockReset()
})
describe('yup', () => {
  it('should return single error', async () => {
    const mockYup = {
      validate: mockedValidate,
    }

    mockedValidate.mockImplementation((value, config) => {
      expect(value).not.toBeUndefined()
      expect(config).not.toBeUndefined()
      expect(value).toEqual({ userId: undefined })

      throw {
        inner: [],
        path: 'userId',
        message: 'This field is required.',
      }
    })

    const value = { userId: undefined }

    const { fields } = await validate(mockYup, value)
    expect(fields).toBeUndefined()
  })

  it('should return multiple errors', async () => {
    const mockYup = {
      validate: mockedValidate,
    }

    mockedValidate.mockImplementation(value => {
      expect(value).toEqual({ userId: undefined, name: 1234 })

      throw {
        inner: [
          {
            path: 'userId',
            message: 'This field is required.',
          },
          {
            path: 'name',
            message: 'Invalid type',
          },
        ],
      }
    })

    const value = { userId: undefined, name: 1234 }

    const { errors, fields } = await validate(mockYup, value)

    expect(fields).toBeUndefined()
    expect(errors).toEqual({
      inner: [
        {
          path: 'userId',
          message: 'This field is required.',
        },
        {
          path: 'name',
          message: 'Invalid type',
        },
      ],
    })
  })

  it('should return fields', async () => {
    const mockYup = {
      validate: mockedValidate,
    }

    mockedValidate.mockImplementation(value => {
      return value
    })

    const value = { userId: 1 }

    const { errors, fields } = await validate(mockYup, value)

    expect(fields).toEqual({ userId: 1 })
    expect(errors).toBeUndefined()
  })
})
