'use client';
// app/app/capture/page.js — Daily photo capture / journal entry creation

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import styles from './capture.module.css';

const MOODS = [
    { id: 'happy', Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> },
    { id: 'neutral', Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><circle cx="12" cy="12" r="10" /><line x1="8" y1="15" x2="16" y2="15" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> },
    { id: 'sad', Icon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg> }
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
                                key={m.id}
                                type="button"
                                className={`${styles.moodBtn} ${mood === m.id ? styles.moodActive : ''}`}
                                onClick={() => setMood(prev => prev === m.id ? '' : m.id)}
                            >
                                <m.Icon />
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

                <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
                    {saving ? 'Zapisywanie…' : 'Zapisz wpis'}
                </button>
            </div>
        </div>
    );
}
