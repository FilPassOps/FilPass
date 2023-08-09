# Coin Emissary

## Introduction

This is the README file for Coin Emissary. It provides information about the application's setup, configuration, and usage.

## Table of Contents

- [Database Setup](#database-setup)
- [Application Start Up](#application-start-up)
- [Scripts](#scripts)
- [Database Migrations](#database-migrations)
- [Tests](#tests)
- [Contract Tests](#contract-tests)
- [License](#license)

## Database Setup

### Starting the container

```shell
docker-compose up -d
```

### Running migrations

```shell
npm run migrate
```

### Seeding the database

- With essential data only: `npm run seed`

- With test data `npm run seed:dev`

  - The seed:dev create the following test users:

  - General users

    - user1@email.com to user149@email.com / 123

  - Users with specific roles (the email domain for specific users is defined on the config.js file)
    - test-approver / 123
    - test-controller / 123
    - test-finance / 123
    - test-viewer / 123
    - test-compliance / 123
    - test-super / 123

## Application Start Up

Before starting the application, make sure you have a file named `.env` in the root folder containing all environment variables defined at `.env-sample`, also found in the root folder.

### Installing dependencies

```shell
npm install
```

### Running the application

```shell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `ts-node scripts/decrypt.ts <your_encrypted_content>`
  - Decrypts the argument using the current KMS environment configuration
- `ts-node scripts/encrypt.ts <your_decrypted_content>`
  - Encrypts the argument using the current KMS environment configuration
- `node scripts/getDatabaseUsers.js`
  - Generates an AWS RDS IAM auth token based on the current DB environment variables
- `node scripts/importFromCSV.js <file_path>`
  - Imports users that are on the CSV file to the database
  - **File template:**
    ```
    Email;FIL Address
    email;address
    email;address
    email;address
    ```

## Database Migrations

Migration files can be found under the `/prisma/migrations` folder and are executed by the `vercel-build` hook script whenever a new build is triggered.

They can be executed locally by running the `npm run migrate` script.

Migrations that were already run are stored in the `_prisma_migrations` database table and are executed only once.

Check [Prisma documentation](https://www.prisma.io/docs/guides/database) for more info.

### DDL Migrations (Structural changes)

1. Make the desired changes to the `/prisma/schema.prisma` file.
2. Run `npx prisma migrate dev --create-only` to create the migration. A new folder will be added to the migrations folder containing a migration file with all the changes made to the schema.

### DML Migrations (Data changes)

1. Run `npx prisma migrate dev --create-only` to create the migration file. A new folder will be added to the migrations folder with an empty migration file.
2. Add the desired changes to the migration file.

## Tests

To run tests in watch mode:

```shell
npm run test
```

To run tests only once:

```shell
npm run test:ci
```

## Contract Tests

To run contract tests:

```shell
npm run test-contract
```

<!-- temporary license -->

## License

This project is open-source under the [MIT License](LICENSE).
