## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Database](#database)
  - [Seeding the database with development data](#seeding-the-database-with-development-data)
  - [Database Migrations](#database-migrations)
  - [DDL Migrations (Structural changes)](#ddl-migrations-structural-changes)
  - [DML Migrations (Data changes)](#dml-migrations-data-changes)
- [Jobs](#jobs)
  - [Running Jobs](#running-jobs)
    - [Requires change](#requires-change)
    - [Check pending transfer requests](#check-pending-transfer-requests)
- [Adding a New Token to Emissary](#adding-a-new-token-to-emissary)
- [Tests](#tests)
  - [Unit Tests](#unit-tests)
  - [Contract Tests](#contract-tests)


## Introduction

Here are some useful commands and configuration details to help you contribute or use Emissary.


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


## Jobs

The jobs are located in the `/jobs` folder. They start running with `npm run server` or when you run `npm start`.

### Running Jobs

#### Requires change

`/jobs/requires-change-notification.ts`

The requires change job is used to send a notification to the users that have a transfer request that requires change for more than 30 days.
The job runs at 06:00 AM every day in the server timezone.

#### Check pending transfer requests

`/jobs/check-pending-transfer.ts`

The check pending transfer job is responsible to check if there are any pending transfer requests and check on the blockchain if the transfer was successful or not, and update the transfer request status accordingly.
The job runs every 2 minutes.


## Adding a New Token to Emissary

Emissary supports a variety of tokens. To integrate a new token into the system, simply follow these steps:

1. **Icon Addition**:
   - Place the icon of the new token into the `/public/blockchain-icons` directory. This icon represents the token in the Emissary interface.

2. **Token Information Update**:
   - Update the `chains.ts` file with the new token's details. This file contains essential information about different chains supported by Emissary. For detailed guidance on how to format and enter this information, refer to the [Chain Configuration Documentation](/docs/chains-config.md).

3. **Network Configuration**:
   - Modify the `hardhat.config.ts` file to include the new token. Specifically, add an `accounts` attribute under the network configuration where the token will be deployed. For example:

     ```javascript
     YOUR_CHAIN_NAME: {
       chainId: 11155111,
       url: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
       accounts: [YOUR_PRIVATE_KEY],
     },
     ```

4. **Deploying the Contract**:
   - Execute the deployment command. Replace `YOUR_CHAIN_NAME` in the command below with the actual name of the chain to which you are deploying:

     ```shell
     npm run deploy:YOUR_CHAIN_NAME
     ```

   This command initiates the deployment of the contract to the specified blockchain network.

By following these steps, you can seamlessly add new tokens to the Emissary system, enhancing its functionality and compatibility.

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