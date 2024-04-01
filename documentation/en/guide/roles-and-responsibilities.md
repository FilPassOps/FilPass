# Roles and Responsibilities

## Overview

Emissary's system architecture is structured around distinct roles, each designated to handle specific responsibilities. These roles are integral to the efficient functioning and management of the system.

## Default User

The Default User is the foundational role in the Emissary system, providing ordinary users with the ability to **create and manage their transfer requests**. All other roles, such as the Approver, Controller, Viewer, Address Manager, and Super Admin, build upon the functionalities of the Default User, each adding unique responsibilities and capabilities within the system.

## Approver

The Approver is one of the most important roles in the system. Approvers are responsible for **reviewing the transfer requests** associated with programs they are approvers of. Approvers can reject, approve, or require changes from transfer requests that they are reviewing. They can **create transfer requests for other users** manually or in batch and **create reports** based on the transfer requests they can access.

## Controller

The Controller is responsible for **reviewing the token amount and paying the transfer requests**. The Controller can reject or pay the transfer requests that they are reviewing. Controllers can also **create reports**.

## Viewer

The role of the Viewer is a supportive one that enables the user to **view all paid transfer requests** within a program in which they have been set as a Viewer. This role can be utilized to ensure that accuracy and compliance with the program are maintained. Additionally, the Viewer has the ability to **create reports**.

## Address Manager

The Address Manager role is typically used as a supporting role in conjunction with other roles. It allows the user to **view all default addresses** for all users within the system, along with the last date they were modified.

## Super Admin

The Super Admin is the most powerful role in the system. The Super Admin has the ability to **create and manage all users** and **create and manage all programs**. The Super Admin can also **change the token value manually**.

