import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')?.value

        if (!token) {
            return NextResponse.json(
                { 
                    authenticated: false, 
                    error: 'No token found',
                    message: 'Please log in'
                },
                { status: 401 }
            )
        }

        const { payload } = await jwtVerify(token, JWT_SECRET)

        return NextResponse.json({
            authenticated: true,
            user: {
                userId: payload.userId,
                email: payload.email,
                role: payload.role
            }
        })
    } catch (error) {
        return NextResponse.json(
            { 
                authenticated: false, 
                error: 'Invalid token',
                message: 'Please log in again'
            },
            { status: 401 }
        )
    }
}
