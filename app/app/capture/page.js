'use client';
// app/app/capture/page.js — Daily photo capture / journal entry creation

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import styles from './capture.module.css';

const MOODS = [
    '✨', '📸', '🚀', '🔥', '❤️', '😅', '🥺', '🎉',
    '💪', '☕️', '🍕', '☀️', '🌧️', '🎵', '✈️', '💻',
    '😴', '🥳', '😡', '🥶', '🤯', '🤠', '👽', '👻',
    '🎨', '📚', '🧘', '🏋️', '🥂', '🍿'
];

export default function CapturePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dateParam = searchParams.get('date');
    const showToast = useToast();

    const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    const [date, setDate] = useState(dateParam || today);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [description, setDescription] = useState('');
    const [mood, setMood] = useState('');
    const [privacy, setPrivacy] = useState('private');
    const [saving, setSaving] = useState(false);
    const [existingEntry, setExisting] = useState(null);

    const fileInputRef = useRef(null);

    // Load existing entry for date
    useEffect(() => {
        api.get(`/entries/${date}`)
            .then(e => {
                if (e) {
                    setExisting(e);
                    setDescription(e.description || '');
                    setMood(e.mood || '');
                    setPrivacy(e.privacy || 'private');
                    if (e.photo_path) {
                        setPhotoPreview(e.photo_path.startsWith('http') ? e.photo_path : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${e.photo_path}`);
                    }
                }
            })
            .catch(() => { });
    }, [date]);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }, []);

    const handleSave = async () => {
        if (!photoPreview && !existingEntry?.photo_path) {
            showToast('Wybierz zdjęcie przed zapisaniem', 'error');
            return;
        }
        setSaving(true);
        try {
            let photoData = undefined;
            if (photoFile) {
                // Convert to base64 for upload
                photoData = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = e => res(e.target.result);
                    reader.onerror = rej;
                    reader.readAsDataURL(photoFile);
                });
            }

            await api.post('/entries', {
                date,
                description,
                mood,
                privacy,
                ...(photoData ? { photoPath: photoData } : {}),
            });

            showToast('Wpis zapisany', 'success');
            router.push('/app/calendar');
        } catch (err) {
            showToast(err.message || 'Błąd zapisywania', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.back} onClick={() => router.back()}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <h1 className={styles.title}>{existingEntry ? 'Edytuj wpis' : 'Nowy wpis'}</h1>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={styles.datePicker} />
            </div>

            {/* Photo Area */}
            <div
                className={styles.photoArea}
                onClick={() => fileInputRef.current?.click()}
                style={{ backgroundImage: photoPreview ? `url(${photoPreview})` : undefined }}
            >
                {!photoPreview && (
                    <div className={styles.photoPlaceholder}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: .5 }}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Dotknij aby dodać zdjęcie</span>
                    </div>
                )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />

            <div className={styles.form}>
                {/* Description */}
                <textarea
                    className={`input ${styles.textarea}`}
                    placeholder="Opisz swój dzień..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                />

                {/* Mood */}
                <div>
                    <label className={styles.label}>Nastrój</label>
                    <div className={styles.moods}>
                        {MOODS.map(m => (
                            <button
                                key={m}
                                type="button"
                                className={`${styles.moodBtn} ${mood === m ? styles.moodActive : ''}`}
                                onClick={() => setMood(prev => prev === m ? '' : m)}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Privacy */}
                <div>
                    <label className={styles.label}>Widoczność</label>
                    <div className={styles.privacyRow}>
                        {['private', 'friends', 'public'].map(p => (
                            <button
                                key={p}
                                type="button"
                                className={`${styles.privacyBtn} ${privacy === p ? styles.privacyActive : ''}`}
                                onClick={() => setPrivacy(p)}
                            >
                                {p === 'private' ? 'Tylko ja' : p === 'friends' ? 'Znajomi' : 'Publiczny'}
                            </button>
                        ))}
                    </div>
                </div>

                <button className={`btn btn-primary btn-full ${saving ? 'opacity-50' : ''}`} onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <svg className="spinner" viewBox="0 0 50 50" style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }}><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                            Zapisywanie wpisu...
                        </div>
                    ) : 'Zapisz wpis'}
                </button>
            </div>

            {/* Global Spinner overlay block to prevent tapping out */}
            {saving && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="sleek-card" style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <svg className="spinner" viewBox="0 0 50 50" style={{ width: 40, height: 40, animation: 'spin 1s linear infinite' }}><circle cx="25" cy="25" r="20" fill="none" stroke="var(--accent-orange)" strokeWidth="5" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Przesyłanie zdjęcia...</span>
                    </div>
                </div>
            )}
            <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
