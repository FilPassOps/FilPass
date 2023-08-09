# Changelog

All notable changes to this project will be documented in this file.

## Open-source

### New ENV vars:

```
CRYPTO_ALGORITHM="aes-256-cbc"
CRYPTO_SECRET_KEY="<Random 256 bit 32 Byte Hex>"
CRYPTO_SECRET_KEY_PII="<Random 256 bit 32 Byte Hex>"
```

### Breaking changes

- `OFAC_SANCTION_EMAIL_RECEIVER` changed to `SANCTION_EMAIL_RECEIVER`

## Version 2.0.0

### New ENV vars:


```
DATABASE_URL="postgresql://postgres:<password>@<host>:<port>/<database>"
BYPASS_ALLOWED_DOMAINS="@protocol.ai,@email.com"
```

### Breaking changes

Database user role update:

```
revoke rds_iam from postgres_<env>;
```

## Version 2.2.0

### New ENV vars:

```
TEAM_KEY="<team_salt>"
```

### New scripts:

Create hash for all teams:


- Create hash for all teams: [`createTeamHash.js`](https://github.com/protocol/crypto-ops/blob/main/scripts/database/createTeamHash.js)


## Version 2.3.0

### New ENV vars:


```
METAMASK_CONNECTION_REWARD_AMOUNT="0.2"
METAMASK_CONNECTION_REWARD_DOMAIN="@protocol.ai"

```

### Breaking changes

- For Web3 development, the minimum Node version is 16.17.0
