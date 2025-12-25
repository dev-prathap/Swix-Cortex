import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ChartExplainerAgent } from '@/lib/agents/chart-explainer-agent'

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

export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {

        const { chartType, data, interpretation, userQuery } = await req.json()

        if (!data || !Array.isArray(data) || data.length === 0) {
            return NextResponse.json(
                { error: 'Invalid data provided' },
                { status: 400 }
            )
        }

        const explainer = new ChartExplainerAgent()
        const explanation = await explainer.explainChart(
            chartType,
            data,
            interpretation || {},
            userQuery || 'Analyze data'
        )

        return NextResponse.json({
            success: true,
            explanation
        })
    } catch (error) {
        console.error('[API] Chart explanation error:', error)
        return NextResponse.json(
            { error: 'Failed to generate explanation' },
            { status: 500 }
        )
    }
}

