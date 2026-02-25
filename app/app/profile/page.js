'use client';
// app/app/profile/page.js — User profile with stats, settings, logout

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { getStorageUrl } from '@/lib/storage';
import styles from './profile.module.css';

export default function ProfilePage() {
    const { user, setUser, logout } = useAuth();
    const showToast = useToast();
    const router = useRouter();

    const [editing, setEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);

    const av = user?.avatar_path
        ? getStorageUrl(user.avatar_path)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || 'U')}&size=120&background=random&color=fff`;

    const saveProfile = async () => {
        setSaving(true);
        try {
            const updated = await api.patch('/auth/me', { displayName, bio });
            setUser(updated);
            setEditing(false);
            showToast('Profil zaktualizowany ✓', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/auth');
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Profil</h1>
            </div>

            {/* Avatar + name */}
            <div className={styles.hero}>
                <div className={styles.avatarWrap}>
                    <img src={av} alt="" className={styles.avatar} />
                </div>
                {!editing ? (
                    <>
                        <h1 className={styles.name}>{user?.display_name}</h1>
                        <p className={styles.username}>@{user?.username}</p>
                        {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                    </>
                ) : (
                    <div className={styles.editForm}>
                        <input
                            className="input"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Imię / pseudonim"
                        />
                        <textarea
                            className={`input ${styles.bioInput}`}
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Bio..."
                            rows={3}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-ghost btn-full" onClick={() => setEditing(false)}>Anuluj</button>
                            <button className="btn btn-teal btn-full" onClick={saveProfile} disabled={saving}>
                                {saving ? 'Zapisywanie…' : 'Zapisz'}
                            </button>
                        </div>
                    </div>
                )}
                {!editing && (
                    <button className={`btn btn-ghost ${styles.editBtn}`} onClick={() => setEditing(true)}>
                        Edytuj profil
                    </button>
                )}
            </div>

            {/* Menu */}
            <div className={styles.menu}>
                <div className={styles.menuSection}>
                    <button className={styles.menuItem} onClick={() => router.push('/app/friends')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Znajomi</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: .4 }}><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <button className={styles.menuItem} onClick={() => router.push('/app/albums')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Albumy</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: .4 }}><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <button className={styles.menuItem} onClick={() => showToast('Usunięte wpisy (Wkrótce)', 'info')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Usunięte</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: .4 }}><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                    <button className={styles.menuItem} onClick={() => showToast('Ustawienia (Wkrótce)', 'info')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Ustawienia</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: .4 }}><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>

                <div className={styles.menuSection}>
                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Wyloguj się</span>
                    </button>
                    <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => { if (window.confirm('Czy na pewno chcesz usunąć to konto i wszystkie swoje dane? Ta akcja jest nieodwracalna.')) handleLogout(); }}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Usuń konto</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
