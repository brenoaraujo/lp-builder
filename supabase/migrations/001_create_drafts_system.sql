-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE draft_status AS ENUM ('active', 'confirmed', 'archived');
CREATE TYPE collaborator_role AS ENUM ('viewer', 'editor');

-- 1. Drafts table
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status draft_status NOT NULL DEFAULT 'active',
    client_email TEXT NOT NULL,
    token_hash TEXT,
    pin_hash TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Draft versions table
CREATE TABLE draft_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    config_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_email TEXT
);

-- 3. Published pages table
CREATE TABLE published (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID REFERENCES drafts(id),
    slug TEXT UNIQUE NOT NULL,
    config_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_by TEXT
);

-- 4. Draft collaborators table
CREATE TABLE draft_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role collaborator_role NOT NULL DEFAULT 'editor',
    token_hash TEXT,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

-- Create unique index for active collaborators only
CREATE UNIQUE INDEX idx_draft_collaborators_active 
ON draft_collaborators(draft_id, email) 
WHERE revoked_at IS NULL;

-- 5. Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    body TEXT NOT NULL,
    created_by TEXT NOT NULL,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit log table
CREATE TABLE audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    by_email TEXT,
    ip TEXT,
    user_agent TEXT,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Presence table (for active users)
CREATE TABLE presence (
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    who TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (draft_id, who)
);

-- 8. Locks table (for soft locks)
CREATE TABLE locks (
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    by_email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (draft_id, path)
);

-- Create indexes for performance
CREATE INDEX idx_drafts_status ON drafts(status);
CREATE INDEX idx_drafts_client_email ON drafts(client_email);
CREATE INDEX idx_drafts_expires_at ON drafts(expires_at);
CREATE INDEX idx_draft_versions_draft_id_version ON draft_versions(draft_id, version);
CREATE INDEX idx_published_slug ON published(slug);
CREATE INDEX idx_draft_collaborators_draft_id ON draft_collaborators(draft_id);
CREATE INDEX idx_draft_collaborators_email ON draft_collaborators(email);
CREATE INDEX idx_comments_draft_id ON comments(draft_id);
CREATE INDEX idx_comments_path ON comments(path);
CREATE INDEX idx_audit_entity ON audit(entity_type, entity_id, at);
CREATE INDEX idx_presence_last_seen ON presence(last_seen_at);
CREATE INDEX idx_locks_expires_at ON locks(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to drafts
CREATE TRIGGER update_drafts_updated_at BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE published ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (deny all by default - only Edge Functions with service role can access)
CREATE POLICY "Deny all access" ON drafts FOR ALL USING (false);
CREATE POLICY "Deny all access" ON draft_versions FOR ALL USING (false);
CREATE POLICY "Deny all access" ON published FOR ALL USING (false);
CREATE POLICY "Deny all access" ON draft_collaborators FOR ALL USING (false);
CREATE POLICY "Deny all access" ON comments FOR ALL USING (false);
CREATE POLICY "Deny all access" ON audit FOR ALL USING (false);
CREATE POLICY "Deny all access" ON presence FOR ALL USING (false);
CREATE POLICY "Deny all access" ON locks FOR ALL USING (false);

-- Allow public read access to published pages only
CREATE POLICY "Allow public read access to published" ON published FOR SELECT USING (true);
