import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('photoday_token')?.value;
    const { pathname } = request.nextUrl;

    // Fast path: if NO token at all, don't let them hit /app
    // We do NOT block /app if token EXISTS because it might be invalid. We let the server component natively redirect it to /auth.
    if (pathname.startsWith('/app') && !token) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    // Fast path: root URL
    if (pathname === '/') {
        return NextResponse.redirect(new URL(token ? '/app/calendar' : '/auth', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/app/:path*'],
};
