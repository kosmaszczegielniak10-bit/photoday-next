import AuthClient from './AuthClient';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('photoday_token')?.value;

    // Natively redirect to app if already firmly authenticated
    if (token && verifyToken(token)) {
        redirect('/app/calendar');
    }

    return <AuthClient />;
}
