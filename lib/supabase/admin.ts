import { createClient } from '@supabase/supabase-js';

import { validateServerEnv } from '@/lib/validations/env';

export function createAdminClient() {
  const env = validateServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin environment configuration');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}