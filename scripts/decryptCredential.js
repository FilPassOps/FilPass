const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const { decryptCredential } = require('../lib/emissaryCrypto')

async function run() {
  const argument = process.argv[2]
  if (!argument || argument.length <= 0) {
    throw new Error('missing argument')
  }

  return decryptCredential(argument)
}

run()
  .then(res => {
    console.log(res)
    process.exit(0)
  })
  .catch(err => {
    console.log('Failed to decrypt argument: ', err)
    process.exit(1)
  })
