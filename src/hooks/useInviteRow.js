import { useState, useEffect, useCallback } from 'react';
import { getInviteByToken, updateInviteByToken } from '../db/invites.js';

/**
 * Hook to manage invite row data with loading and saving states
 */
export function useInviteRow(token) {
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load invite data
  const loadInvite = useCallback(async () => {
    if (!token) {
      setRow(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getInviteByToken(token);
      if (result.success) {
        setRow(result.data);
      } else {
        setError(result.error);
        setRow(null);
      }
    } catch (err) {
      setError(err.message);
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update invite data with optimistic concurrency control
  const updateInvite = useCallback(async (patch, options = {}) => {
    if (!token || !row) {
      throw new Error('No token or row data available');
    }

    setSaving(true);
    setError(null);

    try {
      const result = await updateInviteByToken(token, patch, {
        expectRev: row.rev,
        ...options
      });

      if (result.success) {
        setRow(result.data);
        return result.data;
      } else if (result.error === 'CONFLICT') {
        // Reload the latest data and retry
        await loadInvite();
        throw new Error(result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [token, row, loadInvite]);

  // Refresh data
  const refresh = useCallback(() => {
    return loadInvite();
  }, [loadInvite]);

  // Load data on mount and when token changes
  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  return {
    row,
    loading,
    saving,
    error,
    updateInvite,
    refresh
  };
}
