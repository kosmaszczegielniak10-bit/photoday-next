'use client';

export default function Error({ error, reset }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60vh', padding: '24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--text-primary)' }}>Coś poszło nie tak</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Wystąpił błąd podczas ładowania tego widoku.
            </p>
            <button
                onClick={() => reset()}
                className="btn btn-primary"
            >
                Spróbuj ponownie
            </button>
        </div>
    );
}
