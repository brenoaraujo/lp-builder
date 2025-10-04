# Server Drafts System Setup

## Environment Variables

Create a `.env` file in the project root with these variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side environment variables (for Edge Functions)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site URLs
SITE_BASE_URL=https://app.example.com
PUBLIC_BASE_URL=https://example.com

# Email Configuration
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="LP Builder <no-reply@example.com>"
PRODUCTION_NOTIFY_EMAIL=admin@example.com,support@example.com

# Security
TOKEN_TTL_DAYS=14
COOKIE_SECRET=your_cookie_secret_key_here

# Feature Flags
PIN_REQUIRED=false
```

## Database Setup

1. Run the migration:
```bash
supabase db push
```

2. Verify tables were created:
```bash
supabase db reset
```

## Edge Functions Setup

1. Deploy all functions:
```bash
supabase functions deploy drafts
supabase functions deploy draft-open
supabase functions deploy published
supabase functions deploy collaborators
```

2. Test functions locally:
```bash
supabase functions serve
```

## Frontend Integration

The system replaces localStorage with server-based drafts:

### Key Changes:
- **Onboarding**: Save on each step completion
- **Editor**: Save on section changes
- **Magic Links**: One-time tokens for access
- **Collaboration**: Share modal with role management

### API Endpoints:
- `POST /drafts` - Create new draft
- `GET /drafts/:id` - Get draft data
- `PATCH /drafts/:id` - Update draft
- `POST /drafts/:id/confirm` - Publish draft
- `GET /p/:slug` - Get published page
- `POST /collaborators/:draftId` - Invite collaborators

## Testing

### Test Matrix:
1. **Single User Flow**:
   - Create draft → Get magic link → Open → Edit → Save → Publish

2. **Collaboration Flow**:
   - Owner creates draft → Invites editor → Editor opens → Both edit → Publish

3. **Conflict Resolution**:
   - Two users edit simultaneously → Version conflict → Resolution

4. **Security**:
   - Expired tokens → Invalid access
   - Revoked collaborators → Access denied

## Migration from localStorage

Since the project isn't live yet, we can:
1. Remove all localStorage usage
2. Replace with server API calls
3. Add proper error handling
4. Implement step-based saving

## Next Steps

1. Update frontend components to use server drafts
2. Add share modal for collaboration
3. Implement comments system
4. Add presence indicators
5. Create admin interface

