import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request) {
    const { pathname } = request.nextUrl;

    // Skip for auth routes, super-admin routes, and static assets
    if (
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/super-admin') ||
        pathname.startsWith('/super-admin') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Only enforce on company-level routes
    const isCompanyRoute =
        pathname.startsWith('/api/') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/trips') ||
        pathname.startsWith('/bookings');

    if (!isCompanyRoute) {
        return NextResponse.next();
    }

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // Not logged in — let NextAuth handle the redirect
    if (!token) {
        return NextResponse.next();
    }

    // Super admins are never suspended
    if (token.role === 'super_admin') {
        return NextResponse.next();
    }

    // Check company suspension status via internal API
    if (token.company_id) {
        try {
            const baseUrl = request.nextUrl.origin;
            const res = await fetch(`${baseUrl}/api/super-admin/internal/company-status?id=${token.company_id}`, {
                headers: { 'x-internal-key': process.env.NEXTAUTH_SECRET },
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 'suspended') {
                    if (pathname.startsWith('/api/')) {
                        return NextResponse.json(
                            { error: 'Company account is suspended. Contact support.' },
                            { status: 403 }
                        );
                    }
                    return NextResponse.redirect(new URL('/auth/suspended', request.url));
                }
            }
        } catch (error) {
            // Fail-open to avoid blocking all users
            console.error('Suspension check failed:', error.message);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/dashboard/:path*',
        '/trips/:path*',
        '/bookings/:path*',
        '/super-admin/:path*',
    ],
};
