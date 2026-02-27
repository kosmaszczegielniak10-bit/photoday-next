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

    const [theme, setTheme] = useState('light');
    const [notifications, setNotifications] = useState(true);

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
                <h1 className={styles.pageTitle} style={{ marginRight: 'auto' }}>Ustawienia Aplikacji</h1>
            </div>

            <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Theme Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flexShrink: 0, width: 40, height: 40, background: 'var(--accent-orange)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Motyw Ciemny</div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Przełącz wygląd aplikacji</div>
                        </div>
                    </div>
                    {/* Dummy switch */}
                    <div onClick={() => { setTheme(t => t === 'light' ? 'dark' : 'light'); showToast('Zmiana motywu wkrótce', 'info'); }} style={{ width: 50, height: 28, background: theme === 'dark' ? 'var(--accent-orange)' : 'var(--border)', borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <div style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: theme === 'dark' ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>

                {/* Notifications Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flexShrink: 0, width: 40, height: 40, background: 'var(--accent-indigo)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        </div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Powiadomienia Push</div>
                            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Nowe wpisy znajomych</div>
                        </div>
                    </div>
                    {/* Dummy switch */}
                    <div onClick={() => setNotifications(n => !n)} style={{ width: 50, height: 28, background: notifications ? 'var(--accent-orange)' : 'var(--border)', borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                        <div style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: notifications ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
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
