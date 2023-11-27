# Environment Variables

| ENV Var                        | Default/Example         | Description                                                                         | Required |
| ------------------------------ | ----------------------- | ----------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`                     | `development`           | The actual node environment.                                                        | NO       |
| `IS_DEV`                       | `true`                  |                                                                                     | NO       |
| `ENV_NAME`                     | `development`           |                                                                                     | NO       |
| `APP_SECRET`                   | `super-secret`          |                                                                                     | YES      |
| `APP_URL`                      | `http://localhost:3000` |                                                                                     | YES      |
| `NEXT_PUBLIC_APP_URL`          | `http://localhost:3000` |                                                                                     | YES      |
| `DATABASE_URL`                 | ` `                     | The Emissary database.                                                              | YES      |
| `EMAIL_KEY`                    | ` `                     | Salt used for email encryption.                                                     | YES      |
| `TEAM_KEY`                     | ` `                     | Salt used for team encryption.                                                      | YES      |
| `MAILGUN_DOMAIN`               | ` `                     | The Mailgun domain if using the default implementation.                             | NO       |
| `MAILGUN_API_KEY`              | ` `                     | The Mailgun API key if using the default implementation.                            | NO       |
| `MAILGUN_SENDER_EMAIL`         | `no-reply@example.com`  | The Mailgun sender email if using the default implementation.                       | NO       |
| `GOOGLE_CLIENT_SECRET`         | ` `                     | The Google client secret used to login with Google.                                 | NO       |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ` `                     | The public google client id used to login with Google.                              | NO       |
| `PRIVATE_KEY`                  | ` `                     |                                                                                     | NO      |
| `COIN_MARKET_CAP_API_KEY`      | ` `                     | The API Key of the service that will be used to get the actual value of the tokens  | NO       |
| `COIN_MARKET_ENDPOINT`         | ` `                     | The Endpoint of the service that will be used to get the actual value of the tokens | NO       |
| `BUCKET_ACCESS_KEY_ID`         | ` `                     | The AWS S3 bucket access key id if using the default implementation.                | YES      |
| `BUCKET_NAME`                  | ` `                     | The AWS S3 bucket name if using the default implementation.                         | YES      |
| `BUCKET_REGION`                | ` `                     | The AWS S3 bucket region if using the default implementation.                       | YES      |
| `BUCKET_SECRET_ACCESS_KEY`     | ` `                     | The AWS S3 bucket secret access key if using the default implementation.            | YES      |
| `CRYPTO_ALGORITHM`             | `aes-256-cbc`           | The algorithm used to encrypt the data.                                             | YES      |
| `CRYPTO_SECRET_KEY`            | `super-secret`          | The secret key used to encrypt the data.                                            | YES      |
| `CRYPTO_SECRET_KEY_PII`        | `super-secret_pii`      | The secret key used to encrypt the PII data.                                        | YES      |