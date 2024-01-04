# System Configuration

The system configuration file is located at `src/config/system-config.ts`. This file contains the configuration data for the application.

Here's a breakdown of its properties:

- `name`: This is a string that represents the name of the application. It will be used in diverse parts of the system and also on emails.

- `companyName`: This string represents the company's name that owns the application. It will be used on some of the emails.

- `emailConfig`: This object holds the configuration for the application's email. It has the following properties:
  - `domain`: This string represents the domain of the company's email addresses. It will be used when checking if it was the system that have made changes on a transfer request and the seed dev creating new users.
  - `fromName`: This string represents the name that will appear in the 'From' field of the emails sent by the application.
  - `supportAddress`: This string represents the email address for the application's support. It will be used on some parts of the system and emails.

- `enableCoinMarketApi`: This boolean indicates whether the Coin Market API is enabled. The coin market API is used to get the actual value of the token as a Super Admin.

- `twitterUrl`: This string represents the company's Twitter page URL. It will be used on the landing page and in emails. If it is not set, it will not appear.

- `linkedinUrl`: This string represents the company's LinkedIn page URL. It will be used on the landing page and in emails. If it is not set, it will not appear.

- `youtubeChannelUrl`: This string represents the URL of the company's YouTube channel. It will be used on the landing page and in emails. If it is not set, it will not appear.


Here's an example of the system configuration file:


```typescript
export const app = {
  name: 'Emissary',
  companyName: 'Protocol Labs',
  emailConfig: {
    domain: '@protocol.ai',
    fromName: 'Emissary Support',
    supportAddress: 'emissary@test.com',
    },
  enableCoinMarketApi: true,
  twitterUrl: 'https://twitter.com/protocollabs/',
  linkedinUrl: 'https://www.linkedin.com/company/protocollabs/',
  youtubeChannelUrl: 'https://www.youtube.com/ProtocolLabs/',
};
```