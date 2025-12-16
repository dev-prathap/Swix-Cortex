import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Public paths that don't require auth
    const publicPaths = ['/login', '/signup', '/', '/api/auth/login', '/api/auth/register']

    if (publicPaths.some(path => pathname.startsWith(path))) {
        // If user is already logged in and tries to access login/signup, redirect to dashboard
        if (token && (pathname === '/login' || pathname === '/signup')) {
            try {
                await jwtVerify(token, JWT_SECRET)
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } catch (error) {
                // Token invalid, let them proceed to login
            }
        }
        return NextResponse.next()
    }

    // Protected paths
    if (!token) {
        // Redirect to login if no token
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        // Verify token
        await jwtVerify(token, JWT_SECRET)
        return NextResponse.next()
    } catch (error) {
        // Token invalid, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('token')
        return response
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
}
