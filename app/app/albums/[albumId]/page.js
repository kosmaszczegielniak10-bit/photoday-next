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

export default function SingleAlbumPage({ params }) {
    const { albumId } = use(params);
    const router = useRouter();
    const showToast = useToast();
    const [album, setAlbum] = useState(null);
    const [entries, setEntries] = useState(null);

    useEffect(() => {
        // Fetch mock details or real data
        api.get(`/albums/${albumId}`).then(a => {
            setAlbum(a);
            setEntries(a.photos || []);
        }).catch(err => {
            showToast('Błąd ładowania albumu', 'error');
            setEntries([]);
        });
    }, [albumId, showToast]);

    return (
        <div className={styles.page}>
            {/* Header matches reference image */}
            <div className={styles.pageHeader}>
                <button className={styles.iconBtn} onClick={() => router.back()} aria-label="Wróć">
                    <IcArrowLeft />
                </button>
                <button className={styles.iconBtn} aria-label="Opcje">
                    <IcMore />
                </button>
            </div>

            <div className={styles.headerTitles}>
                <h1 className={styles.pageTitle}>{album?.name || 'Ładowanie...'}</h1>
                <p className={styles.pageSub}>{album?.count || entries?.length || 0} zdjęć</p>
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
                        <div key={photo.id} className={styles.photoCard} style={{
                            // Simulated masonry sizes for the demo
                            gridRowEnd: i % 3 === 0 ? 'span 2' : 'span 1'
                        }}>
                            {photo.photo_path ? (
                                <Image src={getStorageUrl(photo.photo_path)} alt="" fill className={styles.photoImg} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className={styles.photoPlaceholder} />
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
        </div>
    );
}
