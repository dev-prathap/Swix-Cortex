import prisma from '@/lib/prisma'

export interface VisualizationConfig {
    type: 'line' | 'bar' | 'pie' | 'scatter' | 'histogram' | 'area'
    title: string
    xAxis: {
        column: string
        label: string
        type: 'temporal' | 'categorical' | 'numeric'
    }
    yAxis: {
        columns: string[]
        label: string
        aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
    }
    filters?: {
        column: string
        value: any
    }[]
    explanation: string
}

export class VisualizationAgent {
    async inferChartType(datasetId: string, analysisId?: string): Promise<VisualizationConfig[]> {
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: { profile: true }
        })

        if (!dataset || !dataset.profile) {
            throw new Error('Dataset profile not found')
        }

        const profile = dataset.profile
        const metrics = profile.metrics as string[]
        const dimensions = profile.dimensions as string[]
        const timeColumn = profile.timeColumn

        const configs: VisualizationConfig[] = []

        // Rule 1: Time series → Line chart
        if (timeColumn && metrics.length > 0) {
            configs.push({
                type: 'line',
                title: `${metrics[0]} Over Time`,
                xAxis: {
                    column: timeColumn,
                    label: 'Time',
                    type: 'temporal'
                },
                yAxis: {
                    columns: metrics.slice(0, 3),
                    label: metrics[0],
                    aggregation: 'sum'
                },
                explanation: 'Time series data is best visualized with line charts to show trends'
            })
        }

        // Rule 2: Category comparison → Bar chart
        if (dimensions.length > 0 && metrics.length > 0) {
            configs.push({
                type: 'bar',
                title: `${metrics[0]} by ${dimensions[0]}`,
                xAxis: {
                    column: dimensions[0],
                    label: dimensions[0],
                    type: 'categorical'
                },
                yAxis: {
                    columns: [metrics[0]],
                    label: metrics[0],
                    aggregation: 'sum'
                },
                explanation: 'Bar charts effectively compare values across categories'
            })
        }

        // Rule 3: Distribution → Pie chart (if few categories)
        if (dimensions.length > 0 && metrics.length > 0) {
            configs.push({
                type: 'pie',
                title: `${metrics[0]} Distribution by ${dimensions[0]}`,
                xAxis: {
                    column: dimensions[0],
                    label: dimensions[0],
                    type: 'categorical'
                },
                yAxis: {
                    columns: [metrics[0]],
                    label: metrics[0],
                    aggregation: 'sum'
                },
                explanation: 'Pie charts show part-to-whole relationships'
            })
        }

        // Rule 4: Numeric correlation → Scatter plot
        if (metrics.length >= 2) {
            configs.push({
                type: 'scatter',
                title: `${metrics[0]} vs ${metrics[1]}`,
                xAxis: {
                    column: metrics[0],
                    label: metrics[0],
                    type: 'numeric'
                },
                yAxis: {
                    columns: [metrics[1]],
                    label: metrics[1],
                    aggregation: 'sum'
                },
                explanation: 'Scatter plots reveal correlations between two numeric variables'
            })
        }

        return configs
    }

    /**
     * Generate visualization based on query and AI interpretation
     * Uses intent to automatically pick the best chart type
     */
    async generateVisualizationFromQuery(
        query: string,
        datasetId: string,
        interpretation?: any
    ): Promise<VisualizationConfig> {
        const dataset = await prisma.dataset.findUnique({
            where: { id: datasetId },
            include: { profile: true }
        })

        if (!dataset || !dataset.profile) {
            throw new Error('Dataset profile not found')
        }

        const profile = dataset.profile
        const metrics = (interpretation?.metrics || profile.metrics) as string[]
        const dimensions = (interpretation?.dimensions || profile.dimensions) as string[]
        const intent = interpretation?.intent || 'summary'
        const limit = interpretation?.limit || 10

        console.log('[VizAgent] Selecting chart for intent:', intent)

        // 🔥 SMART CHART SELECTION BASED ON INTENT

        // 1. TREND ANALYSIS → Line Chart 📈
        if (intent === 'trend_analysis') {
            return {
                type: 'line',
                title: 'Trend Over Time',
                xAxis: {
                    column: dimensions[0] || profile.timeColumn || 'date',
                    label: dimensions[0] || 'Time',
                    type: 'temporal'
                },
                yAxis: {
                    columns: metrics.slice(0, 3),
                    label: metrics[0] || 'Value',
                    aggregation: 'sum'
                },
                explanation: 'Line chart selected for trend/time keywords'
            }
        }

        // 2. TOP_N with few items → Pie Chart 🥧
        if ((intent === 'top_N' || intent === 'ranking') && limit <= 5) {
            return {
                type: 'pie',
                title: `Top ${limit} Distribution`,
                xAxis: {
                    column: dimensions[0] || 'category',
                    label: dimensions[0] || 'Category',
                    type: 'categorical'
                },
                yAxis: {
                    columns: [metrics[0] || 'value'],
                    label: metrics[0] || 'Value',
                    aggregation: 'sum'
                },
                explanation: 'Pie chart selected for small top N comparison'
            }
        }

        // 3. TOP_N with many items → Bar Chart 📊
        if ((intent === 'top_N' || intent === 'ranking') && limit > 5) {
            return {
                type: 'bar',
                title: `Top ${limit} Comparison`,
                xAxis: {
                    column: dimensions[0] || 'category',
                    label: dimensions[0] || 'Category',
                    type: 'categorical'
                },
                yAxis: {
                    columns: [metrics[0] || 'value'],
                    label: metrics[0] || 'Value',
                    aggregation: 'sum'
                },
                explanation: 'Bar chart selected for top N ranking'
            }
        }

        // 4. DISTRIBUTION → Pie Chart 🥧
        if (intent === 'distribution') {
            return {
                type: 'pie',
                title: 'Distribution',
                xAxis: {
                    column: dimensions[0] || 'category',
                    label: dimensions[0] || 'Category',
                    type: 'categorical'
                },
                yAxis: {
                    columns: [metrics[0] || 'value'],
                    label: metrics[0] || 'Value',
                    aggregation: 'sum'
                },
                explanation: 'Pie chart shows part-to-whole relationships'
            }
        }

        // 5. COMPARISON / SUMMARY → Bar Chart 📊
        if (intent === 'comparison' || intent === 'category_analysis' || intent === 'summary' || intent === 'group_by') {
            return {
                type: 'bar',
                title: 'Comparison Analysis',
                xAxis: {
                    column: dimensions[0] || 'category',
                    label: dimensions[0] || 'Category',
                    type: 'categorical'
                },
                yAxis: {
                    columns: metrics.slice(0, 3),
                    label: metrics[0] || 'Value',
                    aggregation: 'sum'
                },
                explanation: 'Bar chart selected for comparison analysis'
            }
        }

        // 6. OUTLIER DETECTION → Scatter Plot 📍
        if (intent === 'outlier_detection' && metrics.length >= 2) {
            return {
                type: 'scatter',
                title: 'Outlier Analysis',
                xAxis: {
                    column: metrics[0],
                    label: metrics[0],
                    type: 'numeric'
                },
                yAxis: {
                    columns: [metrics[1]],
                    label: metrics[1],
                    aggregation: 'sum'
                },
                explanation: 'Scatter plot helps identify outliers'
            }
        }

        // DEFAULT: Table (safest choice if no visual intent)
        return {
            type: 'table' as any,
            title: 'Analysis Result',
            xAxis: {
                column: dimensions[0] || metrics[0] || 'category',
                label: dimensions[0] || 'Category',
                type: dimensions.length > 0 ? 'categorical' : 'numeric'
            },
            yAxis: {
                columns: [metrics[0] || 'value'],
                label: metrics[0] || 'Value',
                aggregation: 'sum'
            },
            explanation: 'Table view selected for data summary'
        }
    }
}

