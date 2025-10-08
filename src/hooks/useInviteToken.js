import { useState, useEffect } from 'react';

/**
 * Hook to parse invite token from URL hash query parameters
 * Returns the token if found, null otherwise
 */
export function useInviteToken() {
  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    const parseToken = () => {
      if (typeof window === 'undefined') return null;
      
      const hash = window.location.hash.replace(/^#/, '');
      const url = new URL(hash, window.location.origin);
      const token = url.searchParams.get('invite');
      setInviteToken(token);
    };

    // Parse on initial load
    parseToken();

    // Listen for hash changes
    window.addEventListener('hashchange', parseToken);
    
    return () => window.removeEventListener('hashchange', parseToken);
  }, []);

  return inviteToken;
}
