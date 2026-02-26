import AppShell from './AppShell';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({ children }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('photoday_token')?.value;

    // Natively redirect to auth BEFORE rendering any UI or data fetches if token is missing/invalid
    if (!token || !verifyToken(token)) {
        redirect('/auth');
    }

    return <AppShell>{children}</AppShell>;
}
