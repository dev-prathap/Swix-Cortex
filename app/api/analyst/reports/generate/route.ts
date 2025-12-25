import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { ReportBuilder } from '@/lib/reports/report-builder'
import { PDFGenerator } from '@/lib/reports/pdf-generator'

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-key-change-this-in-prod'
)

async function getUserId() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null
    try {
        const { payload} = await jwtVerify(token, JWT_SECRET)
        return payload.userId as string
    } catch {
        return null
    }
}

// POST /api/analyst/reports/generate - Generate report
export async function POST(req: Request) {
    const userId = await getUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { datasetId, format = 'pdf' } = await req.json()

        if (!datasetId) {
            return NextResponse.json({ error: 'datasetId required' }, { status: 400 })
        }

        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId, userId }
        })

        if (!dataset) {
            return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
        }

        console.log(`[API] Generating report for dataset ${datasetId}`)

        // Generate report data
        const reportBuilder = new ReportBuilder()
        const reportData = await reportBuilder.generateReportData(datasetId, userId)

        // Generate HTML
        const html = reportBuilder.generateHTML(reportData)

        // If PDF requested, generate PDF
        if (format === 'pdf') {
            const pdfGenerator = new PDFGenerator()
            const pdfBuffer = await pdfGenerator.generatePDF(html, reportData)

            // Save report metadata to database
            const report = await prisma.report.create({
                data: {
                    userId,
                    datasetId,
                    type: 'executive',
                    format: 'pdf',
                    title: `Executive Report - ${reportData.dataset.name}`,
                    visualizations: JSON.stringify(reportData.charts.map(c => ({
                        title: c.title,
                        type: c.type,
                        query: c.query
                    }))),
                    generatedAt: new Date()
                }
            })

            // Return PDF as downloadable file
            return new NextResponse(Buffer.from(pdfBuffer), {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="report-${datasetId}-${Date.now()}.pdf"`,
                    'X-Report-Id': report.id
                }
            })
        }

        // Otherwise return HTML for preview
        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html'
            }
        })
    } catch (error) {
        console.error('[API] Report generation error:', error)
        return NextResponse.json({
            error: 'Failed to generate report',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

