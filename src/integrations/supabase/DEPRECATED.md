# Deprecated Supabase Client Files

## ⚠️ Important Notice

The Supabase client initialization has been moved to a singleton pattern in `@/lib/supabase.ts`.

## Migration Guide

### Old Way (Deprecated)

```typescript
import { supabase } from '@/integrations/supabase/client';
// or
import { supabase } from '@/integrations/supabase/environmentClient';
```

### New Way (Recommended)

```typescript
import { supabase } from '@/lib/supabase';
```

## Why This Change?

- Prevents multiple instances of the Supabase client
- Centralizes client configuration
- Improves performance by reusing the same client instance
- Makes it easier to maintain and update the client configuration

## Next Steps

1. Update all imports to use `@/lib/supabase`
2. Remove any direct imports from `@/integrations/supabase/client` or `@/integrations/supabase/environmentClient`
3. Delete these deprecated files once all imports have been updated
