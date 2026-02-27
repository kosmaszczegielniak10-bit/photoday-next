'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import styles from '../profile.module.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const showToast = useToast();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Form Stats
    const [entryCount, setEntryCount] = useState('...');
    const [reminderEnabled, setReminder] = useState(false);
    const [reminderTime, setReminderTime] = useState('19:00');
    const [pin, setPin] = useState(null);

    useEffect(() => {
        setMounted(true);
        // Load initial local settings matching Railway
        setReminder(localStorage.getItem('reminderEnabled') === 'true');
        setReminderTime(localStorage.getItem('reminderTime') || '19:00');
        setPin(localStorage.getItem('appPin'));

        // Fetch correct real entry count
        api.get('/profile/stats').then(res => setEntryCount(res.total || 0)).catch(() => setEntryCount('0'));
    }, []);
    const handleLogout = async () => {
        await logout();
        router.replace('/auth');
    };

    const handleClearData = async () => {
        if (confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane? Wszystkie zdjęcia i wpisy zostaną trwale usunięte.')) {
            localStorage.clear();
            showToast('Wszystkie dane usunięte', 'success');
            setEntryCount('0');
        }
    };

    const handlePinToggle = () => {
        if (pin) {
            if (confirm('Czy chcesz usunąć kod PIN?')) {
                localStorage.removeItem('appPin');
                setPin(null);
                showToast('PIN usunięty');
            }
        } else {
            const newPin = prompt('Wprowadź nowy 4-cyfrowy kod PIN:');
            if (newPin && newPin.length === 4 && !isNaN(newPin)) {
                localStorage.setItem('appPin', newPin);
                setPin(newPin);
                showToast('PIN zapisany');
            } else if (newPin !== null) {
                alert('PIN musi składać się z 4 cyfr.');
            }
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <button className={styles.btnIcon} onClick={() => router.back()} style={{ marginRight: 'auto', background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 className={styles.pageTitle} style={{ marginRight: 'auto' }}>Ustawienia Aplikacji</h1>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 32 }}>

                {/* Sekcja: Wygląd */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>Wygląd</h2>
                    <div className="sleek-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Ciemny motyw</div>
                        </div>
                        {mounted && (
                            <div onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: 50, height: 28, background: theme === 'dark' ? 'var(--accent-orange)' : 'var(--border)', borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <div style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: theme === 'dark' ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sekcja: Przypomnienia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>Przypomnienia</h2>
                    <div className="sleek-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Codzienne przypomnienie</div>
                            </div>
                            <div onClick={() => { const val = !reminderEnabled; setReminder(val); localStorage.setItem('reminderEnabled', val); }} style={{ width: 50, height: 28, background: reminderEnabled ? 'var(--accent-orange)' : 'var(--border)', borderRadius: 14, position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                <div style={{ width: 24, height: 24, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, left: reminderEnabled ? 24 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Godzina przypomnienia</div>
                            </div>
                            <input type="time" value={reminderTime} onChange={e => { setReminderTime(e.target.value); localStorage.setItem('reminderTime', e.target.value); }} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 600, color: 'var(--accent-orange)', cursor: 'pointer' }} />
                        </div>
                    </div>
                </div>

                {/* Sekcja: Dane */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>Dane</h2>
                    <div className="sleek-card" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Liczba wpisów</div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-secondary)' }}>{entryCount}</div>
                        </div>

                        <div onClick={handleClearData} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0', cursor: 'pointer', color: 'var(--accent-red)' }}>
                            <div>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>Wyczyść dane</div>
                        </div>
                    </div>
                </div>

                {/* Sekcja: Bezpieczeństwo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 8 }}>Bezpieczeństwo</h2>
                    <div className="sleek-card" onClick={handlePinToggle} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ color: 'var(--text-secondary)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>Kod PIN do Ukrytego Folderu</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: pin ? 'var(--accent-orange)' : 'var(--text-tertiary)' }}>{pin ? 'Ustawiony' : 'Nieustawiony'}</div>
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
