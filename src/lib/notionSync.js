// Direct Notion sync without Edge Functions
import { createClient } from '@supabase/supabase-js';

// Notion configuration - you'll need to set these in your .env file
const NOTION_TOKEN = import.meta.env.VITE_NOTION_TOKEN;
const NOTION_DB_ID = import.meta.env.VITE_NOTION_DB_ID;
const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || '';

// Supabase client for fetching invite data
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase environment variables not found for Notion sync');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function mapStatus(invite) {
  const s = invite?.status;
  if (s === "void") return "Void";
  if (s === "submitted" || s === "handed_off") return "Submitted";
  if (s === "in_progress") return "In Progress";
  const started = !!(invite?.onboarding_json && Object.keys(invite.onboarding_json).length);
  return started ? "Onboarding" : "Invited";
}

function safeEntries(obj) {
  return obj && typeof obj === "object" ? Object.entries(obj) : [];
}

function sectionBlocks(invite) {
  const blocks = [];
  
  // Add onboarding data if available
  if (invite?.onboarding_json) {
    const onboarding = invite.onboarding_json;
    
    if (onboarding.charityInfo) {
      blocks.push({
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "Charity Information" } }]
        }
      });
      
      safeEntries(onboarding.charityInfo).forEach(([key, value]) => {
        if (value) {
          blocks.push({
            type: "paragraph",
            paragraph: {
              rich_text: [
                { type: "text", text: { content: `${key}: `, annotations: { bold: true } } },
                { type: "text", text: { content: String(value) } }
              ]
            }
          });
        }
      });
    }
  }
  
  return blocks;
}

async function upsertNotion(invite) {
  if (!NOTION_TOKEN || !NOTION_DB_ID) {
    console.warn('Notion credentials not configured');
    return null;
  }

  try {
    const name = invite?.onboarding_json?.charityInfo?.charityName || invite?.charity_name || 'Invite';
    const statusLabel = mapStatus(invite);
    const link = PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}/#/onboarding?invite=${invite.public_token}` : null;

    // Query existing page
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        filter: { 
          property: 'Public Token', 
          rich_text: { equals: invite.public_token } 
        }
      })
    });

    const query = await queryResponse.json();
    const children = sectionBlocks(invite);

    const props = {
      Name: { title: [{ type: 'text', text: { content: name } }] },
      Status: { select: { name: statusLabel } },
      Charity: { rich_text: [{ type: 'text', text: { content: invite?.charity_name || '' } }] },
      'Contact Name': { rich_text: [{ type: 'text', text: { content: invite?.contact_name || '' } }] },
      'Contact Email': { email: invite?.contact_email || '' },
      'Raffle Type': { rich_text: [{ type: 'text', text: { content: invite?.onboarding_json?.charityInfo?.raffleType || '' } }] },
      'Updated At': { date: { start: invite?.updated_at } },
      'Public Token': { rich_text: [{ type: 'text', text: { content: invite?.public_token } }] }
    };
    
    if (link) props['Invite Link'] = { url: link };

    if (query.results.length) {
      // Update existing page
      const pageId = query.results[0].id;
      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({ properties: props })
      });
      
      // Add new content
      if (children.length > 0) {
        await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${NOTION_TOKEN}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            children: [{ divider: {} }, ...children]
          })
        });
      }
      
      return pageId;
    } else {
      // Create new page
      const created = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties: props,
          children
        })
      });
      
      const result = await created.json();
      return result.id;
    }
  } catch (error) {
    console.error('Notion sync error:', error);
    throw error;
  }
}

export async function syncInviteToNotion(token) {
  try {
    // Fetch invite data
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('public_token', token)
      .eq('is_deleted', false)
      .single();

    if (error || !invite) {
      throw new Error('Invite not found');
    }

    // Sync to Notion
    const pageId = await upsertNotion(invite);
    console.log('✅ Notion sync successful:', pageId);
    return pageId;
  } catch (error) {
    console.error('❌ Notion sync failed:', error);
    throw error;
  }
}
