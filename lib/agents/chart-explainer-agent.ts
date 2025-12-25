import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

const EXPLAINER_SYSTEM_PROMPT = `You are a professional data analyst explaining chart insights to business users.

Your goal: Make complex data understandable and actionable.

Guidelines:
1. Start with the BIG insight (what stands out most)
2. Provide 2-3 specific observations with numbers
3. Mention any anomalies or interesting patterns
4. End with 1-2 actionable recommendations
5. Use simple, business-friendly language
6. Be concise but insightful (3-4 paragraphs max)

Tone: Professional but conversational, like a consultant explaining findings.
Avoid: Technical jargon, overly formal language, obvious statements.`

export interface ChartExplanation {
    summary: string
    keyInsights: string[]
    recommendations: string[]
    fullExplanation: string
}

export class ChartExplainerAgent {
    /**
     * Generate human-friendly explanation for a chart
     */
    async explainChart(
        chartType: string,
        data: any[],
        interpretation: any,
        userQuery: string
    ): Promise<ChartExplanation> {
        // Prepare data summary for AI
        const dataSummary = this.prepareDataSummary(data, interpretation)
        
        const prompt = `User asked: "${userQuery}"

Chart Type: ${chartType}
Metrics: ${JSON.stringify(interpretation.metrics || [])}
Dimensions: ${JSON.stringify(interpretation.dimensions || [])}

Data Summary:
${dataSummary}

Full Data (first 10 rows):
${JSON.stringify(data.slice(0, 10), null, 2)}

Provide a clear, actionable explanation of what this chart reveals.`

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: EXPLAINER_SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })

            const explanation = response.choices[0].message.content || ''
            
            return this.parseExplanation(explanation, data, interpretation)
        } catch (error) {
            console.error('[ChartExplainer] Error:', error)
            return this.generateFallbackExplanation(data, interpretation, userQuery)
        }
    }

    /**
     * Prepare concise data summary for AI
     */
    private prepareDataSummary(data: any[], interpretation: any): string {
        if (!data || data.length === 0) return 'No data available'

        const metrics = interpretation.metrics || []
        const summary: string[] = []

        // Total rows
        summary.push(`Total items: ${data.length}`)

        // For each metric, calculate stats
        metrics.forEach((metric: string) => {
            const values = data.map(row => {
                const val = row[metric] || row.value || 0
                return typeof val === 'number' ? val : Number(val) || 0
            }).filter(v => !isNaN(v))

            if (values.length > 0) {
                const total = values.reduce((sum, v) => sum + v, 0)
                const avg = total / values.length
                const max = Math.max(...values)
                const min = Math.min(...values)

                summary.push(`${metric}:`)
                summary.push(`  Total: ${this.formatNumber(total)}`)
                summary.push(`  Average: ${this.formatNumber(avg)}`)
                summary.push(`  Range: ${this.formatNumber(min)} - ${this.formatNumber(max)}`)
            }
        })

        // Top 3 items
        if (data.length > 0 && data[0].name) {
            summary.push('\nTop 3 items:')
            data.slice(0, 3).forEach((row, idx) => {
                const value = row[metrics[0]] || row.value || 0
                summary.push(`  ${idx + 1}. ${row.name}: ${this.formatNumber(value)}`)
            })
        }

        return summary.join('\n')
    }

    /**
     * Parse AI response into structured explanation
     */
    private parseExplanation(text: string, data: any[], interpretation: any): ChartExplanation {
        const lines = text.split('\n').filter(l => l.trim())
        
        // Extract key insights (lines with numbers or patterns)
        const keyInsights = lines
            .filter(l => /\d+|%|increase|decrease|highest|lowest|trend/i.test(l))
            .slice(0, 3)

        // Extract recommendations (lines with "should", "recommend", "consider")
        const recommendations = lines
            .filter(l => /should|recommend|consider|suggest|action|next/i.test(l))
            .slice(0, 2)

        // First paragraph as summary
        const summary = lines.slice(0, 2).join(' ')

        return {
            summary: summary || text.substring(0, 150) + '...',
            keyInsights: keyInsights.length > 0 ? keyInsights : [
                'Data shows clear patterns across categories',
                `Analyzed ${data.length} data points`,
                'Trends indicate actionable opportunities'
            ],
            recommendations: recommendations.length > 0 ? recommendations : [
                'Review top performers for best practices',
                'Monitor outliers for potential issues'
            ],
            fullExplanation: text
        }
    }

    /**
     * Fallback explanation if AI fails
     */
    private generateFallbackExplanation(
        data: any[],
        interpretation: any,
        userQuery: string
    ): ChartExplanation {
        const metrics = interpretation.metrics || []
        const metricName = metrics[0] || 'value'
        
        const values = data.map(row => {
            const val = row[metricName] || row.value || 0
            return typeof val === 'number' ? val : Number(val) || 0
        })

        const total = values.reduce((sum, v) => sum + v, 0)
        const avg = total / values.length
        const topItem = data[0]?.name || 'Top item'

        return {
            summary: `This chart shows ${data.length} items based on your query "${userQuery}".`,
            keyInsights: [
                `${topItem} has the highest ${metricName} value`,
                `Total ${metricName} across all items: ${this.formatNumber(total)}`,
                `Average ${metricName} per item: ${this.formatNumber(avg)}`
            ],
            recommendations: [
                'Focus on top performers to understand success factors',
                'Investigate lower performers for improvement opportunities'
            ],
            fullExplanation: `Analysis of ${data.length} items shows that ${topItem} leads with the highest ${metricName}. The total across all items is ${this.formatNumber(total)}, with an average of ${this.formatNumber(avg)} per item. Consider focusing efforts on replicating the success of top performers.`
        }
    }

    /**
     * Format numbers for readability
     */
    private formatNumber(num: number): string {
        if (num >= 1_000_000) {
            return `${(num / 1_000_000).toFixed(2)}M`
        }
        if (num >= 1_000) {
            return `${(num / 1_000).toFixed(2)}K`
        }
        return num.toFixed(2)
    }
}

