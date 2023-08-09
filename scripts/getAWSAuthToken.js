const { loadEnvConfig } = require('@next/env')
loadEnvConfig(process.cwd())

const fs = require('fs')
const { getAuthToken, certificate } = require('../lib/aws/rds')
const { tmpdir } = require('os')

const certificatePath = `${tmpdir()}/rds-cert.pem`

async function checkCertificate() {
  const certificateExists = fs.existsSync(certificatePath)
  if (certificateExists) {
    return
  }

  return new Promise((accept, reject) => {
    fs.writeFile(certificatePath, certificate, (err) => {
      if (err) {
        reject(err)
        return
      }
      accept()
    })
  })
}

async function run() {
  await checkCertificate()
  return getAuthToken()
}

run()
  .then((res) => {
    console.log(res)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to get aws auth token: ', err)
    process.exit(1)
  })
