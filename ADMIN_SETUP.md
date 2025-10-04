# Admin Dashboard Setup

## Overview
The admin dashboard allows your team to:
- Send magic links to clients to start the onboarding process
- View all drafts with charity information, submitter details, logos, and app links
- Monitor draft status and completion
- Access published pages

## Access
Navigate to `#/admin` in your application to access the admin dashboard.

## Authentication
The admin dashboard is protected with a simple password authentication:
- Default password: `admin123`
- You can set a custom password by adding `VITE_ADMIN_PASSWORD=yourpassword` to your `.env` file

## Features

### 1. Send Magic Link
- Enter client email and optional charity name
- System creates a draft and sends a magic link
- Client receives email with link to start onboarding

### 2. Drafts Table
Shows all drafts with:
- **Charity**: Name, logo, and website
- **Submitter**: Client email address
- **Status**: Active, Confirmed, or Archived
- **Created**: Date and time
- **App Link**: Direct link to configurator
- **Actions**: View details, copy links

### 3. Statistics
- Total drafts created
- Active drafts in progress
- Published pages
- Drafts created this month

## API Endpoints

The admin dashboard uses these Edge Functions:
- `POST /admin/send-magic-link` - Send magic link to client
- `GET /admin/drafts` - Get all drafts with details
- `GET /admin/stats` - Get dashboard statistics

## Deployment

To deploy the admin functionality:

1. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy admin
   ```

2. **Set Environment Variables**:
   Add to your `.env` file:
   ```
   VITE_ADMIN_PASSWORD=your_secure_password
   ```

3. **Database Setup**:
   Ensure your database schema is applied:
   ```bash
   supabase db push
   ```

## Security Notes

- The current authentication is basic password-based
- For production, consider implementing proper authentication (OAuth, JWT, etc.)
- Admin functions should be protected with proper authorization
- Consider rate limiting for admin endpoints

## Usage Flow

1. **Admin sends magic link**:
   - Admin enters client email and charity name
   - System creates draft and sends email
   - Client receives magic link

2. **Client completes onboarding**:
   - Client clicks magic link
   - Completes onboarding wizard
   - Creates and customizes landing page

3. **Admin monitors progress**:
   - Views all drafts in admin dashboard
   - Sees charity info, logos, and status
   - Can access client's configurator directly

4. **Client finishes and handoff**:
   - Client completes design and clicks "Finish & handoff"
   - Draft status updates to "confirmed"
   - Published page is created
   - Admin can see final result
