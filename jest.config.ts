import type { Config } from '@jest/types'
import { TextDecoder, TextEncoder } from 'util'

const config: Config.InitialOptions = {
  clearMocks: true,
  moduleNameMapper: {
    '^components/(.*)$': '<rootDir>/components/$1',
    '^wordings-and-errors/(.*)$': '<rootDir>/wordings-and-errors/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^domain/(.*)$': '<rootDir>/domain/$1',
    '^test/(.*)$': '<rootDir>/test/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  setupFiles: ['<rootDir>/setup-tests.js', 'dotenv/config'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/dist/'],
  testEnvironment: 'node',
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: ['/node_modules/', '^.+\\.module\\.(css|sass|scss)$'],
  globals: {
    TextDecoder: TextDecoder,
    TextEncoder: TextEncoder,
  },
  preset: 'ts-jest/presets/js-with-ts',
}

export default config
