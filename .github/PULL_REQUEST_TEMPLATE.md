# Description
Add a link to the Pivotal ticket and a brief description of the changes included in this PR.

# Impact
Describe impact, risks and mitigation if applicable.
- Impact: (Critical / High / Medium / Low)
    - Critical: Architectural changes / big refactorings / changes that touches core parts that can impact service availability
    - High: Changes to core features / UI changes that can block app usage
    - Medium: UI changes that can block some actions but not the core features
    - Low: Small UI changes on rarely used features (Most users wouldn't even notice)
- Mitigation: These changes are behind a beta-flag / This feature isn't publicly available yet /  

# How to test
Describe test steps to check if the changes are working properly and that it meets the ticket AC.
Is there any setup steps needed?
Is there unit tests to cover the new changes?

## 1. (Example) User should be able to see printed value
- Go to page X
- Click on the `Print value` button
- [ ] You should be able to see the value printed

### Testing scenarios
Node: please remove the scenarios that weren't affected by this PR
#### As a user, I
- [ ] Can log in
- [ ] Can log out
- [ ] Can connect a wallet
- [ ] Can change default wallet
- [ ] Can remove a wallet if it is not the default wallet
- [ ] Can create Transfer Requests for self
- [ ] Can edit and submit draft requests created for them

#### As a super admin, I
- [ ] Can add user roles
- [ ] Can remove user roles
- [ ] Can add programs
- [ ] Can remove programs
- [ ] Can assign programs to approvers
- [ ] Can remove programs from approvers

#### As an address manager, I
- [ ] Can view list of user addresses

#### As an approver, I
- Can create Transfer Requests for someone else
  - [ ] As a single request
  - [ ] As multiple requests
- Can create Transfer Requests for someone else as a draft
  - [ ] As a single request
  - [ ] As multiple requests
- [ ] Can edit Transfer Requests in the submitted, approved, and requires change statuses
- [ ] Can upload Transfer Requests via CSV
- Can approve Transfer Requests
  - [ ] For a single request
  - [ ] For batch requests
- Can reject Transfer Requests
  - [ ] For a single request
  - [ ] For batch requests
- [ ] Can require changes for Transfer Requests
#### As a controller, I
- Can pay Transfer Requests
  - Without Multisig
   - [ ] Individually
   - [ ] In bulk
  - With Multisig
   - [ ] Individually
   - [ ] In bulk
- Can reject a Transfer Request
  - [ ] Individually
  - [ ] In bulk
