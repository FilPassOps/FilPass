<h1 align="center">Emissary</h1>

<p align="center">
  <a aria-label="Protocol Labs badge" href="https://protocol.ai/">
    <img src="https://img.shields.io/badge/MADE%20BY%20Protocol%20Labs-000000?style=for-the-badge">
  </a>
  <a aria-label="License" href="#license">
    <img alt="" src="https://img.shields.io/badge/MIT-%234F46E5?style=for-the-badge&label=LICENSE&labelColor=000000">
  </a>
  <a aria-label="Join the community" href="https://filecoinproject.slack.com/">
    <img alt="" src="https://img.shields.io/badge/Join%20the%20community-emissary?style=for-the-badge&logo=slack&color=%234F46E5">
  </a>
</p>

## Introduction

Emissary streamlines your invoicing workflow, making cryptocurrency transfer management effortless!

## Table of Contents

- [Introduction](#introduction)
- [Table of Contents](#table-of-contents)
- [Database Setup](#database-setup)
  - [Starting the container](#starting-the-container)
  - [Running migrations](#running-migrations)
  - [Seeding the database](#seeding-the-database)
- [Application Start Up](#application-start-up)
  - [Installing dependencies](#installing-dependencies)
  - [Running the application](#running-the-application)
- [Scripts](#scripts)
- [Database Migrations](#database-migrations)
  - [DDL Migrations (Structural changes)](#ddl-migrations-structural-changes)
  - [DML Migrations (Data changes)](#dml-migrations-data-changes)
- [Tests](#tests)
- [Contract Tests](#contract-tests)
- [License](#license)
- [Security](#security)

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

    - user1@email.com to user149@test.com / password

  - Users with specific roles (the email domain for specific users is defined on the config.js file)
    - test-approver / password
    - test-controller / password
    - test-viewer / password
    - test-super / password

## Application Start Up

Before starting the application, make sure you have a file named `.env` in the root folder containing all environment variables defined at [env-vars](env-vars.md), also found in the root folder.

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

## Security

Your cooperation in maintaining the security of Emissary is highly appreciated. If you have identified a potential security vulnerability within the Emissary project, we kindly request that you handle the situation by following responsible disclosure practices, refraining from publicly posting the issue.

Rest assured, all credible and legitimate reports will be thoroughly investigated. To report any security vulnerabilities, please reach out to us via email at [emissary@protocol.ai](mailto:emissary@protocol.ai). Your vigilance contributes to the ongoing security of the project and is essential in ensuring the privacy and integrity of the Emissary application.
