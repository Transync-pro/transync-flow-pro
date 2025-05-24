# TransSync Flow Pro - Application Workflow

## Overview

TransSync Flow Pro is a web application that allows users to connect their QuickBooks accounts and perform various operations such as exporting data, deleting records, and viewing operation history. This document outlines the core flow of the application from sign-up to QuickBooks authentication and executing actions.

## 1. Authentication Flow

### 1.1 User Registration (Sign Up)

1. User navigates to `/signup` page
2. User enters email, password, and optional metadata
3. The application calls Supabase Auth API to create a new user
4. Supabase sends a verification email to the user
5. User is redirected to the verification page (`/verify`)
6. Once the user verifies their email by clicking the link in the email:
   - The user's email is marked as verified in Supabase
   - The user can now log in to the application

### 1.2 User Login

1. User navigates to `/login` page
2. User enters email and password
3. The application processes the login attempt through `processLoginAttempt` to check for rate limiting or account locking
4. The application calls Supabase Auth API to authenticate the user
5. Upon successful authentication:
   - The user's session is stored in the application
   - The user is redirected to the dashboard (`/dashboard`)
6. If the user is not connected to QuickBooks, they are redirected to the disconnected page (`/disconnected`)

### 1.3 Social Authentication (Google)

1. User clicks "Sign in with Google" button
2. The application initiates the OAuth flow with Google through Supabase
3. User authenticates with Google and grants permissions
4. Upon successful authentication:
   - Supabase creates or updates the user account
   - The user is redirected back to the application
   - The user's session is stored in the application
   - The user is redirected to the dashboard (`/dashboard`)

## 2. QuickBooks Authentication Flow

### 2.1 Connecting to QuickBooks

1. User navigates to the QuickBooks connection page (`/connect-quickbooks`)
2. User clicks "Connect to QuickBooks" button
3. The application initiates the QuickBooks OAuth flow:
   - The user ID is stored in session storage
   - The application calls the `quickbooks-auth` edge function with the `authorize` path
   - The edge function generates an authorization URL for QuickBooks
   - The user is redirected to the QuickBooks authorization page
4. User authenticates with QuickBooks and grants permissions
5. QuickBooks redirects back to the application's callback URL (`/dashboard/quickbooks-callback`) with:
   - Authorization code
   - Realm ID (company ID)
   - State parameter (contains the user ID)
6. The callback page processes the response:
   - Calls the `quickbooks-auth` edge function with the `token` path
   - The edge function exchanges the authorization code for access and refresh tokens
   - The edge function stores the connection details in the `quickbooks_connections` table
   - The edge function fetches and stores the user's identity information
7. The user is redirected to the dashboard (`/dashboard`)

### 2.2 Token Refresh Process

1. When making API calls to QuickBooks, the application first checks if the access token is expired
2. If the token is expired:
   - The application calls the `quickbooks-auth` edge function with the `refresh` path
   - The edge function uses the refresh token to obtain a new access token
   - The edge function updates the connection details in the `quickbooks_connections` table
3. The application uses the valid access token to make API calls

### 2.3 Disconnecting from QuickBooks

1. User clicks "Disconnect" button in the profile or settings page
2. The application calls the `quickbooks-auth` edge function with the `revoke` path
3. The edge function revokes the tokens with QuickBooks
4. The edge function deletes the connection details from the `quickbooks_connections` table
5. The user is redirected to the disconnected page (`/disconnected`)

## 3. Data Operations Flow

### 3.1 Exporting Data

1. User navigates to the export page (`/dashboard/export`)
2. User selects an entity type (e.g., Customers, Invoices, etc.)
3. User selects a date range (required)
4. User clicks "Fetch Data" button
5. The application calls the `quickbooks-entities` edge function with:
   - Operation: `fetch`
   - Entity type: The selected entity type
   - User ID: The current user's ID
   - Query: Optional query string with date filters
6. The edge function:
   - Checks and refreshes the access token if needed
   - Makes an API call to QuickBooks to fetch the entities
   - Logs the operation in the `operation_logs` table
   - Returns the fetched entities to the client
7. The application displays the fetched entities in a table
8. User can:
   - Search and filter the data
   - Select specific records or fields to export
   - Export the data to CSV or other formats

### 3.2 Deleting Records

1. User navigates to the delete page (`/dashboard/delete`)
2. User selects an entity type (e.g., Customers, Invoices, etc.)
3. User selects a date range (required)
4. User clicks "Fetch Data" button
5. The application calls the `quickbooks-entities` edge function to fetch entities (same as export flow)
6. The application displays the fetched entities in a table
7. User selects records to delete
8. User clicks "Delete Selected" button
9. The application shows a confirmation dialog
10. Upon confirmation, for each selected record:
    - The application calls the `quickbooks-entities` edge function with:
      - Operation: `delete`
      - Entity type: The selected entity type
      - User ID: The current user's ID
      - ID: The record ID to delete
    - The edge function:
      - Checks and refreshes the access token if needed
      - Fetches the record to get the SyncToken
      - Depending on the entity type:
        - For most entities: Sets `Active=false` to "soft delete"
        - For transactions: Marks as cancelled by updating fields
      - Logs the operation in the `operation_logs` table
11. The application updates the UI to reflect the deleted records

### 3.3 Viewing Operation History

1. User navigates to the history page (`/dashboard/history`)
2. The application fetches operation logs from the `operation_logs` table
3. The application displays the logs in a table, showing:
   - Operation type (fetch, export, delete)
   - Entity type
   - Status (success, error)
   - Date and time
   - Record count or details
4. User can:
   - Filter logs by operation type, entity type, or date range
   - Search for specific logs
   - View details of each operation

## 4. Route Protection and Access Control

The application uses a `RouteGuard` component to protect routes based on:

1. Authentication status:
   - Public routes: Accessible to all users
   - Protected routes: Require user authentication
   - Public-only routes: Only accessible to unauthenticated users (e.g., login, signup)

2. QuickBooks connection status:
   - Some routes require an active QuickBooks connection
   - If a user tries to access a route that requires QuickBooks but isn't connected, they are redirected to the disconnected page

3. Admin status:
   - Admin routes (e.g., `/admin/*`) are only accessible to users with admin privileges
   - Admin status is determined by checking the user's role in the database

## 5. Error Handling and Logging

1. Client-side errors:
   - Unhandled exceptions and promise rejections are caught and logged
   - Errors are displayed to the user via toast notifications

2. Server-side errors:
   - Edge function errors are logged and returned to the client
   - Database operation errors are logged and handled appropriately

3. Operation logging:
   - All QuickBooks operations (fetch, export, delete) are logged in the `operation_logs` table
   - Logs include operation type, entity type, status, and details

## 6. Dashboard and Analytics

1. The dashboard (`/dashboard`) displays:
   - Connection status to QuickBooks
   - Recent activity from the operation logs
   - Statistics on data operations (exports, deletions, etc.)
   - Quick links to common actions

2. Analytics are derived from the operation logs to show:
   - Operation counts by type
   - Success rates
   - Trends over time

## Conclusion

This document outlines the core flow of the TransSync Flow Pro application from user registration to QuickBooks authentication and data operations. The application follows a secure and structured approach to handling user authentication, QuickBooks integration, and data operations, with comprehensive logging and error handling.
