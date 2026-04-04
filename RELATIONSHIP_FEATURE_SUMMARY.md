# Enhanced Relationship Mapping / Visual Tree View - Implementation Summary

## Feature Overview
This feature adds comprehensive relationship management and visualization to the DeepCharity CRM system. It allows users to map relationships between contacts with typed relationships (spouse, parent, child, sibling, employer, employee, friend, guardian, other).

## Database
- **Model**: `ContactRelationship` (already exists in Prisma schema)
- **Fields**:
  - `id`: Unique identifier (CUID)
  - `fromContactId`: Reference to source contact
  - `toContactId`: Reference to target contact
  - `type`: Relationship type (SPOUSE, PARENT, CHILD, SIBLING, EMPLOYER, EMPLOYEE, FRIEND, GUARDIAN, OTHER)
  - `description`: Optional relationship description
  - `createdAt`: Timestamp
- **Constraints**:
  - Unique constraint on (fromContactId, toContactId, type)
  - Foreign key cascades on delete

## Migration
- **Script**: `/packages/web/scripts/migrate_contact_relationships.py`
- **Purpose**: Verifies ContactRelationship table exists with proper schema
- **Status**: Table already exists in production database
- **Run**: `python3 scripts/migrate_contact_relationships.py`

## API Routes

### 1. Create/List Relationships
**Route**: `/api/crm/relationships`

**GET Parameters**:
- `fromContactId` (optional): Filter relationships from a specific contact
- `toContactId` (optional): Filter relationships to a specific contact

**GET Response**:
```json
[
  {
    "id": "string",
    "fromContactId": "string",
    "toContactId": "string",
    "type": "SPOUSE",
    "description": "string or null",
    "createdAt": "datetime",
    "fromContact": {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string or null",
      "phone": "string or null",
      "avatar": "string or null"
    },
    "toContact": { ... }
  }
]
```

**POST**: Create a new relationship
**Request Body**:
```json
{
  "fromContactId": "string (required)",
  "toContactId": "string (required)",
  "type": "SPOUSE (required)",
  "description": "string (optional)"
}
```

**Response**: (201 Created) Same structure as GET

**Error Responses**:
- 400: Missing required fields or self-relationship
- 401: Unauthorized
- 404: Contact not found
- 409: Relationship of this type already exists
- 500: Server error

### 2. Get/Update/Delete Individual Relationship
**Route**: `/api/crm/relationships/[id]`

**GET**: Fetch a specific relationship by ID
- Response: Single relationship object
- 401: Unauthorized
- 404: Not found
- 500: Server error

**PUT**: Update relationship type or description
**Request Body**:
```json
{
  "type": "FRIEND (optional)",
  "description": "string (optional)"
}
```

**DELETE**: Remove a relationship
- Response: `{ "success": true }`

### 3. Get All Relationships for a Contact
**Route**: `/api/crm/contacts/[id]/relationships`

**GET**: Retrieve all relationships (both incoming and outgoing)
**Response**:
```json
{
  "contactId": "string",
  "relationships": [
    {
      "id": "string",
      "fromContactId": "string",
      "toContactId": "string",
      "type": "string",
      "description": "string or null",
      "createdAt": "datetime",
      "relatedContact": { ... },
      "direction": "outgoing" | "incoming"
    }
  ],
  "relationshipsFrom": [ ... ],
  "relationshipsTo": [ ... ]
}
```

## Components

### RelationshipTree (`/src/components/crm/relationship-tree.tsx`)
**Purpose**: Displays relationships in both SVG network diagram and list view

**Props**:
```typescript
interface RelationshipTreeProps {
  contactId: string;
  relationships: Relationship[];
  onAddRelationship?: () => void;
}
```

**Features**:
- SVG-based network diagram showing central contact with related contacts arranged in a circle
- Color-coded by relationship type
- Fallback list view with contact avatars and badges
- Responsive layout
- Empty state with action to add relationships

**Relationship Colors**:
- SPOUSE: Red (#dc2626)
- PARENT: Cyan (#0891b2)
- CHILD: Blue (#2563eb)
- SIBLING: Purple (#7c3aed)
- EMPLOYER: Orange (#ea580c)
- EMPLOYEE: Green (#16a34a)
- FRIEND: Amber (#d97706)
- GUARDIAN: Indigo (#6366f1)
- OTHER: Gray (#6b7280)

### RelationshipForm (`/src/components/crm/relationship-form.tsx`)
**Purpose**: Dialog form to create new relationships

**Props**:
```typescript
interface RelationshipFormProps {
  contactId: string;
  allContacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features**:
- Searchable contact selector
- Relationship type dropdown
- Optional description field
- Error handling and validation
- Loading state during submission

## Integration with Contact Detail Page
**File**: `/src/app/(dashboard)/crm/contacts/[id]/page.tsx`

**Changes**:
1. Added import for `RelationshipTree` component
2. Updated contact query to include `relationshipsFrom` and `relationshipsTo`
3. Added RelationshipTree section at the bottom of the contact detail page

**Display**:
- Shows all relationships (both incoming and outgoing)
- Network diagram visualization
- List view with contact links
- Option to add new relationships

## TypeScript Compliance
- Strict mode: All files are strict-mode compliant
- No implicit `any` types
- Proper null vs undefined handling
- Full type definitions for all components and API routes

## Authentication
- All API routes require session authentication via `getSession()`
- Returns 401 Unauthorized if session is missing
- Uses cookie-based auth (no Authorization headers)

## Testing the Feature

### 1. Create a Relationship via API
```bash
curl -X POST http://localhost:3000/api/crm/relationships \
  -H "Content-Type: application/json" \
  -d '{
    "fromContactId": "contact-id-1",
    "toContactId": "contact-id-2",
    "type": "SPOUSE",
    "description": "Married since 2015"
  }'
```

### 2. View Relationships for a Contact
```bash
curl http://localhost:3000/api/crm/contacts/contact-id-1/relationships
```

### 3. Browse in UI
- Navigate to any contact's detail page
- Scroll to the bottom to see the Relationships section
- Relationships displayed in network diagram format
- Click on related contacts to navigate to their profiles

## Files Created/Modified

### Created
1. `/packages/web/scripts/migrate_contact_relationships.py` - Database migration script
2. `/packages/web/src/app/api/crm/relationships/route.ts` - Main relationships API
3. `/packages/web/src/app/api/crm/relationships/[id]/route.ts` - Individual relationship CRUD
4. `/packages/web/src/app/api/crm/contacts/[id]/relationships/route.ts` - Contact relationships endpoint
5. `/packages/web/src/components/crm/relationship-tree.tsx` - Visualization component
6. `/packages/web/src/components/crm/relationship-form.tsx` - Form component

### Modified
1. `/packages/web/src/app/(dashboard)/crm/contacts/[id]/page.tsx` - Added relationships section

## Key Design Decisions

1. **Directional Relationships**: Relationships are directional (from -> to) allowing modeling of hierarchical relationships like parent-child.

2. **SVG Visualization**: Used native SVG instead of external graph libraries (D3, Vis.js, etc.) to minimize dependencies and bundle size.

3. **Dual View**: Both network diagram and list view to support different use cases - visual understanding and detailed information.

4. **Scalability**: Network diagram repositions nodes in a circle around central contact; works well for up to ~20 relationships.

5. **Type Safety**: All TypeScript code uses strict mode with no implicit any types.

6. **Error Handling**: Comprehensive validation including self-relationship prevention and unique constraint handling.

## Future Enhancements

1. **Bidirectional Relationships**: Add automatic reverse relationship creation (e.g., parent-child automatically creates child-parent)

2. **Advanced Visualization**: Replace SVG with interactive D3/Force-Graph for large networks

3. **Relationship Statistics**: Dashboard showing relationship distribution, most connected contacts, etc.

4. **Bulk Relationships**: Import relationships from CSV or other sources

5. **Relationship Timeline**: Show relationship changes over time

6. **Search/Filter**: Find relationships by type or related contact name

7. **Relationship Templates**: Pre-configured relationship patterns for organizations

8. **Analytics**: Track how relationships correlate with donations, engagement, etc.

## Troubleshooting

**Issue**: Relationships not showing in API response
- **Check**: Contact IDs are valid and exist
- **Check**: User is authenticated (has valid session cookie)

**Issue**: Circular/cluttered network diagram
- **Solution**: Currently displays up to ~20 relationships in circle; consider pagination or hierarchy in future

**Issue**: TypeScript errors on build
- **Fix**: Run `npm install` to update dependencies
- **Fix**: Ensure strict mode is enabled in tsconfig.json

## Performance Considerations

- API queries include necessary relations to avoid N+1 queries
- Relationships are paginated (take: 5) on contact detail page for performance
- SVG rendering is performant for up to ~20 nodes
- Consider database indexes on fromContactId and toContactId columns
