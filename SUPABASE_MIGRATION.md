# Supabase Migration Setup

This document explains how to set up the Supabase database migration for the LP Builder refactoring.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Panel Access
VITE_ADMIN_PASSCODE=your_admin_passcode

# Optional: Brandfetch API for charity logo search
VITE_BRANDFETCH_API_KEY=your_brandfetch_api_key

# Development Environment
VITE_ENV=development
```

## Database Setup

1. **Run the migration**: Execute the SQL migration file `supabase/migrations/001_create_invites_table.sql` in your Supabase SQL editor.

2. **Verify the setup**: The migration creates:
   - `invites` table with all required columns
   - RLS policies for anonymous and authenticated access
   - `invites_public` view for limited public access
   - Proper indexes for performance

## Admin Access

The admin panel is protected by a passcode. Set `VITE_ADMIN_PASSCODE` in your environment variables to access the admin interface at `#/admin`.

## Development Reset

To reset the development database:

```bash
npm run reset:dev
```

This will:
- Clear all invites from the database
- Clear the charity-logos storage bucket
- Only work in development environment

## Key Changes Made

### Database Schema
- **invites table**: Stores all builder state (theme, overrides, onboarding data)
- **RLS policies**: Anonymous users can only access their own invite by token
- **Optimistic concurrency**: Uses `rev` field to prevent conflicts

### Application Changes
- **No localStorage**: All persistent state now lives in the database
- **Invite-based routing**: URLs use `?invite=<token>` parameter
- **Debounced saves**: Changes are saved to DB with 1-second debounce
- **Admin panel**: Create and manage invites

### URL Structure
- Onboarding: `#/onboarding?invite=<token>`
- Builder: `#/app?invite=<token>`
- Admin: `#/admin`

## Testing the Migration

1. Create an invite via the admin panel
2. Use the generated link to access onboarding
3. Complete onboarding and verify it redirects to builder
4. Make changes in the builder and verify they persist on refresh
5. Test with multiple browser tabs to ensure no conflicts

## Troubleshooting

- **CORS errors**: Ensure you're not using Edge Functions (use direct Supabase client)
- **RLS errors**: Check that the public_token is properly set in JWT claims
- **Save failures**: Check network tab for 409 conflicts (optimistic concurrency)
- **Admin access**: Verify VITE_ADMIN_PASSCODE is set correctly
