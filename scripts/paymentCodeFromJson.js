const fs = require('fs')
const path = require('path')

async function run() {
  const [filePath] = process.argv.slice(2)
  const [amount] = process.argv.slice(3)

  if (!filePath) {
    throw new Error('Please provide a file path')
  }

  const fileData = fs.readFileSync(filePath, 'utf8')
  const records = JSON.parse(fileData)
  let data = '#!/bin/bash'
  records?.Jobs?.forEach(el => {
    data =
      data +
      `\nlotus send --params-hex=${Buffer.from(el.PaymentIdentifier).toString('hex')} ${el.Params.OutAddress} ${amount || 0.000000001}`
  })

  const dir = path.dirname(filePath)

  fs.writeFileSync(`${dir}/script.sh`, data)
  return
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.log('Failed to decrypt argument: ', err)
    process.exit(1)
  })
