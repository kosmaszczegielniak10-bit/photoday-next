'use client';
// app/app/albums/[albumId]/page.js — Single Album View (Masonry Grid)

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { getStorageUrl } from '@/lib/storage';
import styles from './albumId.module.css';

const IcArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const IcCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><polyline points="20 6 9 17 4 12" /></svg>;
const IcMore = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
const IcEdit = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
const IcImage = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;

export default function SingleAlbumPage({ params }) {
    const { albumId } = use(params);
    const router = useRouter();
    const showToast = useToast();
    const [album, setAlbum] = useState(null);
    const [entries, setEntries] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [selectionMode, setSelectionMode] = useState(null); // 'cover' | 'remove' | null

    useEffect(() => {
        // Fetch mock details or real data
        api.get(`/albums/${albumId}`).then(a => {
            setAlbum(a);
            setEditTitle(a.name || a.title || '');
            setEntries(a.photos || []);
        }).catch(err => {
            showToast('Błąd ładowania albumu', 'error');
            setEntries([]);
        });
    }, [albumId, showToast]);

    const handleSaveTitle = async () => {
        if (!editTitle.trim()) return;
        try {
            await api.patch(`/albums/${albumId}`, { title: editTitle.trim() });
            setAlbum(prev => ({ ...prev, name: editTitle.trim(), title: editTitle.trim() }));
            setIsEditingTitle(false);
            showToast('Zapisano nazwę', 'success');
        } catch {
            showToast('Błąd zapisu', 'error');
        }
    };

    const handlePhotoClick = async (photo) => {
        if (selectionMode === 'cover') {
            try {
                await api.patch(`/albums/${albumId}`, { cover_photo_path: photo.photo_path });
                setAlbum(prev => ({ ...prev, cover_photo_path: photo.photo_path }));
                setSelectionMode(null);
                showToast('Ustawiono nową okładkę', 'success');
            } catch {
                showToast('Błąd ustawiania okładki', 'error');
            }
        } else if (selectionMode === 'remove') {
            if (!confirm('Czy na pewno chcesz usunąć to zdjęcie z albumu?')) return;
            try {
                await api.delete(`/albums/${albumId}/photos?entryId=${photo.id}`);
                setEntries(prev => prev.filter(p => p.id !== photo.id));
                setAlbum(prev => ({ ...prev, count: Math.max(0, (prev.count || 0) - 1) }));
                showToast('Zdjęcie usunięte z albumu', 'success');
                if (entries.length <= 1) setSelectionMode(null); // Last photo removed
            } catch {
                showToast('Błąd usuwania zdjęcia', 'error');
            }
        } else {
            // Future: Open fullscreen photo viewer
        }
    };

    return (
        <div className={styles.page}>
            {/* Header matches reference image */}
            <div className={styles.pageHeader}>
                <button className={styles.iconBtn} onClick={() => selectionMode ? setSelectionMode(null) : router.back()} aria-label="Wróć">
                    <IcArrowLeft />
                </button>
                <div style={{ flex: 1 }} />
                {!selectionMode && (
                    <button className={styles.iconBtn} aria-label="Opcje" onClick={() => setShowOptions(true)}>
                        <IcMore />
                    </button>
                )}
            </div>

            <div className={styles.headerTitles}>
                {selectionMode === 'cover' ? (
                    <h1 className={styles.pageTitle} style={{ fontSize: 22, color: 'var(--accent-orange)' }}>Wybierz okładkę</h1>
                ) : selectionMode === 'remove' ? (
                    <h1 className={styles.pageTitle} style={{ fontSize: 22, color: 'var(--accent-red)' }}>Usuń z albumu</h1>
                ) : isEditingTitle ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            autoFocus
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="input"
                            style={{ fontSize: 28, fontWeight: 800, padding: '4px 8px', background: 'var(--bg-card)' }}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTitle()}
                            onBlur={handleSaveTitle}
                        />
                    </div>
                ) : (
                    <h1 className={styles.pageTitle} onClick={() => setIsEditingTitle(true)}>{album?.name || album?.title || 'Ładowanie...'}</h1>
                )}
                {!selectionMode && <p className={styles.pageSub}>{album?.count || entries?.length || 0} zdjęć</p>}
            </div>

            {/* Filter Pills (from reference image) */}
            <div className={styles.filtersScroll}>
                <button className={`${styles.filterPill} ${styles.filterActive}`}>Wszystko</button>
                <button className={styles.filterPill}>Ulubione</button>
                <button className={styles.filterPill}>Ostatnie</button>
                <button className={styles.filterPill}>Osoby</button>
            </div>

            {/* Masonry / Staggered Grid */}
            <div className={styles.grid}>
                {entries === null ? (
                    <div className={styles.emptyWrap}>Ładowanie zdjęć...</div>
                ) : entries.length === 0 ? (
                    <div className={styles.emptyWrap}>
                        <div className={styles.emptyText}>Album jest pusty</div>
                    </div>
                ) : (
                    entries.map((photo, i) => (
                        <div key={photo.id} className={styles.photoCard} onClick={() => handlePhotoClick(photo)} style={{
                            // Simulated masonry sizes for the demo
                            gridRowEnd: i % 3 === 0 ? 'span 2' : 'span 1',
                            cursor: selectionMode ? 'pointer' : 'default',
                            opacity: selectionMode && photo.photo_path === album?.cover_photo_path ? 0.5 : 1
                        }}>
                            {photo.photo_path ? (
                                <Image src={getStorageUrl(photo.photo_path)} alt="" fill className={styles.photoImg} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.photoPlaceholder} />
                            )}
                            {selectionMode === 'cover' && photo.photo_path === album?.cover_photo_path && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
                                    <IcCheck />
                                </div>
                            )}
                            {selectionMode === 'remove' && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.4)', zIndex: 10 }}>
                                    <IcTrash />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Selection/Action Bar (Floating) */}
            <div className={styles.floatingActionBar}>
                <button className={styles.actionFab} aria-label="Wybierz">
                    <IcCheck />
                </button>
            </div>

            {/* Options Modal */}
            {showOptions && (
                <div className="backdrop" onClick={() => setShowOptions(false)}>
                    <div className="bottom-sheet slide-up" onClick={e => e.stopPropagation()}>
                        <div className="sheet-handle" />
                        <h3 style={{ margin: '0 0 16px', fontSize: 18, textAlign: 'center' }}>Opcje albumu</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button
                                className="action-row"
                                onClick={() => { setShowOptions(false); setIsEditingTitle(true); }}
                            >
                                <div className="action-icon"><IcEdit /></div>
                                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Zmień nazwę</span>
                            </button>

                            <button
                                className="action-row"
                                onClick={() => {
                                    setShowOptions(false);
                                    setSelectionMode('cover');
                                }}
                            >
                                <div className="action-icon"><IcImage /></div>
                                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>Ustaw okładkę</span>
                            </button>

                            <button
                                className="action-row danger"
                                onClick={() => {
                                    setShowOptions(false);
                                    setSelectionMode('remove');
                                }}
                            >
                                <div className="action-icon" style={{ color: 'var(--accent-red)' }}><IcTrash /></div>
                                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600, color: 'var(--accent-red)' }}>Usuń z albumu</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
