'use client';
// app/app/profile/edit/page.js
import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { getStorageUrl } from '@/lib/storage';
import styles from '../profile.module.css';

export default function EditProfilePage() {
    const { user, setUser } = useAuth();
    const router = useRouter();
    const showToast = useToast();
    const fileRef = useRef(null);

    const [displayName, setDisplayName] = useState(user?.display_name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const av = user?.avatar_path
        ? getStorageUrl(user.avatar_path)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || 'U')}&size=120&background=random&color=fff`;

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const photoData = await new Promise((res, rej) => {
                const r = new FileReader(); r.onload = ev => res(ev.target.result); r.onerror = rej; r.readAsDataURL(file);
            });

            const { avatarPath } = await api.post('/auth/avatar', { photoData });

            setUser({ ...user, avatar_path: avatarPath });
            showToast('Zdjęcie profilowe zaktualizowane!', 'success');
        } catch (err) {
            showToast(err.message || 'Błąd wgrywania zdjęcia', 'error');
        } finally {
            setUploading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const updated = await api.patch('/auth/me', { displayName, bio });
            setUser({ ...user, ...updated });
            showToast('Profil zapisany!', 'success');
            setTimeout(() => router.back(), 500);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <button className={styles.btnIcon} onClick={() => router.back()} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 className={styles.pageTitle} style={{ flex: 1, textAlign: 'center', marginRight: 40 }}>Edytuj Profil</h1>
            </div>

            <div className={styles.hero} style={{ padding: '20px 20px 0' }}>
                <div
                    className={styles.avatarWrap}
                    onClick={() => !uploading && fileRef.current?.click()}
                    style={{ cursor: 'pointer', position: 'relative', margin: '0 auto 20px' }}
                >
                    <Image src={av} alt="" className={styles.avatar} width={120} height={120} style={{ opacity: uploading ? 0.5 : 1 }} unoptimized={av.includes('ui-avatars')} />
                    <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--accent-orange)', color: '#fff', borderRadius: '50%', padding: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
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

                <button className="btn btn-primary btn-full" onClick={saveSettings} disabled={saving} style={{ marginTop: 10 }}>
                    {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
            </div>
        </div>
    );
}
