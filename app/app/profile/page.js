'use client';
// app/app/profile/page.js — User profile with Avatar upload and Settings link

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getStorageUrl } from '@/lib/storage';
import styles from './profile.module.css';

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    const av = user?.avatar_path
        ? getStorageUrl(user.avatar_path)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || 'U')}&size=120&background=random&color=fff`;

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Twój Profil</h1>
            </div>

            {/* Avatar + name */}
            <div className={styles.hero}>
                <div className={styles.avatarWrap} style={{ position: 'relative' }}>
                    <Image src={av} alt="" className={styles.avatar} width={120} height={120} unoptimized={av.includes('ui-avatars')} />
                </div>

                <h1 className={styles.name}>{user?.display_name}</h1>
                <p className={styles.username}>@{user?.username}</p>
                {user?.bio && <p className={styles.bio}>{user.bio}</p>}

                <button className={`btn btn-ghost ${styles.editBtn}`} onClick={() => router.push('/app/profile/edit')} style={{ marginTop: 12 }}>
                    Edytuj profil
                </button>
            </div>

            {/* Menu */}
            <div className={styles.menu}>
                <div className={styles.menuSection}>
                    <button className={styles.menuItem} onClick={() => router.push('/app/friends')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Moi Znajomi</span>
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
                    <button className={styles.menuItem} onClick={() => router.push('/app/profile/settings')}>
                        <span className={styles.menuIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        </span>
                        <span className={styles.menuLabel}>Ustawienia</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ opacity: .4 }}><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
