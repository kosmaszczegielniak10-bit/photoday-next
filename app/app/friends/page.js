'use client';
// app/app/friends/page.js — Friends & People Search

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { getStorageUrl } from '@/lib/storage';
import { useRouter } from 'next/navigation';
import styles from './friends.module.css';

// ── Icons ──────────────────────────────────────────
const IcSearch = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const IcUserPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>;
const IcUserCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>;
const IcX = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IcCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="20 6 9 17 4 12" /></svg>;

// ── Helpers ────────────────────────────────────────
function avatarUrl(path, name) {
    if (path?.startsWith('http')) return path;
    if (path) return getStorageUrl(path);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&size=60&background=random&color=fff`;
}

export default function FriendsPage() {
    const { user } = useAuth();
    const showToast = useToast();
    const router = useRouter();

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [friends, setFriends] = useState(null);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [fData, pData] = await Promise.all([
                api.get('/friends'),
                api.get('/friends/pending')
            ]);
            setFriends(fData || []);
            setPending(pData || []);
        } catch {
            setFriends([]);
            showToast('Błąd ładowania znajomych', 'error');
        } finally { setLoading(false); }
    }, [showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    // Search with debounce
    useEffect(() => {
        if (query.trim().length < 2) { setSearchResults(null); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
                setSearchResults(res);
            } catch (err) { showToast(err.message, 'error'); }
        }, 300);
        return () => clearTimeout(t);
    }, [query, showToast]);

    // ── Handlers ─────────────────────────────────────
    const handleAdd = async (uid, name) => {
        try {
            await api.post(`/friends/request/${uid}`);
            showToast(`Zaproszenie wysłane do ${name}!`, 'success');
            setSearchResults(prev => prev.map(u => u.id === uid ? { ...u, friendStatus: 'sent' } : u));
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleAccept = async (reqId) => {
        try {
            await api.post(`/friends/accept/${reqId}`);
            showToast('Zaproszenie zaakceptowane!', 'success');
            setSearchResults(null);
            setQuery('');
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleReject = async (reqId) => {
        try {
            await api.post(`/friends/reject/${reqId}`);
            showToast('Zaproszenie odrzucone', 'success');
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleRemove = async (friendshipId, name) => {
        if (!confirm(`Usunąć ${name} ze znajomych?`)) return;
        try {
            await api.delete(`/friends/${friendshipId}`);
            showToast(`${name} usunięty ze znajomych`, 'success');
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    // ── Render Helpers ───────────────────────────────
    const renderUserCard = (u, isSearch) => (
        <div key={u.id || u.friendshipId} className={styles.userCard} onClick={() => router.push(`/app/profile/${u.id || u.requesterId || u.userId}`)}>
            <img src={avatarUrl(u.avatarPath || u.avatar, u.displayName || u.name)} alt="" className={styles.avatar} />
            <div className={styles.userInfo}>
                <div className={styles.userName}>{u.displayName || u.name}</div>
                <div className={styles.userBio}>{u.bio || `@${u.username}`}</div>
            </div>

            {/* Actions */}
            <div className={styles.actions} onClick={e => e.stopPropagation()}>
                {isSearch ? (
                    u.friendStatus === 'friends' ? <button className={`${styles.btn} ${styles.btnAdded}`} disabled><IcCheck /> Znajomy</button> :
                        u.friendStatus === 'sent' ? <button className={`${styles.btn} ${styles.btnAdded}`} disabled>Wysłano</button> :
                            u.friendStatus === 'received' ? <button className={`${styles.btn} ${styles.btnAccept}`} onClick={() => handleAccept(u.friendshipId)}>Akceptuj</button> :
                                <button className={styles.btn} onClick={() => handleAdd(u.id, u.name)}>+ Dodaj</button>
                ) : u.isPending ? (
                    <>
                        <button className={`${styles.btn} ${styles.btnAccept}`} onClick={() => handleAccept(u.id)}>Akceptuj</button>
                        <button className={styles.btn} onClick={() => handleReject(u.id)}>Odrzuć</button>
                    </>
                ) : (
                    <button className={styles.btnIcon} onClick={() => handleRemove(u.friendshipId, u.displayName)}><IcX /></button>
                )}
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Znajomi</h1>
            </div>

            {/* Search */}
            <div className={styles.searchSection}>
                <div className={styles.searchBar}>
                    <div className={styles.searchIcon}><IcSearch /></div>
                    <input
                        className={styles.searchInput}
                        placeholder="Szukaj ludzi…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && <button className={styles.searchClear} onClick={() => setQuery('')}><IcX /></button>}
                </div>

                {searchResults && (
                    <div className={styles.searchResults}>
                        {searchResults.length === 0
                            ? <div className={styles.empty}>Nie znaleziono nikogo</div>
                            : searchResults.map(u => renderUserCard(u, true))
                        }
                    </div>
                )}
            </div>

            {/* Pending Requests */}
            {!searchResults && pending.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Oczekujące zaproszenia</h2>
                    <div className={styles.list}>
                        {pending.map(p => renderUserCard({ ...p, isPending: true }, false))}
                    </div>
                </div>
            )}

            {/* Friends List */}
            {!searchResults && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Twoi znajomi</h2>
                    <div className={styles.list}>
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className={styles.userCard}>
                                    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div className="skeleton" style={{ width: '50%', height: 14, borderRadius: 4 }} />
                                        <div className="skeleton" style={{ width: '30%', height: 10, borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))
                        ) : friends?.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}><IcUsers /></div>
                                <div className={styles.emptyText}>Wyszukaj ludzi i dodaj ich do znajomych</div>
                            </div>
                        ) : (
                            friends?.map(f => renderUserCard(f, false))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
