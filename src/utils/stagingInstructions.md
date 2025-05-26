
# Staging Environment Setup Instructions

## Next Steps to Complete Staging Setup

### 1. Create Staging Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for staging
3. Copy the database schema from production:
   - Export schema from production project
   - Import to staging project
   - Copy all edge functions
   - Set up RLS policies

### 2. Update Environment Configuration
Once you have the staging Supabase project:
1. Update `src/config/environment.ts`
2. Replace the staging supabase URL and anon key with your staging project credentials

### 3. Configure Staging Secrets
In your staging Supabase project, set up these secrets:
- `QUICKBOOKS_ENVIRONMENT`: 'sandbox'
- `SANDBOX_ID`: Your QuickBooks sandbox app ID
- `SANDBOX_SECRET`: Your QuickBooks sandbox app secret
- Any other API keys needed for testing

### 4. Set Up GitHub Branch-Based Deployment
1. Enable GitHub branch switching in Lovable:
   - Go to Account Settings > Labs
   - Enable "GitHub Branch Switching"
2. Create a staging branch in your GitHub repository
3. Deploy staging branch using Lovable's publish feature

### 5. Domain Configuration (Optional)
For easier access, you can:
- Set up a custom domain for staging (e.g., staging.yourdomain.com)
- Or use Lovable's subdomain with branch name

### 6. Testing Workflow
1. Make changes in feature branches
2. Test in development environment
3. Merge to staging branch for staging testing
4. After validation, merge to main branch for production

## Environment Detection
The app now automatically detects the environment based on:
- Hostname patterns (staging/stage domains → staging)
- localhost/lovable.app → development
- Everything else → production

## Visual Indicators
- Development: Blue "DEVELOPMENT" badge
- Staging: Yellow "STAGING" badge
- Production: No badge shown
