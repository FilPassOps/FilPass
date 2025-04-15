## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Change the chain to calibration or mainnet](#change-the-chain-to-calibration-or-mainnet)
- [Database](#database)
  - [Database Migrations](#database-migrations)
  - [DDL Migrations (Structural changes)](#ddl-migrations-structural-changes)
  - [DML Migrations (Data changes)](#dml-migrations-data-changes)
- [Jobs](#jobs)
  - [Running Jobs](#running-jobs)
    - [Check deploy contract transaction](#check-deploy-contract-transaction)
    - [Check submit ticket transaction](#check-submit-ticket-transaction)
    - [Check buy credits transaction](#check-buy-credits-transaction)
    - [Check refund transaction](#check-refund-transaction)
    - [Check expired ticket groups](#check-expired-ticket-groups)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Contract Tests](#contract-tests)


## Introduction

Here are some useful commands and configuration details to help you use FilPass.


## Change the chain to calibration or mainnet

To change the chain to calibration or mainnet, you need to change the IS_DEV environment variable to true or false. True is for calibration and false is for mainnet.

## Database

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


## Jobs

The jobs are located in the `/jobs` folder. They start running with `npm run server` or when you run `npm start`.

### Running Jobs

#### Check deploy contract transaction

Responsible to check if there are any pending deploy contract transactions and check on the blockchain if the transaction was successful or not, and update the transaction status and the contract table accordingly.

#### Check submit ticket transaction

Responsible to check if there are any pending submit ticket transactions and check on the blockchain if the transaction was successful or not, and update the transaction status, user credits, and the ticket table accordingly.


#### Check buy credits transaction

Responsible to check if there are any pending buy credits transactions and check on the blockchain if the transaction was successful or not, and update the transaction status and user credits accordingly.


#### Check refund transaction

Responsible to check if there are any pending refund transactions and check on the blockchain if the transaction was successful or not, and update the transaction status, user credits, and the tickets accordingly.

#### Check expired ticket groups

Responsible to check if there are any expired ticket groups and update the ticket group status and the tickets status accordingly.


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