import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ReportAgent } from '@/lib/agents/report-agent'

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

// POST /api/analyst/reports/export - Export report as markdown
export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { report, format } = await req.json()

        if (!report) {
            return NextResponse.json({ error: 'report data required' }, { status: 400 })
        }

        const reportAgent = new ReportAgent()
        
        if (format === 'markdown' || !format) {
            const markdown = await reportAgent.exportReportAsMarkdown(report)
            
            return new NextResponse(markdown, {
                headers: {
                    'Content-Type': 'text/markdown',
                    'Content-Disposition': `attachment; filename="${report.title.replace(/\s+/g, '_')}.md"`
                }
            })
        }

        // TODO: Add PDF/PPT export
        return NextResponse.json({ error: 'Format not yet supported' }, { status: 400 })
    } catch (error) {
        console.error('Export failed:', error)
        return NextResponse.json({
            error: 'Failed to export report',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

