// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Notion SDK via ESM shim
// deno run --allow-net --allow-env
import { Client as NotionClient } from "npm:@notionhq/client@2.2.15";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
const NOTION_DB_ID = Deno.env.get("NOTION_DB_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "";

// Validate required environment variables
if (!NOTION_TOKEN) throw new Error("NOTION_TOKEN environment variable is required");
if (!NOTION_DB_ID) throw new Error("NOTION_DB_ID environment variable is required");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL environment variable is required");
if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");

const notion = new NotionClient({ auth: NOTION_TOKEN });

// Create Supabase client
const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

function mapStatus(invite: any): string {
  const s = invite?.status;
  if (s === "void") return "Void";
  if (s === "submitted" || s === "handed_off") return "Submitted";
  if (s === "in_progress") return "In Progress";
  const started = !!(invite?.onboarding_json && Object.keys(invite.onboarding_json).length);
  return started ? "Onboarding" : "Invited";
}

function safeEntries(obj: any): [string, any][] {
  return obj && typeof obj === "object" ? Object.entries(obj) : [];
}

// Normalize URLs so Notion can fetch them externally
function normalizeExternalUrl(input: any): string | null {
  if (!input || typeof input !== 'string') return null;
  const url = input.trim();
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:')) return null; // Notion external images must be http(s)
  // Prefix site-relative paths
  if (url.startsWith('/')) {
    if (!PUBLIC_SITE_URL) return null;
    return `${PUBLIC_SITE_URL}${url}`;
  }
  // Best-effort: pass-through anything that looks like a full domain without protocol
  // e.g. example.com/img.png -> https://example.com/img.png
  if (/^[\w.-]+\.[a-z]{2,}\/\S+/i.test(url)) {
    return `https://${url}`;
  }
  return null;
}

function sectionBlocks(invite: any): any[] {
  const overrides = (invite?.overrides_json && Object.keys(invite.overrides_json).length)
    ? invite.overrides_json
    : (invite?.onboarding_json?.sectionOverrides || {});
  const images = (invite?.images_json && Object.keys(invite.images_json).length)
    ? invite.images_json
    : (invite?.onboarding_json?.images || {});
  const order = Array.isArray(overrides?._sectionOrder) ? overrides._sectionOrder : [];

  const list = safeEntries(overrides)
    .filter(([k]) => k !== "_sectionOrder")
    .filter(([k, v]) => k !== "WhoYouHelp" ? true : (order.includes("WhoYouHelp") || v?.visible === true));

  const blocks: any[] = [];
  blocks.push({ heading_2: { rich_text: [{ type: "text", text: { content: "Sections" } }] } });

  list.forEach(([sectionKey, data]) => {
    const title = sectionKey.replace(/([A-Z])/g, " $1").trim();
    const children: any[] = [];
    children.push({ paragraph: { rich_text: [{ type: "text", text: { content: `Layout: ${data?.variant || "A"}` } }] } });
    safeEntries(data?.display).forEach(([k, v]) => {
      children.push({ paragraph: { rich_text: [{ type: "text", text: { content: `Display - ${k.replace(/([A-Z])/g,' $1').trim()}: ${v ? "Visible" : "Hidden"}` } }] } });
    });
    safeEntries(data?.copy).filter(([k]) => !String(k).includes("action")).forEach(([k, v]) => {
      children.push({ paragraph: { rich_text: [{ type: "text", text: { content: `${k.replace(/([A-Z])/g,' $1').trim()}: ${v || 'Not set'}` } }] } });
    });
    safeEntries(data?.copy).filter(([k]) => String(k).includes("action")).forEach(([k, v]) => {
      children.push({ paragraph: { rich_text: [{ type: "text", text: { content: `${k.replace(/([A-Z])/g,' $1').replace('action','').trim()} Link: ${v || 'Not set'}` } }] } });
    });
    if (data?.theme?.enabled && data?.theme?.values) {
      safeEntries(data.theme.values).forEach(([k, v]) => {
        children.push({ paragraph: { rich_text: [{ type: "text", text: { content: `Theme ${k}: ${v}` } }] } });
      });
    }

    // section block
    blocks.push({
      toggle: {
        rich_text: [{ type: "text", text: { content: `${title}${data?.visible === false ? ' (Hidden)' : ''}` } }],
        children
      }
    });

    // images
    safeEntries(images).forEach(([imageKey, imageUrl]) => {
      if (!imageUrl) return;
      const normalized = imageKey.toLowerCase();
      const keyLower = sectionKey.toLowerCase();
      const match = normalized.includes(keyLower)
        || (sectionKey === 'winners' && normalized.startsWith('winner'))
        || (sectionKey === 'hero' && normalized.startsWith('hero-image'))
        || (sectionKey === 'feature' && normalized.startsWith('feature-image'))
        || (sectionKey === 'extraPrizes' && normalized.includes('extra-prize'));
      if (match) {
        const externalUrl = normalizeExternalUrl(imageUrl);
        if (externalUrl) blocks.push({ image: { type: 'external', external: { url: externalUrl } } });
      }
    });
  });

  const ci = invite?.onboarding_json?.charityInfo || {};
  blocks.push({ heading_2: { rich_text: [{ type: 'text', text: { content: 'Footer' } }] } });
  blocks.push({ paragraph: { rich_text: [{ type: 'text', text: { content: `Charity Name: ${ci.charityName || 'Not provided'}` } }] } });
  if (ci.charityLogo) {
    const logoUrl = normalizeExternalUrl(ci.charityLogo);
    if (logoUrl) blocks.push({ image: { type: 'external', external: { url: logoUrl } } });
  }

  if (invite?.theme_json?.colors || invite?.theme_json?.fonts) {
    blocks.push({ heading_2: { rich_text: [{ type: 'text', text: { content: 'Global Theme' } }] } });
    safeEntries(invite.theme_json?.colors).forEach(([k, v]) => {
      blocks.push({ paragraph: { rich_text: [{ type: 'text', text: { content: `${k}: ${v}` } }] } });
    });
    safeEntries(invite.theme_json?.fonts).forEach(([k, v]) => {
      blocks.push({ paragraph: { rich_text: [{ type: 'text', text: { content: `${k} font: ${v || 'Default'}` } }] } });
    });
  }

  return blocks;
}

async function upsertNotion(invite: any) {
  const name = invite?.onboarding_json?.charityInfo?.charityName || invite?.charity_name || 'Invite';
  const statusLabel = mapStatus(invite);
  const link = PUBLIC_SITE_URL ? `${PUBLIC_SITE_URL}/#/onboarding?invite=${invite.public_token}` : null;

  const query = await notion.databases.query({
    database_id: NOTION_DB_ID!,
    filter: { property: 'Public Token', rich_text: { equals: invite.public_token } }
  });

  const props: any = {
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

  const children = sectionBlocks(invite);

  if (query.results.length) {
    const pageId = (query.results[0] as any).id;
    await notion.pages.update({ page_id: pageId, properties: props });
    await notion.blocks.children.append({ block_id: pageId, children: [{ divider: {} }, ...children] });
    return pageId;
  } else {
    const created = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID! },
      properties: props,
      children
    });
    return (created as any).id;
  }
}

// Archive a Notion page by Public Token (soft delete in Notion)
async function archiveNotionByToken(token: string) {
  const query = await notion.databases.query({
    database_id: NOTION_DB_ID!,
    filter: { property: 'Public Token', rich_text: { equals: token } }
  });

  if (query.results.length) {
    const pageId = (query.results[0] as any).id;
    await notion.pages.update({ page_id: pageId, archived: true });
    return pageId;
  }

  return null;
}

async function fetchInviteByToken(token: string) {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('public_token', token)
    .single();
  
  if (error) {
    console.error('Database error:', error);
    return null;
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  
  try {
    const { token, is_deleted: isDeletedHint } = await req.json();
    if (!token) return new Response(JSON.stringify({ error: 'missing token' }), { 
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
    // If trigger provided an explicit deletion hint, honor it immediately
    if (isDeletedHint === true) {
      await archiveNotionByToken(token);
    } else {
      const invite = await fetchInviteByToken(token);
      if (!invite) return new Response(JSON.stringify({ error: 'not found' }), { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      });
      // If the invite is soft-deleted, archive the page in Notion
      if (invite.is_deleted) {
        await archiveNotionByToken(invite.public_token);
      } else {
        await upsertNotion(invite);
      }
    }
    return new Response(JSON.stringify({ ok: true }), { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'failed' }), { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    });
  }
});


