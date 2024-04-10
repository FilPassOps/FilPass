<h1 align="center">Emissary</h1>

<p align="center">
  <a aria-label="Protocol Labs badge" href="https://protocol.ai/">
    <img src="https://img.shields.io/badge/MADE%20BY%20Protocol%20Labs-000000?style=for-the-badge">
  </a>
  <a aria-label="License" href="#license">
    <img alt="" src="https://img.shields.io/badge/MIT--Apache_2.0-%23034130?style=for-the-badge&label=LICENSE&labelColor=000000">034130
  </a>
  <a aria-label="Join the community" href="https://filecoinproject.slack.com/">
    <img alt="" src="https://img.shields.io/badge/Join%20the%20community-emissary?style=for-the-badge&logo=slack&color=%23034130">
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
- [Security](#security)

## Introduction

Emissary streamlines your invoicing workflow, making cryptocurrency transfer management effortless!

## Getting Started

To start using Emissary locally, follow the steps below.

### Requirements

Before we follow to the setting up of the application, make sure you have the following tools installed:

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

You will also need to have the following services set up:

- [AWS S3 Bucket](https://aws.amazon.com/s3/)
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

- Chains: If needed, change the `chains.ts` file to match your desired chains. The default chains are `filecoin` and `ethereum`. You can find more information about the chains configuration file at [chains](chains.md).

- System: Change the app information on the `system.ts` file to match your company information. You can find more information about the system configuration file at [system-config](system-config.md).

### Running the application

```shell
npm run dev:server
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Documentation

For more information about getting started and business rules, check the [documentation](./documentation/en/documentation.md) page.

## Developer and System Administrator

If you are a developer or a system administrator and want some useful commands to contribute to Emissary or maybe add a new token, check the [Developer Helpers](developer-helpers.md) page for more information.

## License

This project is open-source under the [MIT](LICENSE-MIT) and [Apache 2.0](APACHE-LICENSE) licenses.

## Security

Your cooperation in maintaining the security of Emissary is highly appreciated. If you have identified a potential security vulnerability within the Emissary project, we kindly request that you handle the situation by following responsible disclosure practices, refraining from publicly posting the issue.

Rest assured, all credible and legitimate reports will be thoroughly investigated. To report any security vulnerabilities, please reach out to us via email at [emissary@protocol.ai](mailto:emissary@protocol.ai). Your vigilance contributes to the ongoing security of the project and is essential in ensuring the privacy and integrity of the Emissary application.
