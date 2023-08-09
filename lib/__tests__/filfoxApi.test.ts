import * as service from 'lib/filfoxApi'

describe('filfox api', () => {
  describe('get block content', () => {
    it(
      'should get block content',
      async () => {
        const { data: blockContent } = await service.getBlockContent('bafy2bzaceakpm2yp7v7ps5cu37iweuuxenguflmsb6s6pcjnv3btjpxfl5vtq')

        console.log(JSON.stringify(blockContent, null, 2))

        //   expect(blockContent.).toBeDefined()
      },
      10 * 1000
    )
  })
})
