<h1 align="center">FilPass</h1>

<p align="center">
  <a aria-label="License" href="#license">
    <img alt="" src="https://img.shields.io/badge/MIT--Apache_2.0-%23034130?style=for-the-badge&label=LICENSE&labelColor=000000">
  </a>
</p>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Installing dependencies](#installing-dependencies)
  - [Database Setup](#database-setup)
    - [Starting the container](#starting-the-container)
    - [Running migrations](#running-migrations)
    - [Seeding the database with essential data](#seeding-the-database-with-essential-data)
  - [Application Start Up](#application-start-up)
  - [Running the application](#running-the-application)
  - [Documentation](#documentation)
- [Developer and System Administrator](#developer-and-system-administrator)
- [License](#license)
- [Acceptable Use Policy](#acceptable-use-policy)
- [Security](#security)

## Introduction

FilPass is an oracle platform that facilitates data retrieval from the Filecoin network in a secure and efficient way.

## Getting Started

To start using FilPass locally, follow the steps below.

### Requirements

Before we follow to the setting up of the application, make sure you have the following tools installed:

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

You will also need to have the following services set up:

- [Mailgun](https://www.mailgun.com/)

### Installing dependencies

```shell
npm install
```

### Database Setup

#### Starting the container

```shell
docker-compose up -d
```

#### Running migrations

```shell
npm run migrate
```

#### Seeding the database with essential data

```shell
npm run seed
```

### Application Start Up

Before starting the application, make sure you have the following files set up:

- Environment: Create a file named `.env` in the root folder containing all environment variables defined at [env-vars](env-vars.md), also found in the root folder.

- Chains: If needed, change the `chains.ts` file to match your desired chains. The default chain is `filecoin`. You can find more information about the chains configuration file at [chains](./docs/chains-config.md).

- System: Change the app information on the `system.ts` file to match your company information. You can find more information about the system configuration file at [system-config](./docs/system-config.md).

### Running the application

```shell
npm run dev:server
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Documentation

For more information about getting started and business rules, check the [documentation](./documentation/en/documentation.md) page.

## Developer and System Administrator

If you are a developer or a system administrator and want some useful commands, check the [Developer Helpers](developer-helpers.md) page for more information.

## License

This project is open-source under the [MIT](LICENSE-MIT) and [Apache 2.0](LICENSE-APACHE) licenses.

## Acceptable Use Policy

Before you proceed to use FilPass, please make sure you read and understand the entire [Acceptable Use Policy](./docs/acceptable-use-policy.md). By accessing or using FilPass, you agree to all terms in this Policy without modification of any of its terms.

## Security

Your cooperation in maintaining the security of FilPass is highly appreciated. If you have identified a potential security vulnerability within the FilPass project, we kindly request that you handle the situation by following responsible disclosure practices, refraining from publicly posting the issue.

Rest assured, all credible and legitimate reports will be thoroughly investigated. To report any security vulnerabilities, please reach out to us via email at [filpass@test.ai](mailto:filpass@test.ai). Your vigilance contributes to the ongoing security of the project and is essential in ensuring the privacy and integrity of the FilPass application.
