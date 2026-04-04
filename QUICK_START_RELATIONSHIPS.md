# Quick Start: Relationship Mapping Feature

## What Was Built
A complete relationship management system for the DeepCharity CRM allowing you to:
- Create relationships between contacts with typed relationships (spouse, parent, child, etc.)
- Visualize relationships with an interactive SVG network diagram
- View detailed relationship information
- Manage relationships via REST API

## Files Overview

### API Routes (All require authentication)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/crm/relationships` | GET | List all relationships (with optional filters) |
| `/api/crm/relationships` | POST | Create a new relationship |
| `/api/crm/relationships/[id]` | GET | Get a specific relationship |
| `/api/crm/relationships/[id]` | PUT | Update relationship type/description |
| `/api/crm/relationships/[id]` | DELETE | Delete a relationship |
| `/api/crm/contacts/[id]/relationships` | GET | Get all relationships for a contact |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| RelationshipTree | `src/components/crm/relationship-tree.tsx` | Displays relationships in network diagram + list view |
| RelationshipForm | `src/components/crm/relationship-form.tsx` | Dialog form to create new relationships |

### Modified Pages

| Page | Location | What Changed |
|------|----------|-------------|
| Contact Detail | `src/app/(dashboard)/crm/contacts/[id]/page.tsx` | Added RelationshipTree section at bottom |

### Utilities

| Script | Location | Purpose |
|--------|----------|---------|
| Migration | `scripts/migrate_contact_relationships.py` | Verifies database table structure |

## Using the Feature in the UI

1. **View Relationships**
   - Go to any contact's detail page
   - Scroll to bottom to see "Relationships" section
   - Visual network diagram shows this contact in center, related contacts around it
   - Below is a list view with all relationship details

2. **Add a Relationship** (via API)
   - POST to `/api/crm/relationships` with contact IDs and type
   - Relationship appears immediately in contact detail page

3. **Search/Filter Relationships**
   - GET `/api/crm/relationships?fromContactId=xxx`
   - GET `/api/crm/relationships?toContactId=xxx`

## Relationship Types

- **SPOUSE** - Spouse/partner
- **PARENT** - Parent
- **CHILD** - Child
- **SIBLING** - Brother/sister
- **EMPLOYER** - Employer
- **EMPLOYEE** - Employee
- **FRIEND** - Friend
- **GUARDIAN** - Guardian
- **OTHER** - Other relationship

## API Examples

### Create a Relationship
```bash
curl -X POST http://localhost:3000/api/crm/relationships \
  -H "Content-Type: application/json" \
  -d '{
    "fromContactId": "clxyz...",
    "toContactId": "clxyz...",
    "type": "SPOUSE",
    "description": "Married 2015"
  }'
```

### Get All Relationships for a Contact
```bash
curl http://localhost:3000/api/crm/contacts/clxyz.../relationships
```

### Update a Relationship
```bash
curl -X PUT http://localhost:3000/api/crm/relationships/clxyz... \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FRIEND",
    "description": "College roommate"
  }'
```

### Delete a Relationship
```bash
curl -X DELETE http://localhost:3000/api/crm/relationships/clxyz...
```

## Key Features

✓ **Bidirectional display** - Shows both incoming and outgoing relationships
✓ **Type-safe** - Full TypeScript strict mode compliance
✓ **Authenticated** - All endpoints require user session
✓ **Validated** - Prevents invalid relationships (e.g., self-relationships)
✓ **Scalable** - Works with database cascade deletes
✓ **Responsive** - Works on mobile and desktop

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Auth**: Cookie-based session (no Authorization headers)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Visualization**: Native SVG (no external graph libraries)

## Troubleshooting

**Relationships not appearing?**
- Check contact IDs are correct
- Verify you're logged in (session cookie set)
- Check browser console for API errors

**Network diagram looks empty?**
- Make sure relationships exist (use GET endpoint to verify)
- Refresh page

**TypeScript errors on build?**
- Run `npm install` to update dependencies
- Check Node version (should be v18+)

## Next Steps

1. **Add UI Dialog** - Create a dialog form in the contact detail page to add relationships without API calls
2. **Bulk Import** - Add CSV import for relationships
3. **Advanced Search** - Filter/search relationships by type and person
4. **Analytics** - Show relationship statistics and patterns
5. **Relationship Rules** - Define auto-relationships (e.g., if A is parent of B, B is child of A)

## Database

**Table**: `ContactRelationship`

```sql
CREATE TABLE "ContactRelationship" (
  id VARCHAR(191) PRIMARY KEY,
  "fromContactId" VARCHAR(191) NOT NULL,
  "toContactId" VARCHAR(191) NOT NULL,
  type VARCHAR(191) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactRelationship_fromContactId_fkey"
    FOREIGN KEY ("fromContactId") REFERENCES "Contact"(id) ON DELETE CASCADE,
  CONSTRAINT "ContactRelationship_toContactId_fkey"
    FOREIGN KEY ("toContactId") REFERENCES "Contact"(id) ON DELETE CASCADE,
  CONSTRAINT "ContactRelationship_fromContactId_toContactId_type_key"
    UNIQUE ("fromContactId", "toContactId", type)
)
```

## Support

For questions about the implementation:
1. Check `RELATIONSHIP_FEATURE_SUMMARY.md` for detailed documentation
2. Review API route code for implementation details
3. Check Prisma schema for database structure
