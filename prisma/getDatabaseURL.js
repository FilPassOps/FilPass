const { getDatabaseURL } = require('../lib/prisma')

async function getURL() {
  try {
    const databaseURL = await getDatabaseURL()
    return { data: databaseURL }
  } catch (error) {
    return { error }
  }
}

async function run() {
  const { data, error: urlError } = await getURL()
  if (urlError) {
    throw new Error(`Failed to generate database URL: ${urlError}`)
  }

  return data
}

run()
  .then((res) => {
    console.log(res)
    process.exit(0)
  })
  .catch((err) => {
    console.log('Failed to add DATABASE_URL environment variable: ', err)
    process.exit(1)
  })
