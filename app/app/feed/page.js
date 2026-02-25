'use client';
// app/app/feed/page.js — Friends Feed: Stories + Posts + Likes + Comments

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import styles from './feed.module.css';

// ── Icons ──────────────────────────────────────────
const IcHeart = ({ filled }) => filled
    ? <svg viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="2" width="22" height="22"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;

const IcComment = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const IcCamera = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
const IcPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IcX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

// ── Avatar Helper ──────────────────────────────────
function avatarUrl(path, name) {
    if (path?.startsWith('http')) return path;
    if (path) return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=80&background=random&color=fff`;
}

function timeAgo(ts) {
    const diff = Date.now() - Number(ts);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'teraz';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} godz`;
    return `${Math.floor(h / 24)} dni`;
}

// ── Story Item ────────────────────────────────────
function StoryItem({ story, onView, isMe }) {
    const name = story.display_name || story.username || 'Ja';
    const av = avatarUrl(story.avatar_path, name);
    return (
        <div className={styles.storyItem} onClick={() => onView(story)}>
            <div className={`${styles.storyRing} ${isMe ? styles.storyRingMe : ''}`}>
                <img src={av} alt={name} className={styles.storyAvatar} />
            </div>
            <span className={styles.storyName}>{isMe ? 'Twoja' : name.split(' ')[0]}</span>
        </div>
    );
}

// ── Add Story Item ────────────────────────────────
function AddStoryItem({ onAdd }) {
    return (
        <div className={styles.storyItem} onClick={onAdd}>
            <div className={styles.addStoryBtn}>
                <IcCamera />
                <div className={styles.addStoryPlus}><IcPlus /></div>
            </div>
            <span className={styles.storyName}>Dodaj</span>
        </div>
    );
}

// ── Post Card ────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onComment, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef(null);

    const av = avatarUrl(post.author_avatar, post.author_name);
    const photoSrc = post.photo_path?.startsWith('http')
        ? post.photo_path
        : post.photo_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${post.photo_path}` : null;

    const handleComment = async () => {
        if (!comment.trim() || submitting) return;
        setSubmitting(true);
        const text = comment.trim();
        setComment('');
        try { await onComment(post.id, text); }
        finally { setSubmitting(false); }
    };

    return (
        <div className={styles.postCard}>
            {/* Header */}
            <div className={styles.postHeader}>
                <img src={av} alt={post.author_name} className={`${styles.postAvatar} avatar`} />
                <div className={styles.postMeta}>
                    <div className={styles.postAuthor}>{post.author_name}</div>
                    <div className={styles.postTime}>{timeAgo(post.created_at)}</div>
                </div>
                {post.author_id === currentUserId && (
                    <button className={styles.deleteBtn} onClick={() => onDelete(post.id)} title="Usuń">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                )}
            </div>

            {/* Photo */}
            {photoSrc && (
                <img src={photoSrc} alt="" className={styles.postPhoto} loading="lazy" />
            )}

            {/* Caption */}
            {post.caption && <p className={styles.postCaption}>{post.caption}</p>}
            {post.description && !post.caption && <p className={styles.postCaption}>{post.description}</p>}

            {/* Actions */}
            <div className={styles.postActions}>
                <button
                    className={`${styles.actionBtn} ${post.liked ? styles.liked : ''}`}
                    onClick={() => onLike(post.id, post.liked)}
                >
                    <IcHeart filled={post.liked} />
                    <span>{post.like_count || 0}</span>
                </button>
                <button className={styles.actionBtn} onClick={() => { setExpanded(e => !e); if (!expanded) setTimeout(() => inputRef.current?.focus(), 150); }}>
                    <IcComment />
                    <span>{post.comment_count || 0}</span>
                </button>
            </div>

            {/* Comments section */}
            {expanded && (
                <div className={styles.commentsSection}>
                    {(post.comments || []).map(c => (
                        <div key={c.id} className={styles.comment}>
                            <img src={avatarUrl(c.author_avatar, c.author_name)} alt="" className={styles.commentAvatar} />
                            <div className={styles.commentBody}>
                                <span className={styles.commentAuthor}>{c.author_name}</span>
                                <span className={styles.commentText}>{c.text}</span>
                            </div>
                        </div>
                    ))}
                    <div className={styles.commentInput}>
                        <input
                            ref={inputRef}
                            className="input"
                            style={{ borderRadius: 22, padding: '8px 14px', fontSize: 14 }}
                            placeholder="Dodaj komentarz…"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleComment()}
                        />
                        <button className={styles.sendComment} onClick={handleComment} disabled={!comment.trim() || submitting}>
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── New Post Modal ────────────────────────────────
function NewPostModal({ onClose, onPost }) {
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [caption, setCaption] = useState('');
    const [privacy, setPrivacy] = useState('friends');
    const [saving, setSaving] = useState(false);
    const fileRef = useRef(null);
    const showToast = useToast();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const handlePost = async () => {
        if (!photo) { showToast('Wybierz zdjęcie', 'error'); return; }
        setSaving(true);
        try {
            const photoData = await new Promise((res, rej) => {
                const r = new FileReader();
                r.onload = e => res(e.target.result);
                r.onerror = rej;
                r.readAsDataURL(photo);
            });
            await onPost({ photoData, caption, privacy });
            onClose();
        } catch (err) {
            showToast(err.message, 'error');
        } finally { setSaving(false); }
    };

    return (
        <div className={styles.modalBackdrop} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>Nowy post</span>
                    <button className={styles.modalClose} onClick={onClose}><IcX /></button>
                </div>
                <div
                    className={styles.photoZone}
                    onClick={() => fileRef.current?.click()}
                    style={{ backgroundImage: preview ? `url(${preview})` : undefined }}
                >
                    {!preview && <><IcCamera /><span>Dodaj zdjęcie</span></>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                <div className={styles.modalBody}>
                    <textarea
                        className={`input ${styles.captionArea}`}
                        placeholder="Co chcesz napisać?"
                        value={caption}
                        onChange={e => setCaption(e.target.value)}
                        rows={3}
                    />
                    <div className={styles.privacyRow}>
                        {['friends', 'public'].map(p => (
                            <button key={p} type="button"
                                className={`${styles.privBtn} ${privacy === p ? styles.privActive : ''}`}
                                onClick={() => setPrivacy(p)}>
                                {p === 'friends' ? 'Znajomi' : 'Publiczny'}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary btn-full" onClick={handlePost} disabled={saving || !photo}>
                        {saving ? 'Publikowanie…' : 'Opublikuj'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Story Viewer ──────────────────────────────────
function StoryViewer({ story, onClose }) {
    const src = story.photo_path?.startsWith('http') ? story.photo_path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${story.photo_path}`;
    return (
        <div className={styles.storyViewer} onClick={onClose}>
            <img src={src} alt="" className={styles.storyViewerImg} />
            <div className={styles.storyViewerInfo}>
                <img src={avatarUrl(story.avatar_path, story.display_name)} alt="" className={styles.storyViewerAvatar} />
                <span>{story.display_name || story.username}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, opacity: .7 }}>{timeAgo(story.created_at)}</span>
            </div>
            {story.caption && <div className={styles.storyViewerCaption}>{story.caption}</div>}
        </div>
    );
}

// ── Main Feed Page ────────────────────────────────
export default function FeedPage() {
    const { user } = useAuth();
    const showToast = useToast();
    const [stories, setStories] = useState(null);
    const [posts, setPosts] = useState(null);
    const [activeStory, setActiveStory] = useState(null);
    const [showNewPost, setShowNewPost] = useState(false);
    const fileRef = useRef(null);

    const loadFeed = useCallback(async () => {
        try {
            const [s, p] = await Promise.all([
                api.get('/feed/stories'),
                api.get('/feed/posts'),
            ]);
            setStories(s || []);
            setPosts(p || []);
        } catch {
            setStories([]); setPosts([]);
            showToast('Błąd ładowania feedu', 'error');
        }
    }, [showToast]);

    useEffect(() => { loadFeed(); }, [loadFeed]);

    const handleLike = async (postId, liked) => {
        setPosts(prev => prev.map(p => p.id === postId
            ? { ...p, liked: !liked, like_count: (p.like_count || 0) + (liked ? -1 : 1) }
            : p));
        try {
            if (liked) await api.delete(`/feed/posts/${postId}/like`);
            else await api.post(`/feed/posts/${postId}/like`);
        } catch { loadFeed(); }
    };

    const handleComment = async (postId, text) => {
        try {
            const c = await api.post(`/feed/posts/${postId}/comments`, { text });
            setPosts(prev => prev.map(p => p.id === postId
                ? { ...p, comments: [...(p.comments || []), c], comment_count: (p.comment_count || 0) + 1 }
                : p));
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleDelete = async (postId) => {
        try {
            await api.delete(`/feed/posts/${postId}`);
            setPosts(prev => prev.filter(p => p.id !== postId));
            showToast('Post usunięty', 'success');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handlePost = async ({ photoData, caption, privacy }) => {
        const post = await api.post('/feed/posts', { photoData, caption, privacy });
        setPosts(prev => [post, ...(prev || [])]);
        showToast('Post opublikowany!', 'success');
    };

    const handleAddStory = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const photoData = await new Promise((res, rej) => {
                const r = new FileReader(); r.onload = ev => res(ev.target.result); r.onerror = rej; r.readAsDataURL(file);
            });
            await api.post('/feed/stories', { photoData, privacy: 'friends' });
            showToast('Historia dodana!', 'success');
            loadFeed();
        } catch (err) { showToast(err.message, 'error'); }
    };

    return (
        <div className={styles.page}>
            {/* Stories */}
            <div className={styles.storiesBar}>
                <div className={styles.storiesScroll}>
                    <AddStoryItem onAdd={() => fileRef.current?.click()} />
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAddStory} style={{ display: 'none' }} />
                    {stories === null
                        ? [1, 2, 3, 4].map(i => (
                            <div key={i} className={styles.storyItem}>
                                <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
                                <div className="skeleton" style={{ width: 40, height: 9, borderRadius: 4, marginTop: 5 }} />
                            </div>
                        ))
                        : stories.map(s => (
                            <StoryItem
                                key={s.id}
                                story={s}
                                isMe={s.user_id === user?.id}
                                onView={setActiveStory}
                            />
                        ))
                    }
                </div>
            </div>

            {/* Posts */}
            <div className={styles.posts}>
                {posts === null
                    ? [1, 2].map(i => (
                        <div key={i} className={styles.postCard}>
                            <div style={{ display: 'flex', gap: 10, padding: '16px 16px 0', alignItems: 'center' }}>
                                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ width: '55%', height: 13, borderRadius: 4, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ width: '30%', height: 10, borderRadius: 4 }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ margin: 16, borderRadius: 12, aspectRatio: '1' }} />
                        </div>
                    ))
                    : posts.length === 0
                        ? (
                            <div className={styles.empty}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56" style={{ opacity: .3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                <div className={styles.emptyTitle}>Brak postów</div>
                                <div className={styles.emptySub}>Dodaj znajomych lub opublikuj swój pierwszy post!</div>
                            </div>
                        )
                        : posts.map(p => (
                            <PostCard
                                key={p.id}
                                post={p}
                                currentUserId={user?.id}
                                onLike={handleLike}
                                onComment={handleComment}
                                onDelete={handleDelete}
                            />
                        ))
                }
            </div>

            {/* FAB */}
            <button className={styles.fab} onClick={() => setShowNewPost(true)} aria-label="Nowy post">
                <IcPlus />
            </button>

            {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onPost={handlePost} />}
            {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
        </div>
    );
}
