import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NLQueryEngine } from '@/lib/query/nl-query-engine'
import { rateLimiter } from '@/lib/middleware/rate-limiter'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

async function getUserId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload.userId as string
    } catch {
        return null
    }
}

// POST /api/analyst/query/nl - Natural language query
export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit check
    const rateLimit = rateLimiter.check(userId);
    if (!rateLimit.allowed) {
        return NextResponse.json({
            error: 'Rate limit exceeded',
            resetAt: new Date(rateLimit.resetAt).toISOString(),
            message: 'You have exceeded the maximum of 50 queries per hour. Please try again later.'
        }, {
            status: 429,
            headers: {
                'X-RateLimit-Limit': '50',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimit.resetAt.toString()
            }
        });
    }

    try {
        const { datasetId, query } = await req.json()

        if (!datasetId || !query) {
            return NextResponse.json({ 
                error: 'datasetId and query required' 
            }, { status: 400 })
        }

        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        const nlEngine = new NLQueryEngine()
        const result = await nlEngine.executeQuery(datasetId, userId, query)

        // Serialize with BigInt support
        const safeResult = JSON.parse(
            JSON.stringify(result, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        )

        return NextResponse.json({
            success: true,
            result: safeResult,
            message: 'Query executed successfully'
        }, {
            headers: {
                'X-RateLimit-Limit': '50',
                'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                'X-RateLimit-Reset': rateLimit.resetAt.toString()
            }
        })
    } catch (error) {
        console.error('NL query failed:', error)
        return NextResponse.json({
            error: 'Failed to execute query',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

// GET /api/analyst/query/nl - Get query history
export async function GET(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { searchParams } = new URL(req.url)
        const datasetId = searchParams.get('datasetId')

        if (!datasetId) {
            return NextResponse.json({ error: 'datasetId required' }, { status: 400 })
        }

        const nlEngine = new NLQueryEngine()
        const history = await nlEngine.getQueryHistory(datasetId, userId)

        // Serialize with BigInt support
        const safeHistory = JSON.parse(
            JSON.stringify(history, (_, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        )

        return NextResponse.json({ history: safeHistory })
    } catch (error) {
        console.error('Failed to fetch query history:', error)
        return NextResponse.json({ 
            error: 'Failed to fetch query history' 
        }, { status: 500 })
    }
}

