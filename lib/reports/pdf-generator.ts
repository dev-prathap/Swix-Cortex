import jsPDF from 'jspdf'

interface ReportData {
    dataset: any
    profile: any
    analysis: any
    charts: any[]
    metadata: any
}

export class PDFGenerator {
    /**
     * Generate properly formatted PDF report
     */
    async generatePDF(html: string, reportData?: ReportData): Promise<Buffer> {
        console.log('[PDFGenerator] Starting PDF generation...')

        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            // PAGE 1: Cover Page
            this.addCoverPage(doc, reportData)

            // PAGE 2: Executive Summary
            doc.addPage()
            this.addExecutiveSummary(doc, reportData)

            // PAGE 3+: Charts
            if (reportData?.charts && reportData.charts.length > 0) {
                reportData.charts.forEach((chart, idx) => {
                    doc.addPage()
                    this.addChartPage(doc, chart, idx + 1)
                })
            }

            // LAST PAGE: Recommendations
            doc.addPage()
            this.addRecommendations(doc, reportData)

            // Convert to buffer
            const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
            console.log('[PDFGenerator] PDF generated successfully')
            return pdfBuffer
        } catch (error) {
            console.error('[PDFGenerator] Error:', error)
            throw error
        }
    }

    private addCoverPage(doc: jsPDF, reportData?: ReportData) {
        // Purple gradient background (simulated with solid color)
        doc.setFillColor(102, 126, 234)
        doc.rect(0, 0, 210, 297, 'F')

        // Title
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(40)
        doc.setFont('helvetica', 'bold')
        doc.text('📊 EXECUTIVE REPORT', 105, 120, { align: 'center' })

        // Dataset name
        doc.setFontSize(24)
        doc.setFont('helvetica', 'normal')
        const datasetName = reportData?.dataset?.name || 'Data Analysis Report'
        doc.text(datasetName, 105, 145, { align: 'center', maxWidth: 170 })

        // Metadata
        doc.setFontSize(14)
        const date = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
        doc.text(`Generated: ${date}`, 105, 170, { align: 'center' })
        
        const rowCount = reportData?.dataset?.rowCount?.toLocaleString() || 'N/A'
        doc.text(`Data Rows: ${rowCount}`, 105, 180, { align: 'center' })
    }

    private addExecutiveSummary(doc: jsPDF, reportData?: ReportData) {
        let y = 20

        // Title
        doc.setTextColor(26, 32, 44)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('Executive Summary', 20, y)
        y += 15

        // Key Metrics Section
        doc.setFontSize(16)
        doc.text('Key Metrics', 20, y)
        y += 10

        const metrics = reportData?.profile?.metrics as string[] || []
        const dimensions = reportData?.profile?.dimensions as string[] || []
        const rowCount = reportData?.dataset?.rowCount?.toLocaleString() || 'N/A'

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')

        // Metric cards (2x2 grid)
        this.addMetricCard(doc, 20, y, 'Total Records', rowCount)
        this.addMetricCard(doc, 110, y, 'Metrics Tracked', String(metrics.length))
        y += 35
        this.addMetricCard(doc, 20, y, 'Dimensions', String(dimensions.length))
        this.addMetricCard(doc, 110, y, 'Data Quality', 
            reportData?.profile?.dataQualityScore 
                ? `${(reportData.profile.dataQualityScore * 100).toFixed(0)}%` 
                : 'N/A'
        )
        y += 40

        // Dataset Overview
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Dataset Overview', 20, y)
        y += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        const overview = [
            `Domain: ${reportData?.profile?.domain || 'General'}`,
            `Main Entity: ${reportData?.profile?.mainEntity || 'Record'}`,
            `Time Period: ${reportData?.profile?.timeColumn ? 'Time-series data available' : 'No time dimension'}`,
            `Metrics: ${metrics.slice(0, 3).join(', ')}${metrics.length > 3 ? '...' : ''}`,
            `Dimensions: ${dimensions.slice(0, 3).join(', ')}${dimensions.length > 3 ? '...' : ''}`
        ]

        overview.forEach(line => {
            doc.text(`• ${line}`, 25, y)
            y += 7
        })
    }

    private addMetricCard(doc: jsPDF, x: number, y: number, label: string, value: string) {
        // Card background
        doc.setFillColor(247, 250, 252)
        doc.roundedRect(x, y, 85, 25, 3, 3, 'F')

        // Blue accent line
        doc.setFillColor(102, 126, 234)
        doc.rect(x, y, 3, 25, 'F')

        // Label
        doc.setFontSize(8)
        doc.setTextColor(113, 128, 150)
        doc.text(label, x + 8, y + 8)

        // Value
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(26, 32, 44)
        doc.text(value, x + 8, y + 18)
        doc.setFont('helvetica', 'normal')
    }

    private addChartPage(doc: jsPDF, chart: any, chartNum: number) {
        let y = 20

        // Title
        doc.setTextColor(26, 32, 44)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text(`Chart ${chartNum}: ${chart.title}`, 20, y)
        y += 15

        // Chart type badge
        doc.setFillColor(59, 130, 246)
        doc.roundedRect(20, y, 30, 8, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text(chart.type.toUpperCase(), 35, y + 5, { align: 'center' })
        y += 15

        // Chart placeholder
        doc.setDrawColor(203, 213, 224)
        doc.setFillColor(247, 250, 252)
        doc.roundedRect(20, y, 170, 100, 3, 3, 'FD')
        
        doc.setTextColor(113, 128, 150)
        doc.setFontSize(12)
        doc.text('📊 Chart Visualization', 105, y + 40, { align: 'center' })
        doc.setFontSize(10)
        doc.text(`${chart.data?.length || 0} data points`, 105, y + 50, { align: 'center' })
        doc.setFontSize(8)
        doc.text(`Query: "${chart.query}"`, 105, y + 60, { align: 'center', maxWidth: 150 })
        y += 110

        // Analysis section
        doc.setTextColor(26, 32, 44)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Analysis', 20, y)
        y += 8

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        const explanationLines = doc.splitTextToSize(chart.explanation || 'No explanation available', 170)
        explanationLines.forEach((line: string) => {
            if (y > 270) return
            doc.text(line, 20, y)
            y += 5
        })
        y += 5

        // Top data points
        if (chart.data && chart.data.length > 0 && y < 240) {
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(26, 32, 44)
            doc.text('Top Data Points', 20, y)
            y += 8

            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            
            const topData = chart.data.slice(0, 5)
            topData.forEach((row: any, idx: number) => {
                if (y > 280) return
                const name = row.name || `Item ${idx + 1}`
                const value = typeof row.value === 'number' ? this.formatNumber(row.value) : row.value
                doc.text(`${idx + 1}. ${name}: ${value}`, 25, y)
                y += 5
            })
        }
    }

    private addRecommendations(doc: jsPDF, reportData?: ReportData) {
        let y = 20

        // Title
        doc.setTextColor(26, 32, 44)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('Recommendations', 20, y)
        y += 15

        const recommendations = [
            {
                title: 'Data Quality',
                text: 'Review and address any data quality issues identified in the profiling stage. Focus on missing values and format consistency.'
            },
            {
                title: 'Ongoing Monitoring',
                text: 'Set up scheduled reports to track key metrics over time. This will help identify trends and anomalies early.'
            },
            {
                title: 'Deeper Analysis',
                text: 'Use natural language queries to explore specific questions and patterns in your data. The AI can help uncover hidden insights.'
            },
            {
                title: 'Action Items',
                text: 'Based on the analysis, prioritize addressing the top issues and opportunities identified in the charts above.'
            }
        ]

        recommendations.forEach((rec, idx) => {
            if (y > 260) {
                doc.addPage()
                y = 20
            }

            // Recommendation box
            doc.setFillColor(255, 250, 240)
            doc.roundedRect(20, y, 170, 30, 3, 3, 'F')
            
            // Orange accent
            doc.setFillColor(237, 137, 54)
            doc.rect(20, y, 3, 30, 'F')

            // Title
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(192, 86, 33)
            doc.text(`${idx + 1}. ${rec.title}`, 28, y + 8)

            // Text
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(71, 85, 105)
            const lines = doc.splitTextToSize(rec.text, 155)
            let textY = y + 15
            lines.forEach((line: string) => {
                doc.text(line, 28, textY)
                textY += 5
            })

            y += 38
        })

        // Footer
        y = 280
        doc.setFontSize(8)
        doc.setTextColor(113, 128, 150)
        doc.text('Generated by SWIX AI Data Analyst Platform', 105, y, { align: 'center' })
        doc.text(`Report Version: ${reportData?.metadata?.version || '1.0'} | ${new Date().toLocaleString()}`, 
            105, y + 5, { align: 'center' })
    }

    private formatNumber(num: number): string {
        if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`
        if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`
        return `$${num.toFixed(2)}`
    }
}

