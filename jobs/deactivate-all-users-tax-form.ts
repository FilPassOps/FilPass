import prisma from 'lib/prisma'

export default async function run() {
  await prisma.userFile.updateMany({
    where: {
      type: {
        in: ['W8_FORM', 'W9_FORM'],
      },
    },
    data: {
      isActive: false,
    },
  })

  console.log('FORMS (W8 AND W9) OF ALL USERS DEACTIVATED')
}
