const { extractRoles } = require('lib/auth')

describe('lib auth module', () => {
  it('should return user roles mapped', () => {
    const userRoles = [
      {
        role: 'CONTROLLER',
        id: 1,
      },
      {
        role: 'APPROVER',
        id: 2,
      },
      {
        role: 'USER',
        id: 3,
      },
      {
        role: 'SUPERADMIN',
        id: 4,
      },
    ]

    const mappedUserRoles = extractRoles(userRoles)

    expect(mappedUserRoles).toEqual({
      controllerId: 1,
      approverId: 2,
      userRoleId: 3,
      superAdminId: 4,
    })
  })
})
