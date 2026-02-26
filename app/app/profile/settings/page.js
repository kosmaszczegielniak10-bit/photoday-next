'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import styles from '../profile.module.css';

export default function SettingsPage() {
    const { user, setUser, logout } = useAuth();
    const router = useRouter();
    const showToast = useToast();

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);

    const saveSettings = async () => {
        setSaving(true);
        try {
            const updated = await api.patch('/auth/me', { displayName, bio });
            setUser(updated);
            showToast('Ustawienia zapisane!', 'success');
            setTimeout(() => router.back(), 500);
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
            <div className={styles.pageHeader}>
                <button className={styles.btnIcon} onClick={() => router.back()} style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 className={styles.pageTitle} style={{ marginRight: 'auto' }}>Ustawienia</h1>
            </div>

            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Imię / pseudonim</label>
                    <input
                        className="input"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Imię / pseudonim"
                    />
                </div>

                <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Bio</label>
                    <textarea
                        className="input"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="O mnie..."
                        rows={4}
                    />
                </div>

                <button className="btn btn-primary" onClick={saveSettings} disabled={saving} style={{ marginTop: 10 }}>
                    {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className={styles.menuSection} style={{ marginTop: 40, padding: '0 20px' }}>
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleLogout} style={{ width: '100%' }}>
                    <span className={styles.menuIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    </span>
                    <span className={styles.menuLabel}>Wyloguj się</span>
                </button>
                <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => { if (window.confirm('Czy na pewno chcesz usunąć to konto?')) handleLogout(); }} style={{ width: '100%', marginTop: 10 }}>
                    <span className={styles.menuIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>
                    </span>
                    <span className={styles.menuLabel}>Usuń konto</span>
                </button>
            </div>
        </div>
    );
}
