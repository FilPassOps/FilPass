# FilPassTicket Specifications

On FilPass, we create a JWT token for each generated ticket with the core information. These tokens are used by users within the receiver/storage provider to retrieve data. The token is signed using one of the FilPass keys, and can be verified using the FilPass public key.

## Table of Contents
- [Overview](#overview)
- [Field Descriptions](#field-descriptions)
- [Decoded Ticket Example](#decoded-ticket-example)

## Overview

### What is a FilPass Ticket Token?

FilPass tickets have JWT tokens that contains essential information about the funder, receiver, and other details.

## Field Descriptions

### Core JWT Fields

| Field | Required | Type   | Description                                                                         |
| ----- | -------- | ------ | ----------------------------------------------------------------------------------- |
| `iss` | Yes      | string | (Issuer): The URL that provides the JWKS (JSON Web Key Set) for ticket verification |
| `jti` | Yes      | string | (JWT ID): Unique identifier for the ticket                                          |
| `exp` | Yes      | number | (Expiration Time): Unix timestamp when the ticket becomes invalid                   |
| `iat` | Yes      | number | (Issued At): Unix timestamp when the ticket was created                             |

### FilPass Specific Fields
| Field            | Required | Type   | Description                                             |
| ---------------- | -------- | ------ | ------------------------------------------------------- |
| `ticket_type`    | Yes      | string | Identifies the ticket as a FilPass ticket               |
| `ticket_version` | Yes      | string | Version control for the ticket format                   |
| `funder`         | Yes      | string | Wallet address of the entity funding the ticket         |
| `sub`            | Yes      | string | (Subject): The contract address that handles the ticket |
| `aud`            | Yes      | string | (Audience): The intended recipient's wallet address     |

### Lane Management Fields
| Field                    | Required | Type   | Description                                                                      |
| ------------------------ | -------- | ------ | -------------------------------------------------------------------------------- |
| `ticket_lane`            | Yes      | string | Enables parallel processing of transactions between the same funder and receiver |
| `lane_total_amount`      | Yes      | number | Running total of all transactions in the lane including the ticket amount in WEI |
| `lane_guaranteed_amount` | Yes      | number | Amount guaranteed for withdrawal at ticket creation in WEI                       |
| `lane_guaranteed_until`  | Yes      | number | Timestamp deadline for guaranteed amount withdrawal                              |

## Decoded Ticket Example

```json
{
  "iss": "https://example.com/.well-known/jwks.json",
  "jti": "750fbc00-9e5c-11ef-8676-e31c9113fc2d",
  "exp": 1735689600,
  "iat": 1704153600,
  "ticket_type": "filpass",
  "ticket_version": "1",
  "funder": "0x1234567890abcdef1234567890abcdef12345678",
  "sub": "0xabcdef1234567890abcdef1234567890abcdef12",
  "aud": "0x9876543210abcdef1234567890abcdef12345678",
  "ticket_lane": "0",
  "lane_total_amount": 100000000000000000,
  "lane_guaranteed_amount": 100000000000000000,
  "lane_guaranteed_until": 1731216482148
}
```