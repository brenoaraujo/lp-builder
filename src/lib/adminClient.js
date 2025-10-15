import { createClient } from '@supabase/supabase-js';

// Shared admin client singleton
let adminClient = null;

export function getAdminClient() {
  if (!adminClient) {
    const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const url = import.meta.env.VITE_SUPABASE_URL;
    
    console.log('🔑 Creating shared admin client:', {
      hasServiceKey: !!serviceKey,
      hasAnonKey: !!anonKey,
      hasUrl: !!url,
      usingServiceKey: !!serviceKey,
      serviceKeyPrefix: serviceKey ? serviceKey.substring(0, 20) + '...' : 'none'
    });
    
    // Use service key if available, otherwise fall back to anon key
    const key = serviceKey || anonKey;
    
    adminClient = createClient(
      url,
      key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          // When using service key, we don't need to authenticate
          ...(serviceKey ? {} : {})
        }
      }
    );
  }
  return adminClient;
}
