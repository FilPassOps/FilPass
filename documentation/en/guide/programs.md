# Programs


## Overview

In the Emissary system, programs are essential components. Every transfer request submitted must be connected to a specific program. This program includes key information, such as the type of token being requested and the payment method. Each program is overseen by a group of approvers. Their job is to review the transfer requests related to their program, ensuring they meet the program’s standards. Additionally, programs may have assigned viewers who can access all the paid transfer requests for that particular program. This system offers an efficient and rule-compliant way to manage transfer requests.

## Creating Programs

To create a new program, follow the steps:

1. Log in with an account with a Super Admin role.
2. Navigate to the "Active" section under "Program Settings" in the sidebar.
3. Click "Create New Program" on the Program Settings page.
4. Fill in the requested information.
5. Click "Submit” to create the program.

Once created, your program will appear in the list, ready for use in new transfer requests.

<code>ℹ️ Programs can only be created or edited by [Super Admins](../get-started/admin.md)</code>


### Program Fields

| Name | Description |
| --- | --- |
| Program Name | A name that represents the program and is easily understandable. |
| Program Type | Programs could have two different types: </br> </br> **Internal**: Only Approvers had access to create transfer requests for other users using this program. </br> **External**: All users can see and create transfer requests using this program. |
| Payment Method | The requested token/currency and the token used to pay. |
| Delivery Method | It defines how the payment will be made. |
| Approvers |  It defines the approvers responsible for reviewing the transfer requests related to the program. Only selected approvers will see the transfer requests associated with this program. |
| Viewers | An optional field that defines the viewers who can see the transfer request information related to the program. |