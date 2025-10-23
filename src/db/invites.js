import { supabase } from '../lib/supabase.js';
import { getAdminClient } from '../lib/adminClient.js';

/**
 * Generate a cryptographically secure random token
 */
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new invite
 */
export async function createInvite({ charity_name, contact_name, contact_email }) {
  try {
    const public_token = generateToken();
    // Use admin client for invite creation to ensure proper permissions
    const adminClient = getAdminClient();
    
    const { data, error } = await adminClient
      .from('invites')
      .insert({
        public_token,
        charity_name,
        contact_name,
        contact_email,
        status: 'invited'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Manual sync to Notion as backup (fire-and-forget to avoid UI delay)
    fetch('https://kvtouoigckngalfvzmsp.functions.supabase.co/notion-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ token: public_token })
    }).catch(() => { /* non-blocking */ });
      
      return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get invite by token (for anonymous access)
 */
export async function getInviteByToken(token) {
  try {
    const { data, error } = await supabase
      .from('invites_public')
      .select('*')
      .eq('public_token', token)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting invite by token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update invite by token with optimistic concurrency control
 */
export async function updateInviteByToken(token, patch, { expectRev } = {}) {
  try {
    // Build the update object
    const updateData = {
      ...patch,
      updated_at: new Date().toISOString()
    };

    // If expectRev is provided, add it to the WHERE clause
    let query = supabase
      .from('invites')
      .update(updateData)
      .eq('public_token', token);

    if (expectRev !== undefined) {
      query = query.eq('rev', expectRev);
    }

    const { data, error } = await query.select().single();

    if (error) {
      // Check if it's a concurrency conflict
      if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
        return { 
          success: false, 
          error: 'CONFLICT', 
          message: 'Data was modified by another user. Please refresh and try again.' 
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating invite by token:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Soft delete an invite
 */
export async function softDeleteInvite(token) {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({
        is_deleted: true,
        status: 'void',
        updated_at: new Date().toISOString()
      })
      .eq('public_token', token)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error soft deleting invite:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List invites (admin only)
 */
export async function listInvites({ search, status, limit = 50, offset = 0 } = {}) {
  try {
    let query = supabase
      .from('invites')
      .select('*')
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`charity_name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return { success: true, data, count };
  } catch (error) {
    console.error('Error listing invites:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get invite by ID (admin only)
 */
export async function getInviteById(id) {
  try {
    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error getting invite by ID:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update invite by ID (admin only)
 */
export async function updateInviteById(id, patch) {
  try {
    const { data, error } = await supabase
      .from('invites')
      .update({
        ...patch,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating invite by ID:', error);
    return { success: false, error: error.message };
  }
}
