# Donation Batch CSV Import Feature

## Overview

The Donation Batch CSV Import feature allows bulk uploading of donations from CSV files. It provides validation, error reporting, and contact/campaign matching.

## Database Schema

### DonationImport Table

```prisma
model DonationImport {
  id              String   @id @default(cuid())
  filename        String
  status          String   @default("PENDING") // PENDING | PROCESSING | COMPLETED | FAILED
  totalRows       Int      @default(0)
  processedRows   Int      @default(0)
  successRows     Int      @default(0)
  errorRows       Int      @default(0)
  errors          Json     @default("[]") // Array of {row: number, field: string, message: string}
  userId          String
  createdAt       DateTime @default(now())
  completedAt     DateTime?

  user            User     @relation("DonationImportCreatedBy", fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

## API Routes

### 1. Upload & Process CSV
**POST** `/api/donations/import`

Accepts multipart form data with a CSV file.

**Request:**
```
Content-Type: multipart/form-data
file: <CSV file>
```

**Response:**
```json
{
  "id": "cuid",
  "filename": "donations.csv",
  "status": "PROCESSING",
  "totalRows": 50,
  "processedRows": 0,
  "successRows": 0,
  "errorRows": 0,
  "errors": [],
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": null,
  "user": { "id", "name", "email" }
}
```

### 2. List Imports
**GET** `/api/donations/import`

Returns all past imports for the authenticated user.

**Response:**
```json
[
  {
    "id": "cuid",
    "filename": "donations.csv",
    "status": "COMPLETED",
    "totalRows": 50,
    "processedRows": 50,
    "successRows": 45,
    "errorRows": 5,
    "createdAt": "2024-01-15T10:00:00Z",
    "completedAt": "2024-01-15T10:05:00Z"
  }
]
```

### 3. Get Import Status & Errors
**GET** `/api/donations/import/[id]`

Returns detailed status and error information for a specific import.

**Response:**
```json
{
  "id": "cuid",
  "filename": "donations.csv",
  "status": "COMPLETED",
  "totalRows": 50,
  "processedRows": 50,
  "successRows": 45,
  "errorRows": 5,
  "errors": [
    {
      "row": 5,
      "field": "amount",
      "message": "Amount must be a positive number"
    },
    {
      "row": 12,
      "field": "campaignName",
      "message": "Campaign 'Unknown Campaign' not found"
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "completedAt": "2024-01-15T10:05:00Z"
}
```

### 4. Download CSV Template
**GET** `/api/donations/import/template`

Returns a CSV file with headers and an example row.

**Headers:**
- `contactEmail` (required)
- `contactFirstName` (required)
- `contactLastName` (required)
- `amount` (required, positive decimal)
- `date` (required, YYYY-MM-DD format)
- `method` (required, one of: CASH, CARD, BANK_TRANSFER, CHEQUE, ONLINE, STANDING_ORDER, DIRECT_DEBIT)
- `source` (optional)
- `campaignName` (optional, must exist in database)
- `reference` (optional)
- `notes` (optional)
- `giftAid` (optional, true/false)

## CSV Format

**Example CSV:**
```csv
contactEmail,contactFirstName,contactLastName,amount,date,method,source,campaignName,reference,notes,giftAid
john.doe@example.com,John,Doe,100.00,2024-01-15,CARD,Online,Annual Campaign 2024,REF001,Thank you letter sent,true
jane.smith@example.com,Jane,Smith,250.50,2024-01-16,BANK_TRANSFER,Mail,Annual Campaign 2024,REF002,,false
```

## Validation Rules

### Required Fields
- **contactEmail**: Valid email format
- **contactFirstName**: Non-empty string
- **contactLastName**: Non-empty string
- **amount**: Positive number (decimal allowed)
- **date**: Valid date in YYYY-MM-DD format
- **method**: One of the valid payment methods

### Optional Fields
- **campaignName**: If provided, must match an existing campaign (case-insensitive)
- **giftAid**: Boolean value (true/false) - defaults to false
- All other fields are free-form text

## Processing Logic

1. **CSV Parsing**
   - Handles quoted fields and escaped quotes
   - Validates column count
   - Skips empty rows

2. **Row Validation**
   - Validates each row against required fields and formats
   - Collects all validation errors

3. **Contact Matching**
   - Searches for existing contact by email (case-insensitive)
   - Creates new contact if not found
   - Marks contact as DONOR type

4. **Campaign Matching**
   - Searches for campaign by name (case-insensitive)
   - If campaign provided but not found, logs error and skips campaign assignment
   - Donation can still be created without campaign

5. **Donation Creation**
   - Creates donation record with:
     - Contact ID (matched or new)
     - Amount, date, method, reference, notes
     - Campaign ID (if matched)
     - Gift aid status
     - Status: "RECEIVED" (default)
     - Type: "DONATION" (default)
     - Created by current user

6. **Error Handling**
   - Rows with validation errors are skipped
   - Rows with database errors are logged
   - Summary of errors returned to user

## UI Components

### Import Page
**Location:** `/finance/donations/import`

**Features:**
- Drag-and-drop file upload
- CSV template download
- File selection via dialog
- Real-time progress tracking
- Error report with row-by-row details
- Result summary with success/failure counts
- Navigation back to donations list

**States:**
1. **Upload State**: Prompts user to select/drop CSV file
2. **Processing State**: Shows progress and processing status
3. **Complete State**: Shows results and error details

## Integration with Existing Code

### Donations Page
The main donations page at `/finance/donations` has been updated to include:
- **Import Button**: Link to `/finance/donations/import`
- **Add Button**: Existing link to `/finance/donations/new`
- Both buttons in the header next to the title

### Type Safety
All code follows TypeScript strict mode:
- No implicit `any` types
- Proper error handling
- Type-safe Prisma queries

## Files Created

### API Routes
- `/src/app/api/donations/import/route.ts` - Main upload and list endpoint
- `/src/app/api/donations/import/[id]/route.ts` - Get import status endpoint
- `/src/app/api/donations/import/template/route.ts` - CSV template download

### Utilities
- `/src/lib/donation-csv-parser.ts` - CSV parsing and validation logic

### UI Pages
- `/src/app/(dashboard)/finance/donations/import/page.tsx` - Import UI component

### Updated Files
- `/prisma/schema.prisma` - Added DonationImport model and relationships
- `/src/app/(dashboard)/finance/donations/page.tsx` - Added import button

## Database Migration

The schema has been synced to the database using Prisma:

```bash
npx prisma db push
```

This creates:
- `DonationImport` table with indexes
- `User.donationImports` relationship

## Error Handling

The system provides detailed error reporting with:
- **Parse Errors**: CSV structure issues
- **Validation Errors**: Field-level validation failures
- **Database Errors**: Contact/campaign lookup failures

Errors are grouped by field and returned to the user with:
- Row number (1-based, accounting for header)
- Field name
- Error message

## Performance Considerations

- CSV parsing uses streaming approach (no file size limits in initial release)
- Processing is async but appears synchronous to user via polling
- Poll interval: 1 second, max 60 seconds
- Batch processing handled sequentially per row
- Indexes on DonationImport for fast lookups

## Security

- Authentication required for all endpoints
- File type validation (CSV only)
- SQL injection prevention via Prisma ORM
- No sensitive data in URLs or responses
- File size validated by Next.js multipart parser

## Future Enhancements

- Background job queue (BullMQ, etc.)
- Configurable column mapping
- Batch size optimization
- Import history retention policies
- Email notifications on completion
- Webhook support for integrations
- Duplicate detection
- Custom validation rules per organization
