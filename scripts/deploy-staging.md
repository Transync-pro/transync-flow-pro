
# Staging Deployment Script

## Manual Deployment Steps

### 1. Prepare Staging Branch
```bash
# Create and switch to staging branch
git checkout -b staging
git push origin staging
```

### 2. Environment-Specific Configuration
Ensure staging environment is properly configured in:
- `src/config/environment.ts` (update staging Supabase credentials)
- Staging Supabase project secrets
- QuickBooks sandbox configuration

### 3. Deploy via Lovable
1. Switch to staging branch in Lovable (if GitHub branch switching is enabled)
2. Click "Publish" to deploy staging environment
3. Test the staging deployment

### 4. Production Deployment
Once staging testing is complete:
```bash
# Merge staging to main for production
git checkout main
git merge staging
git push origin main
```

## Automated Deployment (Future Enhancement)
Consider setting up GitHub Actions for automated deployment:
- Staging branch pushes → Deploy to staging
- Main branch pushes → Deploy to production
