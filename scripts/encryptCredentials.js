const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { encryptCredentials } = require('../lib/emissaryCrypto')

async function run() {
  const argument = process.argv[2]
  if (!argument || argument.length <= 0) {
    throw new Error('missing argument')
  }

  return encryptCredentials(argument)
}

run()
  .then(res => {
    console.log(res)
    process.exit(0)
  })
  .catch(err => {
    console.log('Failed to encrypt argument: ', err)
    process.exit(1)
  })
