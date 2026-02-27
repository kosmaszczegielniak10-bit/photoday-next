'use client';
// app/app/albums/page.js — The modern stacked albums list

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { getStorageUrl } from '@/lib/storage';
import styles from './albums.module.css';

const IcFolder = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;
const IcPlus = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const IcArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;

export default function AlbumsPage() {
    const [albums, setAlbums] = useState(null);
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const router = useRouter();
    const showToast = useToast();

    useEffect(() => {
        api.get('/albums')
            .then(data => setAlbums(data || []))
            .catch(() => {
                setAlbums([]);
                showToast('Błąd ładowania albumów', 'error');
            });
    }, [showToast]);

    const handleCreate = async () => {
        if (!newName.trim() || creating) return;
        setCreating(true);
        try {
            const album = await api.post('/albums', { name: newName.trim() });
            setAlbums(prev => [album, ...prev]);
            setShowNew(false);
            setNewName('');
            router.push(`/app/albums/${album.id}`);
        } catch (err) {
            showToast(err.message, 'error');
            setCreating(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <button className={styles.iconBtn} onClick={() => router.back()} aria-label="Wróć">
                    <IcArrowLeft />
                </button>
                <div style={{ flex: 1 }} />
                <button className={styles.iconBtn} onClick={() => setShowNew(true)} aria-label="Nowy Album">
                    <IcPlus />
                </button>
            </div>

            <div className={styles.headerTitles}>
                <h1 className={styles.pageTitle}>Twoje Albumy</h1>
                <p className={styles.pageSub}>{albums?.length || 0} albumów</p>
            </div>

            <div className={styles.grid}>
                {albums === null ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={`skel-${i}`} className={styles.albumCard} style={{ cursor: 'default' }}>
                            <div className={styles.stackPreview}>
                                <div className={`${styles.stackCard} ${styles.stackBack2}`} style={{ border: 'none' }} />
                                <div className={`${styles.stackCard} ${styles.stackBack1}`} style={{ border: 'none' }} />
                                <div className={`${styles.stackCard} ${styles.stackFront} skeleton`} style={{ border: 'none' }} />
                            </div>
                            <div className={styles.albumInfo}>
                                <div className="skeleton" style={{ height: 16, width: '70%', borderRadius: 4, marginBottom: 6 }} />
                                <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
                            </div>
                        </div>
                    ))
                ) : albums.length === 0 ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.emptyIcon}><IcFolder /></div>
                        <div className={styles.emptyText}>Nie masz jeszcze żadnych albumów.</div>
                    </div>
                ) : (
                    albums.map(album => (
                        <div key={album.id} className={styles.albumCard} onClick={() => router.push(`/app/albums/${album.id}`)}>
                            <div className={styles.stackPreview}>
                                {/* Mock stacked cards effect */}
                                <div className={`${styles.stackCard} ${styles.stackBack2}`} />
                                <div className={`${styles.stackCard} ${styles.stackBack1}`} />
                                <div className={`${styles.stackCard} ${styles.stackFront}`}>
                                    {album.cover_photo_path ? (
                                        <Image src={getStorageUrl(album.cover_photo_path)} alt="" className={styles.coverImg} width={300} height={400} />
                                    ) : (
                                        <div className={styles.placeholderCover}><IcFolder /></div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.albumInfo}>
                                <div className={styles.albumName}>{album.name}</div>
                                <div className={styles.albumCount}>{album.album_entries?.[0]?.count || 0} zdjęć</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Album Modal */}
            {showNew && (
                <div className={styles.modalBackdrop} onClick={() => setShowNew(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>Nowy Album</h3>
                        <input
                            autoFocus
                            className="input"
                            placeholder="Nazwa albumu (np. Wakacje)"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            style={{ width: '100%', marginBottom: 16 }}
                        />
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button className="btn btn-ghost" onClick={() => setShowNew(false)}>Anuluj</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
                                {creating ? 'Tworzenie…' : 'Utwórz'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
