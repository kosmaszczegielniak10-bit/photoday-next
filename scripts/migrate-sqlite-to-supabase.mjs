#!/usr/bin/env node
/**
 * PhotoDay — SQLite → Supabase Migration Script
 * Reads all data from local photoday.db and imports it into Supabase Postgres.
 *
 * Usage:
 *   1. Fill in .env.local with SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 *   2. Ensure the photoday.db is in the parent directory (../photoday.db)
 *   3. Run: node scripts/migrate-sqlite-to-supabase.mjs [--dry-run]
 *
 * --dry-run: reads from SQLite and prints counts but does NOT write to Supabase
 */

import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ── Load env ─────────────────────────────────
function loadEnv() {
    const envPath = join(__dirname, '..', '.env.local');
    if (!existsSync(envPath)) {
        throw new Error('.env.local not found. Copy .env.example → .env.local and fill in keys.');
    }
    const raw = readFileSync(envPath, 'utf-8');
    raw.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
    });
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

// ── Locate SQLite database ────────────────────
const possiblePaths = [
    join(__dirname, '..', '..', 'photoday.db'),      // ../photoday.db
    join(__dirname, '..', '..', 'server', 'photoday.db'),
    join(__dirname, '..', '..', 'data.sqlite'),
];
const dbPath = possiblePaths.find(existsSync);
if (!dbPath) throw new Error(`SQLite database not found. Checked:\n${possiblePaths.join('\n')}`);

console.log(`📂 Reading SQLite from: ${dbPath}`);
const sqlite = new Database(dbPath, { readonly: true });

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// ── Helpers ───────────────────────────────────
async function upsertBatch(table, rows, chunkSize = 100) {
    if (rows.length === 0) return;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        if (!DRY_RUN) {
            const { error } = await sb.from(table).upsert(chunk, { onConflict: 'id' });
            if (error) throw new Error(`${table} upsert error: ${error.message}`);
        }
    }
    console.log(`  ✓ ${table}: ${rows.length} rows ${DRY_RUN ? '(dry-run)' : 'migrated'}`);
}

// ── Migration ─────────────────────────────────
async function migrate() {
    console.log(`\n🚀 PhotoDay SQLite → Supabase Migration${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

    // 1. Users
    const users = sqlite.prepare('SELECT * FROM users').all();
    await upsertBatch('users', users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        password_hash: u.password_hash,
        display_name: u.display_name,
        bio: u.bio || '',
        avatar_path: u.avatar_path || null,
        created_at: u.created_at,
    })));

    // 2. Entries
    const entries = sqlite.prepare('SELECT * FROM entries').all();
    await upsertBatch('entries', entries.map(e => ({
        id: e.id, user_id: e.user_id,
        date: e.date, photo_path: e.photo_path || null,
        description: e.description || '',
        mood: e.mood || '', privacy: e.privacy || 'private',
        created_at: e.created_at, updated_at: e.updated_at,
        deleted_at: e.deleted_at || null,
    })));

    // 3. Friendships
    const friendships = sqlite.prepare('SELECT * FROM friendships').all();
    await upsertBatch('friendships', friendships.map(f => ({
        id: f.id, requester_id: f.requester_id, receiver_id: f.receiver_id,
        status: f.status, created_at: f.created_at,
    })));

    // 4. Reactions
    const reactions = sqlite.prepare('SELECT * FROM reactions').all().catch?.() ?? [];
    const reactionsArr = Array.isArray(reactions) ? reactions : sqlite.prepare('SELECT * FROM reactions').all();
    await upsertBatch('reactions', reactionsArr.map(r => ({
        id: r.id, user_id: r.user_id, entry_id: r.entry_id,
        type: r.type || 'like', created_at: r.created_at,
    })));

    // 5. Notifications
    const notifs = sqlite.prepare('SELECT * FROM notifications').all();
    await upsertBatch('notifications', notifs.map(n => ({
        id: n.id, user_id: n.user_id, actor_id: n.actor_id,
        type: n.type, entity_id: n.entity_id || null,
        is_read: n.is_read || 0, created_at: n.created_at,
    })));

    // 6. Albums
    try {
        const albums = sqlite.prepare('SELECT * FROM albums').all();
        await upsertBatch('albums', albums.map(a => ({
            id: a.id, user_id: a.user_id, name: a.name,
            description: a.description || '', cover_path: a.cover_path || null,
            created_at: a.created_at,
        })));

        const albumEntries = sqlite.prepare('SELECT * FROM album_entries').all();
        await upsertBatch('album_entries', albumEntries.map(ae => ({
            album_id: ae.album_id, entry_id: ae.entry_id, added_at: ae.added_at,
        })));
    } catch { console.log('  ℹ  albums table not found, skipping'); }

    // 7. Posts
    try {
        const posts = sqlite.prepare('SELECT * FROM posts').all();
        await upsertBatch('posts', posts.map(p => ({
            id: p.id, user_id: p.user_id, entry_id: p.entry_id || null,
            photo_path: p.photo_path || null, caption: p.caption || '',
            privacy: p.privacy || 'friends', created_at: p.created_at,
        })));
    } catch { console.log('  ℹ  posts table not found, skipping'); }

    // 8. Comments
    try {
        const comments = sqlite.prepare('SELECT * FROM comments').all();
        await upsertBatch('comments', comments.map(c => ({
            id: c.id, post_id: c.post_id, user_id: c.user_id,
            text: c.text, created_at: c.created_at,
        })));
    } catch { console.log('  ℹ  comments table not found, skipping'); }

    // 9. Stories
    try {
        const stories = sqlite.prepare('SELECT * FROM stories').all();
        await upsertBatch('stories', stories.map(s => ({
            id: s.id, user_id: s.user_id, photo_path: s.photo_path,
            caption: s.caption || '', expires_at: s.expires_at,
            created_at: s.created_at,
        })));
    } catch { console.log('  ℹ  stories table not found, skipping'); }

    // 10. Conversations + Messages
    try {
        const convs = sqlite.prepare('SELECT * FROM conversations').all();
        await upsertBatch('conversations', convs.map(c => ({
            id: c.id, user_a: c.user_a, user_b: c.user_b,
            last_message_at: c.last_message_at,
        })));

        const messages = sqlite.prepare('SELECT * FROM messages').all();
        await upsertBatch('messages', messages.map(m => ({
            id: m.id, conversation_id: m.conversation_id,
            sender_id: m.sender_id, text: m.text || '',
            photo_path: m.photo_path || null, is_read: m.is_read || 0,
            created_at: m.created_at,
        })));
    } catch { console.log('  ℹ  conversations/messages table not found, skipping'); }

    console.log(`\n✅ Migration ${DRY_RUN ? 'dry-run' : ''} complete!`);
    if (!DRY_RUN) {
        console.log(`\n📝 Next steps:`);
        console.log(`  1. Check your Supabase Table Editor to verify the data`);
        console.log(`  2. Upload the /uploads folder to Supabase Storage`);
        console.log(`  3. Update photo_path references from filenames to full Supabase Storage URLs`);
    }
}

migrate().catch(err => {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
});
