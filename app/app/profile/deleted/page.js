'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { getStorageUrl } from '@/lib/storage';

const IcArrowLeft = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
const IcTrash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6v10" /><path d="M15 6v10" /><path d="M10 3h4v3h-4z" /></svg>;
const IcRestore = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>;

export default function DeletedPage() {
    const router = useRouter();
    const showToast = useToast();
    const [entries, setEntries] = useState(null);

    useEffect(() => {
        api.get('/entries/deleted')
            .then(data => setEntries(data || []))
            .catch(() => {
                setEntries([]);
                showToast('Błąd ładowania usuniętych wpisów', 'error');
            });
    }, [showToast]);

    const handleRestore = async (id) => {
        try {
            await api.post('/entries/deleted', { id });
            setEntries(prev => prev.filter(e => e.id !== id));
            showToast('Wpis przywrócony', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handlePermanentDelete = async (id) => {
        if (!confirm('Czy na pewno chcesz trwale usunąć ten wpis? Tej operacji nie można cofnąć.')) return;
        try {
            await api.delete('/entries/deleted', { id });
            setEntries(prev => prev.filter(e => e.id !== id));
            showToast('Wpis trwale usunięty', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', gap: 16 }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8, margin: '-8px' }}>
                    <IcArrowLeft />
                </button>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Ostatnio usunięte</h1>
            </div>

            <div style={{ padding: '0 20px', marginTop: 16 }}>
                {entries === null ? (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
                        ))}
                    </div>
                ) : entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                        <div style={{ marginBottom: 16, opacity: 0.5 }}><IcTrash /></div>
                        Brak usuniętych wpisów.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {entries.map(entry => (
                            <div key={entry.id} className="sleek-card" style={{ display: 'flex', gap: 16, padding: 12, alignItems: 'center' }}>
                                {entry.photo_path ? (
                                    <Image src={getStorageUrl(entry.photo_path)} alt="" width={80} height={80} style={{ borderRadius: 12, objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 80, height: 80, background: 'var(--bg-secondary)', borderRadius: 12 }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        {new Date(entry.deleted_at).toLocaleDateString('pl-PL')}
                                    </div>
                                    <div style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {entry.description || 'Brak opisu'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => handleRestore(entry.id)} className="btn btn-ghost" style={{ padding: 10, borderRadius: '50%' }} title="Przywróć">
                                        <IcRestore />
                                    </button>
                                    <button onClick={() => handlePermanentDelete(entry.id)} className="btn btn-primary" style={{ padding: 10, borderRadius: '50%', background: 'var(--accent-red)', color: '#fff' }} title="Usuń trwale">
                                        <IcTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
