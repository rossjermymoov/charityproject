# Sage Intacct Integration

This document describes the Sage Intacct integration for the DeepCharity CRM application, which enables syncing of donations and financial data to Sage Intacct cloud accounting.

## Overview

The Sage Intacct integration provides:

- **GL Sync**: Automatically post donations as journal entries to Sage GL accounts
- **Account Mapping**: Configure which GL accounts receive each donation type
- **Dimension Support**: Tag journal entries with departments, locations, and projects
- **Sync Dashboard**: Monitor sync status and view sync history
- **Batch & Real-Time Options**: Choose between real-time posting or batched sync

## Architecture

### Database Models

#### `SystemSettings`
Stores Sage Intacct credentials (encrypted in production):
- `sageCompanyId`: Sage Intacct Company ID
- `sageSenderId`: Web Services Sender ID
- `sageSenderPassword`: Sender Password (encrypted)
- `sageUserId`: User ID for API authentication
- `sageUserPassword`: User Password (encrypted)
- `sageEnabled`: Enable/disable toggle

#### `SageAccountMapping`
Maps donation types to Sage GL accounts and dimensions:
- `donationType`: DONATION, EVENT_FEE, SPONSORSHIP, LEGACY, GRANT, MEMBERSHIP, PAYMENT, OTHER
- `ledgerCodeId`: Link to internal LedgerCode (optional)
- `sageAccountNo`: GL Account Number (e.g., 4010)
- `sageAccountName`: Account description
- `sageDepartment`: Sage dimension - department
- `sageLocation`: Sage dimension - location
- `sageProject`: Sage dimension - project/campaign
- `direction`: DEBIT or CREDIT
- `isActive`: Active/inactive toggle

#### `SageSyncLog`
Tracks all sync operations:
- `entityType`: DONATION, COST, CONTACT, VENDOR
- `entityId`: ID of the record synced
- `sageRef`: Sage Intacct reference/key returned
- `status`: PENDING, SYNCED, ERROR, SKIPPED
- `errorMessage`: Error details if failed
- `requestData`: JSON of data sent
- `responseData`: JSON of response
- `syncedAt`: Sync completion timestamp

### Pages & Routes

#### `/settings/integrations/sage-intacct`
Main configuration page for Sage Intacct credentials.

**Features:**
- Connection status indicator
- API credentials input form
- Enable/disable toggle
- Feature overview cards
- Links to mappings and sync dashboard

**Server Action:**
- `saveSageSettings(formData)` - Upsert credentials to SystemSettings

#### `/settings/integrations/sage-intacct/mappings`
Configure account mappings between donation types and GL accounts.

**Features:**
- Table of existing mappings
- Add new mapping form
- Donation type selector
- Ledger code selector
- Sage dimensions input (department, location, project)
- Debit/credit direction selector
- Delete mapping action

**Server Actions:**
- `addAccountMapping(formData)` - Create new mapping
- `removeAccountMapping(formData)` - Delete mapping

#### `/settings/integrations/sage-intacct/sync`
Monitor sync status and trigger manual syncs.

**Features:**
- Summary stats (synced, pending, errors, last sync)
- Manual sync trigger button
- Recent sync logs table
- Status badges with icons
- Entity type and ID columns
- Sage reference and error details

**Server Actions:**
- `triggerSync(formData)` - Initiate manual sync
- `getSageStats()` - Fetch sync statistics

## Implementation Guide

### Credentials Setup

1. Navigate to Settings → Integrations → Sage Intacct
2. Enter your Sage Intacct credentials:
   - Company ID (e.g., "MyCharity")
   - Sender ID (Web Services user)
   - Sender Password
   - User ID (API user)
   - User Password
3. Check "Enable Sage Intacct sync"
4. Click "Save Settings"

### Configure Account Mappings

1. Go to Account Mappings
2. For each donation type (DONATION, EVENT_FEE, etc.):
   - Select the donation type
   - Choose an internal ledger code (optional)
   - Enter the target Sage GL account number
   - Add optional dimensions (department, location, project)
   - Set debit or credit direction
3. Click "Add Mapping"

### Trigger Syncs

1. Go to Sync Dashboard
2. Click "Sync Now" to immediately sync recent donations
3. Monitor the sync logs to track progress
4. Check status: PENDING (in progress), SYNCED (success), ERROR (failed), SKIPPED (no mapping)

## TODO: Full Implementation

The following items require completion for production use:

### Authentication & Session Management
```typescript
// In `/lib/sage-intacct.ts` - `getAPISession()`
// TODO:
// 1. Build XML auth request using buildAuthXml()
// 2. POST to SAGE_API_ENDPOINT with XML body
// 3. Parse XML-RPC response
// 4. Extract sessionId from response
// 5. Handle authentication failures with retry logic
// 6. Cache sessionId with TTL
```

### Journal Entry Creation
```typescript
// In `/lib/sage-intacct.ts` - `createJournalEntry()`
// TODO:
// 1. Build journal entry XML with all lines
// 2. Validate debit/credit balance (must equal)
// 3. Validate GL accounts exist in Sage
// 4. Map dimensions from entry to Sage format
// 5. POST to Sage API with session ID
// 6. Parse response and extract record key
// 7. Handle validation errors (unbalanced entry, invalid accounts)
```

### Donation Sync Flow
```typescript
// In `/lib/sage-intacct.ts` - `syncDonation()`
// TODO:
// 1. Get API session from getAPISession()
// 2. Find account mapping for donation type
// 3. Map donation to journal entry via mapDonationToJournal()
// 4. Create journal entry via createJournalEntry()
// 5. Log sync result in SageSyncLog table
// 6. Handle errors and update status
// 7. Support batch syncing with partial failures
```

### Batch Sync Implementation
```typescript
// In `/lib/sage-intacct.ts` - `batchSyncDonations()`
// TODO:
// 1. Query unsynced donations from database
// 2. Group by account mapping
// 3. Create batch request to minimize API calls
// 4. Handle rate limiting
// 5. Implement retry logic for failed entries
// 6. Update SageSyncLog entries with status
// 7. Return summary of synced/failed counts
```

### Contact/Vendor Sync
```typescript
// In `/lib/sage-intacct.ts` - `syncContact()`
// TODO:
// 1. Fetch contact details from DeepCharity
// 2. Create customer record in Sage (for donors)
// 3. Create vendor record in Sage (for suppliers)
// 4. Map contact fields to Sage format
// 5. Handle duplicate detection
// 6. Update sync log with Sage reference
```

### Password Encryption
```typescript
// In `/app/(dashboard)/settings/integrations/sage-intacct/actions.ts`
// TODO:
// 1. Implement field-level encryption before storing passwords
// 2. Use AWS KMS, HashiCorp Vault, or library like libsodium
// 3. Store encrypted values in database
// 4. Decrypt on-the-fly when authenticating with Sage
// 5. Never log passwords in error messages or sync logs
```

### Connection Testing
```typescript
// In `/app/(dashboard)/settings/integrations/sage-intacct/actions.ts` - `testSageConnection()`
// TODO:
// 1. Call buildAuthXml() to create auth request
// 2. POST to Sage API endpoint with credentials
// 3. Parse XML response to check for success
// 4. Return connection status (success/failed)
// 5. Provide detailed error messages for debugging
```

### Error Handling & Validation
```typescript
// In `/lib/sage-intacct.ts`
// TODO:
// 1. Validate journal entry balancing (debits = credits)
// 2. Check GL accounts exist in Sage before posting
// 3. Validate dimension codes match Sage configuration
// 4. Implement exponential backoff for API retries
// 5. Handle rate limiting (max requests/minute)
// 6. Provide detailed error messages in sync logs
// 7. Create error notification system for failed syncs
```

### Filtering & Reporting
```typescript
// In `/app/(dashboard)/settings/integrations/sage-intacct/sync/page.tsx`
// TODO:
// 1. Add status filter (SYNCED, PENDING, ERROR, SKIPPED)
// 2. Add entity type filter (DONATION, COST, CONTACT, VENDOR)
// 3. Add date range picker
// 4. Implement pagination for large result sets
// 5. Add CSV export for sync logs
// 6. Show detailed error messages in expandable rows
// 7. Implement webhook status and retry options
```

## Security Considerations

### Password Storage
- Passwords must be encrypted before storage (field-level encryption)
- Use a proper key management service (AWS KMS, HashiCorp Vault)
- Never log passwords in error messages or sync logs
- Implement secure password input fields (password type, no autocomplete)

### API Credentials
- Store credentials in environment variables or secure vault (not in code)
- Use separate API credentials for dev/staging/production
- Rotate credentials regularly
- Monitor API access logs for unusual activity
- Implement rate limiting to prevent brute-force attacks

### Data Protection
- Ensure sync logs don't contain sensitive PII (use hashing for IDs if needed)
- Implement audit logging for all settings changes
- Add role-based access control (admin only)
- Encrypt sync logs in transit and at rest

### Testing
- Create test credentials in Sage Intacct sandbox environment
- Implement connection testing before saving credentials
- Add validation tests for journal entry balancing
- Test error handling and retry logic
- Verify encryption/decryption functionality

## API Reference

### Sage Intacct XML-RPC API

The integration uses Sage Intacct's XML-RPC API. Key operations:

```xml
<!-- Authentication Request -->
<request>
  <control>
    <senderid>SENDER_ID</senderid>
    <password>SENDER_PASSWORD</password>
  </control>
  <operation>
    <authentication>
      <login>
        <userid>USER_ID</userid>
        <companyid>COMPANY_ID</companyid>
        <password>USER_PASSWORD</password>
      </login>
    </authentication>
    <content>
      <function>
        <getAPISession />
      </function>
    </content>
  </operation>
</request>

<!-- Journal Entry Request -->
<request>
  <control>
    <senderid>SENDER_ID</senderid>
    <password>SENDER_PASSWORD</password>
  </control>
  <operation>
    <authentication>
      <sessionid>SESSION_ID</sessionid>
    </authentication>
    <content>
      <function>
        <create>
          <JournalEntry>
            <journal>General</journal>
            <dateEntered>2024-03-28</dateEntered>
            <referenceNumber>DONATION-001</referenceNumber>
            <description>Donation received</description>
            <JournalEntryItems>
              <JournalEntryItem>
                <accountno>4010</accountno>
                <amount>100.00</amount>
                <debitcredittype>debit</debitcredittype>
              </JournalEntryItem>
              <JournalEntryItem>
                <accountno>1010</accountno>
                <amount>100.00</amount>
                <debitcredittype>credit</debitcredittype>
              </JournalEntryItem>
            </JournalEntryItems>
          </JournalEntry>
        </create>
      </function>
    </content>
  </operation>
</request>
```

### Endpoints
- **API Base**: `https://api.intacct.com/ia/xml/xmlgw.phtml`
- **Operations**: getAPISession, create, update, read, readByQuery, delete

## Troubleshooting

### Authentication Failures
- Verify credentials are correct in Sage Intacct settings
- Check that Web Services is enabled for the user
- Ensure API user has appropriate permissions
- Check IP whitelisting if configured

### Sync Failures
- Verify GL accounts exist in Sage (check Account Mappings)
- Ensure dimensions (department, location, project) match Sage config
- Check that journal entries are balanced (debits = credits)
- Review detailed error messages in sync logs

### Missing Sync Logs
- Verify Sage Intacct is enabled in settings
- Check that donations were created after sync was triggered
- Review database for SageSyncLog entries
- Check application logs for sync errors

## Development Notes

### Local Testing
- Use Sage Intacct sandbox environment credentials
- Test with small donation amounts first
- Verify GL account mappings are correct
- Check journal entry balancing before posting
- Review sync logs for any warnings

### Database Migrations
- Schema changes are tracked in `/prisma/migrations/`
- Run `npx prisma migrate dev` to apply migrations
- Use `npx prisma studio` to browse data
- Backup database before running migrations

### Code Organization
- Utilities: `/lib/sage-intacct.ts`
- Pages: `/app/(dashboard)/settings/integrations/sage-intacct/`
- Actions: `/app/(dashboard)/settings/integrations/sage-intacct/actions.ts`
- Database: `/prisma/schema.prisma`

## Future Enhancements

1. **Real-Time Sync**: Post donations immediately instead of batch
2. **Webhook Support**: Receive notifications from Sage when GL entries are updated
3. **Reconciliation**: Auto-match Sage GL entries with bank transactions
4. **Multi-Currency**: Support multiple currencies in journal entries
5. **Custom Fields**: Map DeepCharity custom fields to Sage custom dimensions
6. **Scheduled Sync**: Run sync on a schedule (hourly, daily, weekly)
7. **Vendor Integration**: Sync suppliers and expenses to Sage
8. **Cost Allocation**: Allocate indirect costs across funds/campaigns
9. **Financial Reports**: Pull GL data from Sage for reporting
10. **Audit Trail**: Implement detailed audit logging for all transactions

## Support

For issues or questions:
- Check the TODO comments in `/lib/sage-intacct.ts` for implementation status
- Review Sage Intacct API documentation: https://developer.intacct.com/
- Check application logs for error details
- Verify database migrations applied correctly
