'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { getStorageUrl } from '@/lib/storage';
import styles from '../profile.module.css';

// SVG Icons
const IcHeart = ({ filled }) => filled
    ? <svg viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
const IcUserCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
const IcUserPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
const IcUserMinus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;

function avatarUrl(path, name) {
    if (path?.startsWith('http')) return path;
    if (path) return getStorageUrl(path);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=120&background=random&color=fff`;
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const showToast = useToast();

    const targetId = params.id;

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [friendship, setFriendship] = useState({ status: 'none' });

    const loadProfile = useCallback(async () => {
        if (!targetId) return;
        if (String(currentUser?.id) === String(targetId)) {
            router.replace('/app/profile');
            return;
        }

        try {
            const data = await api.get(`/profile/${targetId}`);
            setProfile(data.user);
            setFriendship(data.friendship);
            setPosts(data.posts || []);
        } catch (err) {
            showToast('Nie udało się załadować profilu', 'error');
            router.back();
        } finally {
            setLoading(false);
        }
    }, [targetId, currentUser, router, showToast]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const handleAction = async () => {
        try {
            if (friendship.status === 'none') {
                await api.post(`/friends/request/${targetId}`);
                showToast('Zaproszenie wysłane', 'success');
                setFriendship(prev => ({ ...prev, status: 'pending_sent' }));
            } else if (friendship.status === 'pending_received') {
                await api.post(`/friends/accept/${friendship.reqId}`);
                showToast('Zaproszenie zaakceptowane!', 'success');
                setFriendship(prev => ({ ...prev, status: 'friends' }));
            } else if (friendship.status === 'friends') {
                if (!confirm(`Usunąć ${profile.display_name} z listy znajomych?`)) return;
                await api.delete(`/friends/${friendship.friendshipId}`);
                showToast('Usunięto znajomego', 'success');
                setFriendship({ status: 'none', reqId: null, friendshipId: null });
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.pageHeader}>
                    <button className={styles.btnIcon} onClick={() => router.back()} style={{ marginRight: 'auto' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: 150, height: 24, borderRadius: 8 }} />
                    <div className="skeleton" style={{ width: 100, height: 16, borderRadius: 6 }} />
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const av = avatarUrl(profile.avatar_path, profile.display_name || profile.username);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <button className={styles.btnIcon} onClick={() => router.back()} style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
            </div>

            <div className={styles.hero}>
                <Image src={av} alt="" className={styles.avatar} width={100} height={100} unoptimized={av.includes('ui-avatars')} />
                <h1 className={styles.name}>{profile.display_name}</h1>
                <p className={styles.username}>@{profile.username}</p>
                {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

                <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {friendship.status === 'friends' ? (
                        <button className="btn btn-ghost" onClick={handleAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <IcUserCheck /> Znajomi
                        </button>
                    ) : friendship.status === 'pending_sent' ? (
                        <button className="btn btn-ghost" disabled style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: 0.7 }}>
                            Wysłano zaproszenie
                        </button>
                    ) : friendship.status === 'pending_received' ? (
                        <button className="btn btn-primary" onClick={handleAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <IcUserPlus /> Akceptuj zaproszenie
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleAction} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <IcUserPlus /> Dodaj do znajomych
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.postsSection} style={{ padding: 20 }}>
                {posts.length === 0 ? (
                    <div className={styles.empty} style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ marginBottom: 16 }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p>{friendship.status === 'friends' ? 'Ten użytkownik nie opublikował jeszcze żadnych postów.' : 'Brak publicznych postów.'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                        {posts.map(post => (
                            <div key={post.id} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
                                {post.photo_path && (
                                    <Image src={getStorageUrl(post.photo_path)} alt="" fill style={{ objectFit: 'cover' }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
