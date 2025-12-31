import { getAIClient, getModelName } from "@/lib/ai/ai-client";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import prisma from '@/lib/prisma'
import { VisualizationAgent, VisualizationConfig } from './visualization-agent'

export interface GeneratedReport {
    title: string
    executive_summary: string
    key_findings: {
        title: string
        description: string
        chart?: VisualizationConfig
        severity: 'info' | 'warning' | 'critical'
    }[]
    detailed_analysis: {
        section: string
        content: string
        supporting_charts: VisualizationConfig[]
    }[]
    recommendations: string[]
    metadata: {
        dataset_name: string
        rows_analyzed: number
        date_range: string
        generated_at: Date
    }
}

const REPORT_SYSTEM_PROMPT = `You are a senior business analyst writing executive reports.

Create a comprehensive, professional business analysis report based on the provided data insights.

Structure:
1. Executive Summary (2-3 sentences, high-level takeaways)
2. Key Findings (3-5 critical insights with severity levels)
3. Detailed Analysis (sections with supporting evidence)
4. Recommendations (actionable next steps)

Write for business executives:
- Clear, concise language
- Focus on business impact
- Use specific numbers
- Avoid technical jargon
- Provide actionable insights

Return valid JSON matching the GeneratedReport structure.`

export class ReportAgent {
    private vizAgent = new VisualizationAgent()
    private client: any;
    private model: string;

    constructor() {
        this.client = getAIClient('executive');
        this.model = getModelName('executive');
    }

    async generateReport(datasetId: string): Promise<GeneratedReport> {
        // Get dataset with all analyses
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: {
                profile: true,
                analyses: {
                    orderBy: { generatedAt: 'desc' },
                    take: 5
                },
                versions: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        })

        if (!dataset || !dataset.profile) {
            throw new Error('Dataset not fully profiled')
        }

        const profile = dataset.profile
        const analyses = dataset.analyses

        // Get visualization configs
        const vizConfigs = await this.vizAgent.inferChartType(datasetId)

        // Build comprehensive prompt
        const prompt = `Dataset: ${dataset.name}
Domain: ${profile.domain}
Entity: ${profile.mainEntity}

Data Quality: ${(profile.dataQualityScore * 100).toFixed(0)}%

Available Analyses:
${analyses.map(a => `- ${a.title}: ${a.summary}`).join('\n')}

Key Insights:
${analyses.flatMap(a => (a.insights as any[]).map((i: any) => `• ${i.text} (${i.category})`)).join('\n')}

Generate a professional executive report with actionable recommendations.`

        // Call OpenAI
        const response = await this.client.chat.completions.create({
            model: this.model,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: REPORT_SYSTEM_PROMPT },
                { role: 'user', content: prompt }
            ],
            temperature: 0.5
        })

        const result = safeParseJson(response.choices[0].message.content || '{}', {} as any);

        // Construct full report
        const report: GeneratedReport = {
            title: result.title || `${dataset.name} Analysis Report`,
            executive_summary: result.executive_summary || 'Analysis completed successfully.',
            key_findings: (result.key_findings || []).map((finding: any, idx: number) => ({
                ...finding,
                chart: vizConfigs[idx] || undefined
            })),
            detailed_analysis: result.detailed_analysis || [],
            recommendations: result.recommendations || [],
            metadata: {
                dataset_name: dataset.name,
                rows_analyzed: 0, // TODO: Get actual row count
                date_range: profile.timeColumn ? 'Date range available' : 'No time dimension',
                generated_at: new Date()
            }
        }

        // Store report as a special analysis
        await prisma.analysis.create({
            data: {
                datasetId,
                type: 'SUMMARY',
                title: report.title,
                summary: report.executive_summary,
                insights: report.key_findings as any,
                visualizations: vizConfigs as any,
                confidence: 0.9
            }
        })

        return report
    }

    async exportReportAsMarkdown(report: GeneratedReport): Promise<string> {
        let md = `# ${report.title}\n\n`
        md += `## Executive Summary\n\n${report.executive_summary}\n\n`

        md += `## Key Findings\n\n`
        report.key_findings.forEach((finding, idx) => {
            const icon = finding.severity === 'critical' ? '🔴' : finding.severity === 'warning' ? '⚠️' : 'ℹ️'
            md += `### ${idx + 1}. ${finding.title} ${icon}\n\n`
            md += `${finding.description}\n\n`
            if (finding.chart) {
                md += `_[Chart: ${finding.chart.title}]_\n\n`
            }
        })

        md += `## Detailed Analysis\n\n`
        report.detailed_analysis.forEach(section => {
            md += `### ${section.section}\n\n${section.content}\n\n`
        })

        md += `## Recommendations\n\n`
        report.recommendations.forEach((rec, idx) => {
            md += `${idx + 1}. ${rec}\n`
        })

        md += `\n---\n\n`
        md += `**Report Metadata**\n`
        md += `- Dataset: ${report.metadata.dataset_name}\n`
        md += `- Generated: ${report.metadata.generated_at.toISOString()}\n`

        return md
    }
}

