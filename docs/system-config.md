# System Configuration

The system configuration file is located at `src/config/system-config.ts`. This file contains the configuration data for the application.

Here's a breakdown of its properties:

- `name`: This is a string that represents the name of the application. It will be used in diverse parts of the system and also on emails.

- `companyName`: This string represents the company's name that owns the application. It will be used on some of the emails.

- `emailConfig`: This object holds the configuration for the application's email. It has the following properties:
  - `domain`: This string represents the domain of the company's email addresses. It will be used when checking if it was the system that have made changes on a transfer request and the seed dev creating new users.
  - `fromName`: This string represents the name that will appear in the 'From' field of the emails sent by the application.
  - `supportAddress`: This string represents the email address for the application's support. It will be used on some parts of the system and emails.
  - `logoUrl`: This string represents the URL of the company's logo. It will be used on the emails.
  - `twitterIconUrl`: This string represents the URL of the Twitter icon. It will be used on the emails.
  - `linkedinIconUrl`: This string represents the URL of the LinkedIn icon. It will be used on the emails.
  - `youtubeIconUrl`: This string represents the URL of the YouTube icon. It will be used on the emails.

- `twitterUrl`: This string represents the company's Twitter page URL. It will be used on the emails. If it is not set, it will not appear.

- `linkedinUrl`: This string represents the company's LinkedIn page URL. It will be used on the emails. If it is not set, it will not appear.

- `youtubeChannelUrl`: This string represents the URL of the company's YouTube channel. It will be used on the emails. If it is not set, it will not appear.


Here's an example of the system configuration file:


```typescript
export const app = {
  name: 'FilPass',
  companyName: 'Your Company',
  emailConfig: {
    domain: '@your-domain.com',
    fromName: 'FilPass Support',
    supportAddress: 'filpass@your-company.com',
    logoUrl: 'https://your-company.com/logo.png',
    twitterIconUrl: 'https://your-company.com/twitter.png',
    linkedinIconUrl: 'https://your-company.com/linkedin.png',
    youtubeIconUrl: 'https://your-company.com/youtube.png',
    },
  twitterUrl: 'https://twitter.com/your-company/',
  linkedinUrl: 'https://www.linkedin.com/company/your-company/',
  youtubeChannelUrl: 'https://www.youtube.com/your-company/',
};
```