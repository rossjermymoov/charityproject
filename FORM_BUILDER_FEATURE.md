# Drag-and-Drop Form Builder - Feature Implementation

## Overview
Feature #7: Enhanced form builder with drag-and-drop field reordering, advanced field types, and improved UX for the DeepCharity CRM system.

## Completed Implementation

### 1. Core Components

#### `src/components/forms/types.ts`
TypeScript type definitions for the form system:
- `FieldType`: Supports TEXT, EMAIL, PHONE, NUMBER, DATE, TEXTAREA, SELECT, CHECKBOX, RADIO, FILE, HIDDEN
- `FormField`: Individual field configuration
- `FormDefinition`: Complete form structure with fields and settings
- `FieldOption`: Options for select/radio/checkbox fields
- `ValidationRule`: Field validation rules
- `ConditionalLogic`: Show/hide fields based on conditions

#### `src/components/forms/form-builder.tsx`
Main form builder component with:
- **Drag-and-drop reordering**: Native HTML5 drag/drop API (no external libraries)
- **Field management**: Add, delete, edit, reorder fields
- **Visual feedback**: Opacity on drag, hover effects, drag-over indication
- **Live preview**: Preview form as end-user would see it
- **Type-specific options**: Dynamically shows option editor for SELECT, CHECKBOX, RADIO

**Features:**
- Drag fields using grip icon to reorder
- Click settings icon to edit field properties
- Delete button to remove fields
- Grid of field type buttons to quickly add fields
- Preview button to see form as users will see it

#### `src/components/forms/field-editor.tsx`
Modal dialog for editing individual field properties:
- Label, type, placeholder, help text
- Required checkbox
- Options editor for select/checkbox/radio (add/edit/remove options)
- Full form validation

#### `src/components/forms/form-renderer.tsx`
Public-facing form renderer component:
- Renders form based on JSON definition
- Supports all field types with proper HTML elements
- Conditional logic evaluation (show field X if Y = value)
- Client-side validation for required fields
- Supports arrays for checkbox values
- Form submission handler

### 2. API Routes

#### `GET /api/forms` - List all forms
**Response:**
```json
{
  "forms": [...]
}
```

#### `POST /api/forms` - Create form
**Request body:**
```json
{
  "type": "DONATION|SIGNUP|CONTACT|EVENT|VOLUNTEER|CUSTOM",
  "name": "Form name",
  "title": "Display title",
  "description": "Form description",
  "primaryColor": "#4F46E5",
  "thankYouMessage": "Thank you!",
  "consentText": "I consent...",
  "notifyEmail": "admin@example.com"
}
```

#### `GET /api/forms/[id]` - Get form details
Includes all fields, ordered by sortOrder

#### `PUT /api/forms/[id]` - Update form
**Request body:**
```json
{
  "name": "Updated name",
  "title": "Updated title",
  "description": "...",
  "primaryColor": "#...",
  "thankYouMessage": "...",
  "consentText": "...",
  "notifyEmail": "...",
  "fields": [
    {
      "id": "field-id or null for new",
      "label": "Field label",
      "type": "TEXT|EMAIL|...",
      "placeholder": "...",
      "helpText": "...",
      "required": true,
      "options": [...],
      "order": 0
    }
  ]
}
```

#### `DELETE /api/forms/[id]` - Delete form
Requires authentication and ownership

#### `GET /api/forms/[id]/submissions` - List submissions
**Query params:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)

**Response:**
```json
{
  "submissions": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  }
}
```

#### `POST /api/forms/[id]/submissions` - Submit form (public)
No authentication required if form is ACTIVE
**Request body:**
```json
{
  "data": {
    "fieldId": "value",
    "email": "user@example.com"
  },
  "contactId": "optional",
  "referrer": "optional"
}
```

### 3. Pages

#### `/settings/forms` - Forms List Page
- Display all forms with stats
- Show status, submission count, last submission date
- Quick actions: edit, view submissions, pause/activate
- Create new form button

#### `/settings/forms/new` - Create Form
- Step 1: Choose form type (DONATION, SIGNUP, CONTACT, EVENT, VOLUNTEER, CUSTOM)
- Step 2: Basic form details (name, title, description, colors, settings)
- Auto-creates form with type-specific default fields

#### `/settings/forms/[id]` - Edit Form
- **Form Builder Section**: Drag-and-drop field editor with live preview
- **General Settings**: Name, title, description, colors, thank you message, consent text
- **Embed Code**: Direct link and iframe code
- **Status Controls**: Activate/pause/archive form
- **Submissions Link**: Quick access to view submissions
- **Delete**: Danger zone with form deletion

#### `/settings/forms/[id]/submissions` - View Submissions
- Table view of all form submissions
- Shows date, name, email, status
- Process button to mark submissions as processed
- Pagination support

#### `/forms/[slug]` - Public Form Page
- Renders form based on JSON definition
- No authentication required
- Supports all field types
- Form validation
- Thank you page on successful submission
- Integrates with existing donation form logic

### 4. Enhanced Features

#### Drag-and-Drop with Native HTML5 API
```typescript
// Uses standard HTML5 drag events:
- onDragStart: Capture dragged field ID
- onDragOver: Allow drop with visual feedback
- onDrop: Reorder fields by index
- onDragEnd: Cleanup
```

#### Field Types Supported
1. **TEXT** - Single line text input
2. **EMAIL** - Email validation
3. **PHONE** - Phone number input
4. **NUMBER** - Numeric input
5. **DATE** - Date picker
6. **TEXTAREA** - Multi-line text
7. **SELECT** - Dropdown with options
8. **CHECKBOX** - Multiple selection (array values)
9. **RADIO** - Single selection
10. **FILE** - File upload
11. **HIDDEN** - Hidden field (not rendered to user)

#### Field Properties
- Label (required)
- Type (required)
- Placeholder (optional)
- Help Text (optional)
- Required checkbox
- Options (for SELECT, CHECKBOX, RADIO)
- Validation rules (framework ready)
- Conditional logic (framework ready)

#### Live Preview
Click "Preview" button to see form as end-users see it without leaving the editor.

#### Conditional Logic
Form renderer supports conditional show/hide:
```typescript
conditionalLogic?: {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value: string | number | boolean;
}[]
```

### 5. Integration Points

#### Authentication
- All admin endpoints use `getSession()` from `@/lib/session`
- Public form submission requires form to be ACTIVE
- Ownership verified via `createdById` field

#### Database Models
- `Form`: Main form definition
- `FormField`: Individual field configurations
- `FormSubmission`: Submission data

#### Next.js Version
- Next.js 15 App Router
- Uses `params: Promise<{id: string}>` with `await params`
- Server components with server actions for form updates

#### TypeScript
- Strict mode enabled
- Full type safety throughout
- No `any` types

### 6. File Structure
```
packages/web/src/
├── components/forms/
│   ├── index.ts                 # Exports
│   ├── types.ts                 # TypeScript definitions
│   ├── form-builder.tsx         # Main builder component
│   ├── form-renderer.tsx        # Public form renderer
│   └── field-editor.tsx         # Field editor modal
│
└── app/
    ├── api/forms/
    │   ├── route.ts             # GET/POST /api/forms
    │   ├── [id]/route.ts        # GET/PUT/DELETE /api/forms/[id]
    │   ├── [id]/submissions/    # Submissions endpoints
    │   └── submit/route.ts      # Public submission (existing)
    │
    ├── (dashboard)/settings/forms/
    │   ├── page.tsx             # Forms list
    │   ├── new/page.tsx         # Create form (existing)
    │   └── [id]/
    │       ├── page.tsx         # Edit form with builder
    │       ├── builder-page.tsx # Form builder wrapper
    │       └── submissions/page.tsx (existing)
    │
    └── forms/
        └── [slug]/page.tsx      # Public form (existing)
```

## Technical Constraints Met

- **Next.js 15 App Router**: All pages use proper async components with `await params`
- **Auth**: Session-based via `getSession()` for API routes
- **UI Components**: Uses existing Button, Badge, Card, Input components
- **TypeScript**: Strict mode compliant with full type safety
- **Cookie-based Auth**: Compatible with session authentication
- **Prisma**: Uses prisma models correctly with JSON fields
- **No External Libraries**: Drag-drop uses native HTML5 API only

## Testing Checklist

- [x] Create form with all field types
- [x] Drag and reorder fields
- [x] Edit field properties
- [x] Delete fields
- [x] Add/edit/remove field options
- [x] Preview form
- [x] Submit form as public user
- [x] View submissions
- [x] Update form structure via API
- [x] Conditional logic rendering
- [x] Required field validation
- [x] Form status control (ACTIVE/PAUSED/ARCHIVED)

## Future Enhancements

- Email notifications on form submission
- Form response analytics dashboard
- Advanced validation rules UI
- Conditional logic UI builder
- Form themes and styling options
- Multi-step/page forms
- Auto-save draft functionality
- Form sharing and embedding options
- Export submissions to CSV
