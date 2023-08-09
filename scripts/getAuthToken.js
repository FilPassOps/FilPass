const { loadEnvConfig } = require('@next/env')
const jwt = require('jsonwebtoken')

const { source } = process.argv
  .map((arg) => arg.split('='))
  .reduce((params, [arg, value]) => {
    return {
      ...params,
      [arg]: value,
    }
  }, {})

if (!source) {
  throw new Error('Source parameter is missing.')
}

const {
  combinedEnv: { APP_SECRET },
} = loadEnvConfig(process.cwd())

if (!APP_SECRET) {
  throw new Error('APP_SECRET environment variable is missing.')
}

const token = jwt.sign(source, APP_SECRET)
console.log(token)
