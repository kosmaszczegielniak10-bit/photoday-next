import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('photoday_token')?.value;
    const { pathname } = request.nextUrl;

    // Protect /app routes
    if (pathname.startsWith('/app')) {
        if (!token) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
    }

    // Redirect logged-in users away from auth / landing
    if (pathname.startsWith('/auth') || pathname === '/') {
        if (token) {
            return NextResponse.redirect(new URL('/app/calendar', request.url));
        }
    }

    // If on root without token, redirect to auth
    if (pathname === '/' && !token) {
        return NextResponse.redirect(new URL('/auth', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/app/:path*', '/auth'],
};
