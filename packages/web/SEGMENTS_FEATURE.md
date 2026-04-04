# Dynamic Segmentation / List Builder Feature

## Overview

The Dynamic Segmentation feature enables staff to create powerful, reusable contact segments based on multiple criteria. Staff can filter contacts by:

- **Donation History** - Filter by donation amount ranges and date ranges
- **Tags** - Select one or more tags to match
- **Location** - Filter by city or postcode
- **Event Attendance** - Filter contacts that attended specific events
- **Membership Status** - Filter by membership type and active status
- **Communication Preferences** - Filter by consent preferences (email, phone, SMS, post)

Each segment can match ALL conditions or ANY condition (configurable), and results are previewed before saving.

## Database Schema

### SavedSegment Table

```sql
CREATE TABLE "SavedSegment" (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT,
  filters TEXT NOT NULL,           -- JSON object with filter criteria
  "createdById" VARCHAR(191) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("createdById") REFERENCES "User"(id)
);

CREATE INDEX "SavedSegment_createdById_idx" ON "SavedSegment"("createdById");
```

### Filters JSON Structure

Filters are stored as JSON with the following structure:

```json
{
  "filters": [
    {
      "type": "tag",
      "tagIds": ["tag-id-1", "tag-id-2"]
    },
    {
      "type": "donation",
      "minAmount": 100,
      "maxAmount": 5000,
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  ],
  "matchType": "all"
}
```

## API Endpoints

### 1. List All Segments
**GET** `/api/crm/segments`

Returns all saved segments for the current user.

**Response:**
```json
[
  {
    "id": "segment-1",
    "name": "Major Donors 2024",
    "description": "Donors who gave over £1000",
    "filters": { ... },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### 2. Create a New Segment
**POST** `/api/crm/segments`

Create a new saved segment.

**Request Body:**
```json
{
  "name": "Major Donors 2024",
  "description": "Donors who gave over £1000",
  "filters": {
    "filters": [
      {
        "type": "donation",
        "minAmount": 1000
      }
    ],
    "matchType": "all"
  }
}
```

**Response:** 201 Created
```json
{
  "id": "segment-1",
  "name": "Major Donors 2024",
  "description": "Donors who gave over £1000",
  "filters": { ... },
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 3. Get Segment Details
**GET** `/api/crm/segments/{id}`

Get a specific segment with all matching contacts.

**Response:**
```json
{
  "id": "segment-1",
  "name": "Major Donors 2024",
  "description": "Donors who gave over £1000",
  "filters": { ... },
  "contactCount": 42,
  "contacts": [
    {
      "id": "contact-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "city": "London",
      "postcode": "SW1A"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 4. Preview Segment Matches
**POST** `/api/crm/segments/preview`

Preview matching contacts without saving the segment.

**Request Body:**
```json
{
  "filters": {
    "filters": [
      {
        "type": "donation",
        "minAmount": 1000
      }
    ],
    "matchType": "all"
  }
}
```

**Response:**
```json
{
  "count": 42,
  "contacts": [
    {
      "id": "contact-1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "city": "London",
      "postcode": "SW1A"
    }
  ]
}
```

### 5. Update a Segment
**PUT** `/api/crm/segments/{id}`

Update an existing segment.

**Request Body:**
```json
{
  "name": "Major Donors 2024",
  "description": "Updated description",
  "filters": { ... }
}
```

### 6. Delete a Segment
**DELETE** `/api/crm/segments/{id}`

Delete a saved segment.

## UI Pages

### 1. Segments List Page
**Route:** `/crm/segments`

Shows all saved segments for the current user with:
- Segment name, description
- Creation/update timestamps
- Link to view segment details
- Link to create new segment

### 2. Create New Segment Page
**Route:** `/crm/segments/new`

Allows creating a new segment with:
- Segment name and description input
- Dynamic filter builder with add/remove conditions
- Live preview showing matching contact count
- Save button to create segment

**Filter Types:**
- Tags - Select one or more tags
- Donation - Min/max amount, date range
- Location - Cities and/or postcodes
- Event Attendance - Select events attended
- Membership - Membership types and status
- Communication - Consent preferences

### 3. Segment Detail Page
**Route:** `/crm/segments/{id}`

Shows segment details with:
- Segment name and description
- Contact count and active filters
- Full list of matching contacts with details
- Export to CSV functionality
- Edit and Delete buttons

### 4. Edit Segment Page
**Route:** `/crm/segments/{id}/edit`

Allows editing an existing segment with same interface as create page.

## Filter Types

### Tag Filter
Filter contacts by tags assigned to them.

```json
{
  "type": "tag",
  "tagIds": ["tag-1", "tag-2"]
}
```

### Donation Filter
Filter by donation amount and/or date range.

```json
{
  "type": "donation",
  "minAmount": 100,
  "maxAmount": 5000,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

### Location Filter
Filter by cities and/or postcodes.

```json
{
  "type": "location",
  "cities": ["London", "Manchester"],
  "postcodes": ["SW1A", "M1"]
}
```

### Event Filter
Filter contacts that attended specific events.

```json
{
  "type": "event",
  "eventIds": ["event-1", "event-2"],
  "attended": true
}
```

### Membership Filter
Filter by membership type and status.

```json
{
  "type": "membership",
  "membershipTypeIds": ["type-1"],
  "isActive": true
}
```

### Communication Filter
Filter by consent preferences.

```json
{
  "type": "communication",
  "consentEmail": true,
  "consentPhone": true,
  "consentSms": false,
  "consentPost": true
}
```

## Segment Matching Logic

- **Match All (AND):** A contact must match ALL conditions to be included
- **Match Any (OR):** A contact must match AT LEAST ONE condition to be included

### Example: Match All
```json
{
  "filters": [
    { "type": "tag", "tagIds": ["major-donor"] },
    { "type": "donation", "minAmount": 1000 }
  ],
  "matchType": "all"
}
```

This would return contacts that:
1. Have the "major-donor" tag AND
2. Have donated £1000 or more

### Example: Match Any
```json
{
  "filters": [
    { "type": "tag", "tagIds": ["volunteer"] },
    { "type": "tag", "tagIds": ["donor"] }
  ],
  "matchType": "any"
}
```

This would return contacts that:
1. Have the "volunteer" tag OR
2. Have the "donor" tag

## File Structure

```
src/
  types/
    segment.ts                          -- Type definitions
  lib/
    segment-builder.ts                  -- Filter logic utilities
  app/
    api/
      crm/
        segments/
          route.ts                      -- POST/GET endpoints
          preview/
            route.ts                    -- Preview endpoint
          [id]/
            route.ts                    -- GET/PUT/DELETE endpoints
      tags/
        route.ts                        -- GET tags for filtering
      events/
        list/
          route.ts                      -- GET events for filtering
    (dashboard)/
      crm/
        segments/
          page.tsx                      -- List segments
          new/
            page.tsx                    -- Create new segment
          [id]/
            page.tsx                    -- View segment details
            edit/
              page.tsx                  -- Edit segment
  components/
    crm/
      segment-filter-builder.tsx        -- Filter builder component
scripts/
  add-saved-segment.py                  -- Migration script
  test-segments.py                      -- Test script
```

## Installation & Setup

### 1. Run Migration Script
```bash
cd packages/web
python3 scripts/add-saved-segment.py
```

### 2. Verify Installation
```bash
python3 scripts/test-segments.py
```

### 3. Add to Sidebar
The "Segments" link is already added to the sidebar under "People" section with a Zap icon.

## Usage Examples

### Create a Major Donors Segment

1. Navigate to `/crm/segments`
2. Click "New Segment"
3. Enter name: "Major Donors 2024"
4. Add filter: "Donation" with minAmount 1000
5. Click "Preview Results" to see matches
6. Click "Save Segment"

### Create a Segment of Recent Volunteers

1. Navigate to `/crm/segments`
2. Click "New Segment"
3. Enter name: "Recent Volunteers"
4. Add filter: "Tags" and select "Volunteer" tag
5. Add filter: "Donation" with startDate of current year
6. Set "Match All"
7. Click "Preview Results"
8. Click "Save Segment"

### Export Segment to CSV

1. Open a saved segment from `/crm/segments/{id}`
2. Click "Export CSV" button
3. CSV file downloads with matching contacts

## Technical Details

### Segment Validation

The `validateSegmentFilters()` function ensures:
- At least one filter is provided
- Match type is 'all' or 'any'
- Each filter has required fields
- Tag, location, event filters have selections
- Donation filters have at least one criterion

### Contact Status

By default, only contacts with `status: "ACTIVE"` are included in segments. Archived, deceased, or anonymised contacts are excluded.

### Performance Considerations

- Contact preview is limited to 100 results
- Full segment retrieval is limited to 1000 contacts
- Pagination can be added for large segments
- Indexes on `createdById` optimise user segment queries

## Error Handling

All API endpoints return appropriate HTTP status codes:
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access segment
- `404 Not Found` - Segment not found
- `500 Internal Server Error` - Server error

## Future Enhancements

1. **Segment Composition** - Combine multiple saved segments with AND/OR logic
2. **Advanced Rules** - Add more filter types (e.g., volunteer hours, case status)
3. **Scheduled Segments** - Auto-generate segments on a schedule
4. **Segment Actions** - Bulk email, SMS, or mail merge from segments
5. **Segment Analytics** - Track segment changes over time
6. **Conditional Logic** - More complex nesting of AND/OR conditions
7. **Pagination** - Add pagination for large segments
8. **Sorting** - Add sort options to segment contact lists
9. **Bulk Operations** - Select contacts and perform bulk actions
10. **Segment Sharing** - Allow sharing segments between staff members
