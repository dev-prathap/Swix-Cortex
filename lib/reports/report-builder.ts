import prisma from '@/lib/prisma'
import { AnalysisAgent } from '@/lib/agents/analysis-agent'
import { VisualizationAgent } from '@/lib/agents/visualization-agent'
import { NLQueryEngine } from '@/lib/query/nl-query-engine'

export interface ReportData {
    dataset: any
    profile: any
    analysis: any
    charts: ChartData[]
    metadata: {
        generatedAt: string
        generatedBy: string
        version: string
    }
}

export interface ChartData {
    title: string
    type: string
    data: any[]
    explanation: string
    query: string
}

export class ReportBuilder {
    /**
     * Generate complete report data for a dataset
     */
    async generateReportData(datasetId: string, userId: string): Promise<ReportData> {
        console.log('[ReportBuilder] Generating report for dataset:', datasetId)

        // 1. Fetch dataset and profile
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: {
                profile: true,
                versions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                analyses: {
                    orderBy: { generatedAt: 'desc' },
                    take: 1
                }
            }
        })

        if (!dataset) {
            throw new Error('Dataset not found')
        }

        // 2. Get or generate analysis
        let analysis = dataset.analyses[0]
        if (!analysis) {
            console.log('[ReportBuilder] No analysis found, generating...')
            const analysisAgent = new AnalysisAgent()
            const analysisResult = await analysisAgent.analyzeDataset(datasetId, 'SUMMARY')
            analysis = analysisResult
        }

        // 3. Generate key charts automatically
        const charts = await this.generateKeyCharts(datasetId, userId, dataset.profile)

        // 4. Compile report data
        return {
            dataset: {
                id: dataset.id,
                name: dataset.name,
                originalFileName: dataset.originalFileName,
                fileSize: dataset.fileSize.toString(), // BigInt to string
                uploadedAt: dataset.uploadedAt
            },
            profile: dataset.profile,
            analysis: analysis?.insights || {},
            charts,
            metadata: {
                generatedAt: new Date().toISOString(),
                generatedBy: userId,
                version: '1.0'
            }
        }
    }

    /**
     * Generate 3-5 key charts for the report
     */
    private async generateKeyCharts(
        datasetId: string,
        userId: string,
        profile: any
    ): Promise<ChartData[]> {
        const nlEngine = new NLQueryEngine()
        const charts: ChartData[] = []

        const metrics = (profile?.metrics as string[]) || []
        const dimensions = (profile?.dimensions as string[]) || []
        const timeColumn = profile?.timeColumn

        // Chart 1: Top items by primary metric
        if (metrics.length > 0 && dimensions.length > 0) {
            try {
                const query = `Top 10 ${dimensions[0]} by ${metrics[0]}`
                const result = await nlEngine.executeQuery(datasetId, userId, query)
                charts.push({
                    title: `Top 10 ${dimensions[0]} by ${metrics[0]}`,
                    type: result.visualization.type,
                    data: result.data,
                    explanation: result.explanation,
                    query
                })
            } catch (error) {
                console.error('[ReportBuilder] Chart 1 failed:', error)
            }
        }

        // Chart 2: Trend over time (if time column exists)
        if (timeColumn && metrics.length > 0) {
            try {
                const query = `Show ${metrics[0]} trend over time`
                const result = await nlEngine.executeQuery(datasetId, userId, query)
                charts.push({
                    title: `${metrics[0]} Trend Over Time`,
                    type: result.visualization.type,
                    data: result.data,
                    explanation: result.explanation,
                    query
                })
            } catch (error) {
                console.error('[ReportBuilder] Chart 2 failed:', error)
            }
        }

        // Chart 3: Distribution by dimension
        if (metrics.length > 0 && dimensions.length > 1) {
            try {
                const query = `Show ${metrics[0]} distribution by ${dimensions[1] || dimensions[0]}`
                const result = await nlEngine.executeQuery(datasetId, userId, query)
                charts.push({
                    title: `${metrics[0]} Distribution`,
                    type: result.visualization.type,
                    data: result.data,
                    explanation: result.explanation,
                    query
                })
            } catch (error) {
                console.error('[ReportBuilder] Chart 3 failed:', error)
            }
        }

        // Chart 4: Multi-metric comparison (if multiple metrics)
        if (metrics.length >= 2 && dimensions.length > 0) {
            try {
                const query = `Compare ${metrics.slice(0, 3).join(', ')} by ${dimensions[0]}`
                const result = await nlEngine.executeQuery(datasetId, userId, query)
                charts.push({
                    title: 'Multi-Metric Comparison',
                    type: result.visualization.type,
                    data: result.data,
                    explanation: result.explanation,
                    query
                })
            } catch (error) {
                console.error('[ReportBuilder] Chart 4 failed:', error)
            }
        }

        console.log(`[ReportBuilder] Generated ${charts.length} charts`)
        return charts
    }

    /**
     * Generate HTML from report data
     */
    generateHTML(reportData: ReportData): string {
        const { dataset, profile, analysis, charts, metadata } = reportData

        const metrics = (profile?.metrics as string[]) || []
        const dimensions = (profile?.dimensions as string[]) || []

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Report - ${dataset.name}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333;
            background: white;
        }
        .page { 
            width: 210mm; 
            min-height: 297mm; 
            padding: 20mm; 
            margin: 0 auto; 
            background: white;
            page-break-after: always;
        }
        .cover { 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            min-height: 257mm;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .cover h1 { font-size: 48px; margin-bottom: 20px; }
        .cover h2 { font-size: 32px; opacity: 0.9; margin-bottom: 40px; }
        .cover .meta { font-size: 18px; opacity: 0.8; }
        
        h1 { font-size: 32px; color: #1a202c; margin-bottom: 20px; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { font-size: 24px; color: #2d3748; margin: 30px 0 15px; }
        h3 { font-size: 18px; color: #4a5568; margin: 20px 0 10px; }
        
        .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px; 
            margin: 30px 0;
        }
        .metric-card { 
            background: #f7fafc; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #667eea;
        }
        .metric-card .label { 
            font-size: 14px; 
            color: #718096; 
            margin-bottom: 8px;
        }
        .metric-card .value { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1a202c;
        }
        
        .insight-box { 
            background: #edf2f7; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #48bb78;
        }
        .insight-box ul { 
            list-style: none; 
            padding-left: 0;
        }
        .insight-box li { 
            padding: 8px 0; 
            padding-left: 25px;
            position: relative;
        }
        .insight-box li:before { 
            content: "●"; 
            color: #48bb78; 
            position: absolute; 
            left: 0;
            font-size: 20px;
        }
        
        .chart-section { 
            margin: 40px 0;
            page-break-inside: avoid;
        }
        .chart-placeholder {
            background: #f7fafc;
            border: 2px dashed #cbd5e0;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #718096;
            margin: 20px 0;
        }
        
        .recommendation-box {
            background: #fffaf0;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #ed8936;
        }
        .recommendation-box h4 {
            color: #c05621;
            margin-bottom: 10px;
        }
        
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0;
        }
        th { 
            background: #667eea; 
            color: white; 
            font-weight: 600;
        }
        tr:hover { background: #f7fafc; }
        
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            color: #718096; 
            font-size: 12px;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="page cover">
        <h1>📊 EXECUTIVE REPORT</h1>
        <h2>${dataset.name}</h2>
        <div class="meta">
            <p>Generated: ${new Date(metadata.generatedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
            <p>Data Rows: ${dataset.rowCount?.toLocaleString() || 'N/A'}</p>
        </div>
    </div>

    <!-- EXECUTIVE SUMMARY -->
    <div class="page">
        <h1>Executive Summary</h1>
        
        <h2>Key Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="label">Total Records</div>
                <div class="value">${dataset.rowCount?.toLocaleString() || 'N/A'}</div>
            </div>
            <div class="metric-card">
                <div class="label">Metrics Tracked</div>
                <div class="value">${metrics.length}</div>
            </div>
            <div class="metric-card">
                <div class="label">Dimensions</div>
                <div class="value">${dimensions.length}</div>
            </div>
            <div class="metric-card">
                <div class="label">Data Quality</div>
                <div class="value">${profile?.qualityScore ? (profile.qualityScore * 100).toFixed(0) + '%' : 'N/A'}</div>
            </div>
        </div>

        <h2>Dataset Overview</h2>
        <div class="insight-box">
            <p><strong>Domain:</strong> ${profile?.domain || 'General'}</p>
            <p><strong>Main Entity:</strong> ${profile?.mainEntity || 'Record'}</p>
            <p><strong>Time Period:</strong> ${profile?.timeColumn ? 'Time-series data available' : 'No time dimension'}</p>
            <p><strong>Description:</strong> ${dataset.description || 'No description provided'}</p>
        </div>

        ${analysis?.summary ? `
        <h2>Key Insights</h2>
        <div class="insight-box">
            <ul>
                ${Array.isArray(analysis.keyInsights) 
                    ? analysis.keyInsights.slice(0, 5).map((insight: string) => `<li>${insight}</li>`).join('') 
                    : '<li>Analysis insights will be displayed here</li>'}
            </ul>
        </div>
        ` : ''}
    </div>

    <!-- CHARTS -->
    ${charts.map((chart, idx) => `
    <div class="page">
        <h1>Chart ${idx + 1}: ${chart.title}</h1>
        
        <div class="chart-placeholder">
            <p><strong>${chart.type.toUpperCase()} CHART</strong></p>
            <p>${chart.query}</p>
            <p><em>Chart visualization (${chart.data.length} data points)</em></p>
        </div>

        <h2>Analysis</h2>
        <div class="insight-box">
            <p>${chart.explanation}</p>
        </div>

        ${chart.data.length > 0 ? `
        <h3>Top Data Points</h3>
        <table>
            <thead>
                <tr>
                    ${Object.keys(chart.data[0]).slice(0, 4).map(key => `<th>${key}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${chart.data.slice(0, 10).map(row => `
                <tr>
                    ${Object.keys(row).slice(0, 4).map(key => `<td>${this.formatValue(row[key])}</td>`).join('')}
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}
    </div>
    `).join('')}

    <!-- RECOMMENDATIONS -->
    <div class="page">
        <h1>Recommendations</h1>
        
        ${analysis?.recommendations ? `
        ${Array.isArray(analysis.recommendations) 
            ? analysis.recommendations.map((rec: string, idx: number) => `
            <div class="recommendation-box">
                <h4>Recommendation ${idx + 1}</h4>
                <p>${rec}</p>
            </div>
            `).join('') 
            : '<p>No specific recommendations at this time.</p>'}
        ` : `
        <div class="recommendation-box">
            <h4>Data Quality</h4>
            <p>Review and address any data quality issues identified in the profiling stage.</p>
        </div>
        <div class="recommendation-box">
            <h4>Ongoing Monitoring</h4>
            <p>Set up scheduled reports to track key metrics over time.</p>
        </div>
        <div class="recommendation-box">
            <h4>Deeper Analysis</h4>
            <p>Use natural language queries to explore specific questions and patterns.</p>
        </div>
        `}

        <div class="footer">
            <p>Generated by SWIX AI Data Analyst Platform</p>
            <p>Report Version: ${metadata.version} | Generated: ${new Date(metadata.generatedAt).toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
`
    }

    private formatValue(value: any): string {
        if (value === null || value === undefined) return 'N/A'
        if (typeof value === 'number') {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
            if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
            return value.toFixed(2)
        }
        return String(value)
    }
}

