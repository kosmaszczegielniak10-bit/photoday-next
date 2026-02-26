'use client';
// app/app/layout.js — Protected app shell with bottom navigation

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from './app.module.css';

// SVG Icons
const IcCalendar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const IcFeed = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IcCapture = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);
const IcMessages = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const IcProfile = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const IcUsers = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="22" height="22">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

const NAV_ITEMS = [
    { href: '/app/calendar', label: 'Kalendarz', Icon: IcCalendar },
    { href: '/app/feed', label: 'Znajomi', Icon: IcFeed },
    { href: '/app/capture', label: '', Icon: IcCapture, capture: true },
    { href: '/app/friends', label: 'Wiadomości', Icon: IcUsers },
    { href: '/app/profile', label: 'Profil', Icon: IcProfile },
];



export default function AppLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className={styles.splash}>
                <img src="/logo.svg" alt="PhotoDay Logo" className={styles.splashIcon} style={{ width: 120, height: 120 }} />
                <div className={styles.splashName}>PhotoDay</div>
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className={styles.shell}>
            {/* Top Logo Header */}
            <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center' }}>
                <img src="/logo.svg" alt="PhotoDay Logo" style={{ width: 44, height: 44 }} />
            </div>

            <main className={styles.main}>
                {children}
            </main>

            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    {NAV_ITEMS.map(({ href, label, Icon, capture }) => {
                        const isActive = pathname === href ||
                            (href === '/app/calendar' && pathname.startsWith('/app/albums'));

                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''} ${capture ? styles.navItemCapture : ''}`}
                                aria-label={label || 'Otwórz'}
                            >
                                <span className={styles.navIcon}><Icon /></span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
