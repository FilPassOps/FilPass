## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Database](#database)
  - [Seeding the database with development data](#seeding-the-database-with-development-data)
  - [Database Migrations](#database-migrations)
  - [DDL Migrations (Structural changes)](#ddl-migrations-structural-changes)
  - [DML Migrations (Data changes)](#dml-migrations-data-changes)
- [Contract](#contract)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Contract Tests](#contract-tests)


## Introduction

Here are some useful commands to help you develop Emissary.


## Database

### Seeding the database with development data

If you want to start the system with test data like users, programs, transfer requests, and others to test the application, you can seed the database with the following command:

 `npm run seed:dev`

  The command create the following test users:

  - General users

    - user1@test.com to user149@test.com / password

  - Users with specific roles (the email domain for specific users is defined on the config.js file)

    - test-approver / password
    - test-controller / password
    - test-viewer / password
    - test-super / password

### Database Migrations

Migration files can be found under the `/prisma/migrations`. They can be executed locally by running the `npm run migrate` script.

Migrations that were already run are stored in the `_prisma_migrations` database table and are executed only once.

Check [Prisma documentation](https://www.prisma.io/docs/guides/database) for more info.

### DDL Migrations (Structural changes)

1. Make the desired changes to the `/prisma/schema.prisma` file.
2. Run `npx prisma migrate dev --create-only` to create the migration. A new folder will be added to the migrations folder containing a migration file with all the changes made to the schema.

### DML Migrations (Data changes)

1. Run `npx prisma migrate dev --create-only` to create the migration file. A new folder will be added to the migrations folder with an empty migration file.
2. Add the desired changes to the migration file.


## Contract

If you want to deploy a contract after editing it, you need to edit the `hardhat.config.ts` and add the accounts attribute to the network you want to deploy to. The accounts attribute should be an array of private keys.

Example:

```javascript
sepolia: {
      chainId: 11155111,
      url: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
      accounts: [YOUR_PRIVATE_KEY],
    },
```

## Tests

### Unit Tests

To run tests in watch mode:

```shell
npm run test
```

To run tests only once:

```shell
npm run test:ci
```

### Contract Tests

To run contract tests:

```shell
npm run test-contract
```