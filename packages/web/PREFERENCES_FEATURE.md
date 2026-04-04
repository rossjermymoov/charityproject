# Donor Self-Service Preference Centre

## Feature Overview

The Donor Self-Service Preference Centre is a public-facing feature that allows donors to manage their communication preferences via a unique, secure link. No login is required, making it simple and accessible for all donors.

## What Was Built

### 1. Database Changes

#### New Table: `PreferenceToken`
- **id**: Primary key (cuid)
- **contactId**: Foreign key to Contact table (Cascade delete)
- **token**: Unique, randomly generated 64-character hex string
- **expiresAt**: Optional expiration timestamp
- **createdAt**: Timestamp of creation

#### New Contact Fields
- `emailOptIn` (boolean, default: true)
- `smsOptIn` (boolean, default: false)
- `postOptIn` (boolean, default: true)
- `phoneOptIn` (boolean, default: false)
- `communicationFrequency` (string: DAILY | WEEKLY | MONTHLY, default: WEEKLY)
- `interestCategories` (string array, default: empty)

### 2. API Routes

#### `POST /api/preferences/generate-link`
**Staff only (requires ADMIN or STAFF role)**

Generates a preference link for a single contact.

Request:
```json
{
  "contactId": "clh...",
  "expiresInDays": 30  // optional, null for no expiration
}
```

Response:
```json
{
  "token": "a1b2c3...",
  "contactId": "clh...",
  "preferenceUrl": "https://example.com/preferences/a1b2c3...",
  "expiresAt": "2024-05-03T12:00:00Z",
  "createdAt": "2024-04-03T12:00:00Z"
}
```

#### `POST /api/preferences/bulk-generate`
**Staff only (requires ADMIN or STAFF role)**

Generates preference links for multiple contacts at once.

Request:
```json
{
  "contactIds": ["clh1...", "clh2...", "clh3..."],
  "expiresInDays": 30  // optional
}
```

Response:
```json
{
  "success": true,
  "count": 3,
  "tokens": [
    {
      "token": "...",
      "contactId": "...",
      "preferenceUrl": "...",
      "expiresAt": null,
      "createdAt": "..."
    }
    // ... more tokens
  ]
}
```

#### `GET /api/preferences/[token]`
**Public (no authentication required)**

Retrieves the current preferences for a token. Returns 404 if invalid/expired.

Response:
```json
{
  "contactId": "clh...",
  "firstName": "John",
  "email": "john@example.com",
  "phone": "+44...",
  "preferences": {
    "emailOptIn": true,
    "smsOptIn": false,
    "postOptIn": true,
    "phoneOptIn": false,
    "communicationFrequency": "WEEKLY",
    "interestCategories": ["events", "fundraising"]
  }
}
```

#### `PUT /api/preferences/[token]`
**Public (no authentication required)**

Updates preferences for a token.

Request:
```json
{
  "emailOptIn": true,
  "smsOptIn": true,
  "postOptIn": false,
  "phoneOptIn": false,
  "communicationFrequency": "DAILY",
  "interestCategories": ["events", "impact"],
  "unsubscribeAll": false  // optional: if true, unsubscribes from all channels
}
```

Response:
```json
{
  "success": true,
  "contactId": "clh...",
  "preferences": {
    "emailOptIn": true,
    "smsOptIn": true,
    "postOptIn": false,
    "phoneOptIn": false,
    "communicationFrequency": "DAILY",
    "interestCategories": ["events", "impact"]
  }
}
```

### 3. UI Pages

#### Public Preference Centre: `/preferences/[token]`
**Route**: `/src/app/preferences/[token]/page.tsx`

A clean, accessible public page where donors can manage their preferences without logging in.

Features:
- **Contact greeting**: Displays donor's first name
- **Communication channels**: Toggles for email, SMS, post, and phone
- **Communication frequency**: Radio buttons for Daily, Weekly, or Monthly digest
- **Interest categories**: Checkboxes for:
  - Fundraising campaigns
  - Events and activities
  - Impact stories
  - Volunteer opportunities
  - Newsletter and updates
- **Unsubscribe from all**: One-click option to opt out of all communications
- **Save preferences**: Confirmation messages on successful save
- **Responsive design**: Works well on mobile and desktop

Design highlights:
- No dashboard sidebar or authentication UI
- Branded header with clear privacy messaging
- Gradient background with card-based layout
- Toggle switches for boolean preferences
- Radio buttons for frequency selection
- Checkboxes for interests

#### Staff Preference Management: `/settings/preferences`
**Route**: `/src/app/(dashboard)/settings/preferences/page.tsx`

Staff interface for generating and managing preference links.

Features:
- **Single link generation**: Enter a contact ID to generate one link
- **Bulk generation**: Paste multiple contact IDs to generate links in batch
- **Expiration options**: Optional expiration dates in days
- **URL display**: Shows the full preference URL with copy button
- **Token display**: Shows the raw token for manual use
- **Bulk results table**: Display all generated links with URLs
- **CSV export**: Download all bulk-generated links as CSV
- **Clipboard management**: Quick-copy buttons for each link

### 4. Files Created

```
/src/app/
├── api/
│   └── preferences/
│       ├── generate-link/
│       │   └── route.ts
│       ├── bulk-generate/
│       │   └── route.ts
│       └── [token]/
│           └── route.ts
└── preferences/
    └── [token]/
        └── page.tsx

/(dashboard)/settings/
└── preferences/
    └── page.tsx

prisma/
└── schema.prisma (updated)

migrate.py (database migration script)
```

## Database Migration

The migration was applied via Python script (`migrate.py`) which:
1. Added all preference columns to the Contact table
2. Created the PreferenceToken table with proper indexes
3. Set up foreign key constraints with cascade delete

All changes are backwards compatible.

## Security Considerations

1. **Token-based access**: No authentication needed, but tokens are long random strings (64 chars)
2. **Expiration support**: Links can be set to expire after N days
3. **Token uniqueness**: Each token is verified to exist and not be expired
4. **Contact isolation**: Tokens are tied to specific contacts
5. **Rate limiting**: Consider adding rate limiting to the public endpoints in production
6. **HTTPS only**: Tokens should only be transmitted over HTTPS in production

## Usage Examples

### For Staff: Generate a preference link

```bash
curl -X POST http://localhost:3000/api/preferences/generate-link \
  -H "Content-Type: application/json" \
  -H "Cookie: deep-charity-session=<user_id>" \
  -d '{
    "contactId": "clh123abc...",
    "expiresInDays": 30
  }'
```

### For Staff: Bulk generate links

```bash
curl -X POST http://localhost:3000/api/preferences/bulk-generate \
  -H "Content-Type: application/json" \
  -H "Cookie: deep-charity-session=<user_id>" \
  -d '{
    "contactIds": ["clh1...", "clh2...", "clh3..."],
    "expiresInDays": 90
  }'
```

### For Donors: Access preference centre

Visit: `https://charity.com/preferences/a1b2c3def456...`

### For Donors: Update preferences via API

```bash
curl -X PUT http://localhost:3000/api/preferences/a1b2c3def456 \
  -H "Content-Type: application/json" \
  -d '{
    "emailOptIn": true,
    "smsOptIn": false,
    "postOptIn": true,
    "phoneOptIn": false,
    "communicationFrequency": "WEEKLY",
    "interestCategories": ["events", "fundraising"]
  }'
```

## Future Enhancements

1. **Rate limiting**: Add rate limiting to public endpoints
2. **Audit logging**: Log preference changes for compliance
3. **Email integration**: Send preference links via email automation
4. **Analytics**: Track how many donors access and update preferences
5. **A/B testing**: Test different preference centre designs
6. **Preference history**: Track changes to preferences over time
7. **Custom categories**: Allow charities to define their own interest categories
8. **Preference templates**: Create default preference sets for different donor types

## Testing

To test the feature:

1. **Generate a link**:
   - Go to Settings > Donor Preference Centre
   - Enter a contact ID
   - Click "Generate Link"

2. **Access the preference centre**:
   - Copy the generated URL
   - Open in a new incognito window
   - Verify you can see the contact's name and preferences

3. **Update preferences**:
   - Toggle channels on/off
   - Change frequency
   - Check/uncheck interests
   - Click "Save Preferences"
   - Verify success message appears

4. **Verify database changes**:
   - Query the Contact table to see updated preferences
   - Verify PreferenceToken records are created
   - Test link expiration if set

## Support

For issues or questions about this feature:
1. Check the API response codes and error messages
2. Verify tokens exist and haven't expired
3. Check that contacts exist before generating links
4. Ensure staff user has ADMIN or STAFF role to generate links
