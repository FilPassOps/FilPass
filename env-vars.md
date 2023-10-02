# Environment Variables

| ENV Var                         | Default/Example         | Description                                                              |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `NPM_CONFIG_UNSAFE_PERM`        | ` `                     | Run within the context of the running script.                            |
| `NODE_ENV`                      | `development`           | The actual node environment.                                             |
| `IS_DEV`                        | `true`                  |                                                                          |
| `ENV_NAME`                      | `development`           |                                                                          |
| `APP_SECRET`                    | `super-secret`          |                                                                          |
| `APP_URL`                       | `http://localhost:3000` |                                                                          |
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3000` | Define if the Transport Layer Security is enabled.                       |
| `DB_HOSTNAME`                   | `localhost`             | The Coin Emissary database hostname.                                     |
| `DB_PASSWORD`                   | `my_super_secret_pw`    | The Coin Emissary database password.                                     |
| `DB_NAME`                       | `coin_emissary`         | The Coin Emissary database name.                                         |
| `DB_PORT`                       | `5432`                  | The Coin Emissary database port.                                         |
| `DB_SCHEMA`                     | `emissary-disbursement` | The Coin Emissary database schema name.                                  |
| `DB_USERNAME`                   | `admin`                 | The Coin Emissary database username.                                     |
| `DATABASE_URL`                  | ` `                     | The Coin Emissary database entire url.                                   |
| `EMAIL_KEY`                     | ` `                     | Salt used for email encryption.                                          |
| `TEAM_KEY`                      | ` `                     | Salt used for team encryption.                                           |
| `MAILGUN_DOMAIN`                | ` `                     | The Mailgun domain if using the default implementation.                  |
| `MAILGUN_API_KEY`               | ` `                     | The Mailgun API key if using the default implementation.                 |
| `MAILGUN_SENDER_EMAIL`          | `no-reply@example.com`  | The Mailgun sender email if using the default implementation.            |
| `GOOGLE_CLIENT_SECRET`          | ` `                     | The Google client secret used to login with Google.                      |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`  | ` `                     | The public google client id used to login with Google.                   |
| `ENABLE_BLOCKCHAIN_INTERACTION` | ` `                     |                                                                          |
| `PRIVATE_KEY`                   | ` `                     |                                                                          |
| `NEXT_PUBLIC_CHAIN_ID`          | ` `                     |                                                                          |
| `COIN_MARKET_CAP_API_KEY`       | ` `                     |                                                                          |
| `COIN_MARKET_ENDPOINT`          | ` `                     |                                                                          |
| `BUCKET_ACCESS_KEY_ID`          | ` `                     | The AWS S3 bucket access key id if using the default implementation.     |
| `BUCKET_NAME`                   | ` `                     | The AWS S3 bucket name if using the default implementation.              |
| `BUCKET_REGION`                 | ` `                     | The AWS S3 bucket region if using the default implementation.            |
| `BUCKET_SECRET_ACCESS_KEY`      | ` `                     | The AWS S3 bucket secret access key if using the default implementation. |
