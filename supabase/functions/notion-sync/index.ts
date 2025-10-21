// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Notion SDK via ESM shim
// deno run --allow-net --allow-env
import { Client as NotionClient } from "npm:@notionhq/client@2.2.15";

const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
const NOTION_DB_ID = Deno.env.get("NOTION_DB_ID");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dG91b2lnY2tuZ2FsZnZ6bXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMyNzc5NywiZXhwIjoyMDc0OTAzNzk3fQ.utMz331bJbahS-tu4_L7EBa4Bq4_F-7yIoGH7EDF6k4";
const PUBLIC_SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "";

const notion = new NotionClient({ auth: NOTION_TOKEN });

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
      if (match) blocks.push({ image: { type: 'external', external: { url: imageUrl } } });
    });
  });

  const ci = invite?.onboarding_json?.charityInfo || {};
  blocks.push({ heading_2: { rich_text: [{ type: 'text', text: { content: 'Footer' } }] } });
  blocks.push({ paragraph: { rich_text: [{ type: 'text', text: { content: `Charity Name: ${ci.charityName || 'Not provided'}` } }] } });
  if (ci.charityLogo) blocks.push({ image: { type: 'external', external: { url: ci.charityLogo } } });

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

async function fetchInviteByToken(token: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/invites?public_token=eq.${encodeURIComponent(token)}&select=*`, {
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`
    }
  });
  if (!resp.ok) throw new Error(`Fetch invite failed: ${resp.status}`);
  const rows = await resp.json();
  return rows?.[0];
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  try {
    const { token } = await req.json();
    if (!token) return new Response(JSON.stringify({ error: 'missing token' }), { status: 400 });
    const invite = await fetchInviteByToken(token);
    if (!invite) return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    await upsertNotion(invite);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'failed' }), { status: 500 });
  }
});


