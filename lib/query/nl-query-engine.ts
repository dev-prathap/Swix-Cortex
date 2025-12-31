import prisma from '@/lib/prisma'
import OpenAI from 'openai'
import { OrchestratorAgent } from '@/lib/agents/orchestrator-agent'
import { ContextAgent } from '@/lib/agents/context-agent'
import { AnalystAgent } from '@/lib/agents/analyst-agent'
import { ExecutiveAgent } from '@/lib/agents/executive-agent'
import { ForecastingAgent } from '@/lib/agents/forecasting-agent'
import { AnomalyAgent } from '@/lib/agents/anomaly-agent'
import { VisualizationAgent } from '@/lib/agents/visualization-agent'
import { HypothesisAgent } from '@/lib/agents/hypothesis-agent'
import { normalizeChartData, validateChartData } from '@/lib/utils/normalizeChartData'
import { queryCache } from '@/lib/cache/query-cache'

export class NLQueryEngine {
    private orchestrator: OrchestratorAgent;
    private contextAgent: ContextAgent;
    private analystAgent: AnalystAgent;
    private executiveAgent: ExecutiveAgent;
    private forecastingAgent: ForecastingAgent;
    private anomalyAgent: AnomalyAgent;
    private vizAgent: VisualizationAgent;
    private hypothesisAgent: HypothesisAgent;

    constructor() {
        this.orchestrator = new OrchestratorAgent();
        this.contextAgent = new ContextAgent();
        this.analystAgent = new AnalystAgent();
        this.executiveAgent = new ExecutiveAgent();
        this.forecastingAgent = new ForecastingAgent();
        this.anomalyAgent = new AnomalyAgent();
        this.vizAgent = new VisualizationAgent();
        this.hypothesisAgent = new HypothesisAgent();
    }

    async *streamQuery(datasetId: string, userId: string, naturalLanguageQuery: string): AsyncGenerator<any> {
        // 1. Get dataset and profile
        const dataset = await (prisma as any).dataset.findUnique({
            where: { id: datasetId, userId },
            include: {
                profile: true,
                semanticMappings: true,
                metrics: true
            }
        })

        if (!dataset) {
            throw new Error(`Dataset with ID "${datasetId}" not found.`);
        }

        yield { type: 'status', message: 'Analyzing dataset structure...' };

        // Auto-profile if not profiled
        if (!dataset.profile) {
            const { ProfilingAgent } = await import('@/lib/agents/profiling-agent');
            const profilingAgent = new ProfilingAgent();
            dataset.profile = await profilingAgent.profileDataset(datasetId);
        }

        const metricMap = dataset.metrics.reduce((acc: any, m: any) => {
            acc[m.name] = m.formula
            return acc
        }, {})

        yield { type: 'status', message: 'Planning analysis steps...' };

        // 2. Orchestration Plan
        const tasks = await this.orchestrator.plan(naturalLanguageQuery, {
            domain: dataset.profile.domain,
            metrics: dataset.profile.metrics,
            dimensions: dataset.profile.dimensions
        })

        yield { type: 'tasks', tasks };

        // 3. Shared Memory / State
        const state: any = {
            query: naturalLanguageQuery,
            dataset,
            metricMap,
            context: "",
            data: [],
            interpretation: null,
            visualization: null,
            executiveInsight: "",
            forecast: "",
            anomalies: "",
            hypotheses: null
        }

        // Detect if this is a "why" question
        const isWhyQuery = naturalLanguageQuery.toLowerCase().includes('why') ||
                          naturalLanguageQuery.toLowerCase().includes('cause') ||
                          naturalLanguageQuery.toLowerCase().includes('reason');

        // 4. Execute Tasks
        for (const task of tasks.sort((a, b) => a.priority - b.priority)) {
            yield { type: 'agent_start', agent: task.agent, reasoning: task.reasoning };

            try {
                if (task.agent === "context") {
                    state.context = await this.contextAgent.getContext(naturalLanguageQuery, datasetId)
                    yield { type: 'context', content: state.context };
                }
                else if (task.agent === "analyst") {
                    const result = await this.analystAgent.analyze(naturalLanguageQuery, dataset, metricMap)
                    state.data = result.data
                    state.interpretation = result.interpretation
                    yield { type: 'data', data: state.data, interpretation: state.interpretation };
                }
                else if (task.agent === "visualization") {
                    if (state.data.length > 0) {
                        state.visualization = await this.vizAgent.generateVisualizationFromQuery(
                            naturalLanguageQuery,
                            datasetId,
                            state.interpretation
                        )
                        yield { type: 'visualization', visualization: state.visualization };
                    }
                }
                else if (task.agent === "executive") {
                    // If "why" question and we have hypotheses, use evidence-backed summary
                    if (isWhyQuery && state.hypotheses) {
                        state.executiveInsight = this.generateEvidenceBasedSummary(
                            naturalLanguageQuery,
                            state.hypotheses
                        );
                    } else {
                        state.executiveInsight = await this.executiveAgent.synthesize(
                            naturalLanguageQuery,
                            state.data,
                            state.context,
                            dataset.metrics
                        );
                    }
                    
                    // Ensure we send the string content, not an object
                    const insightContent = typeof state.executiveInsight === 'string' 
                        ? state.executiveInsight 
                        : state.executiveInsight?.summary || "Analysis complete.";
                    
                    yield { type: 'insight', content: insightContent };
                }
                else if (task.agent === "forecasting" && state.data.length > 0) {
                    state.forecast = await this.forecastingAgent.forecast(
                        naturalLanguageQuery,
                        state.data,
                        state.interpretation
                    )
                    yield { type: 'forecast', content: state.forecast };
                }
                else if (task.agent === "anomaly" && state.data.length > 0) {
                    state.anomalies = await this.anomalyAgent.detect(
                        naturalLanguageQuery,
                        state.data,
                        state.interpretation
                    )
                    yield { type: 'anomalies', content: state.anomalies };
                    
                    // CRITICAL: After anomaly detection, run hypothesis testing for "why" questions
                    if (isWhyQuery && state.data.length > 0) {
                        yield { type: 'status', message: 'Investigating root causes...' };
                        
                        state.hypotheses = await this.hypothesisAgent.investigate(
                            naturalLanguageQuery,
                            dataset,
                            state.data,
                            state.interpretation
                        );
                        
                        yield { type: 'hypotheses', content: state.hypotheses };
                    }
                }
            } catch (error: any) {
                console.error(`[Orchestrator] Error in ${task.agent}:`, error)
                yield { type: 'agent_error', agent: task.agent, error: error.message };
            }
        }

        // Final Fallbacks
        if (state.data.length === 0 && !state.interpretation) {
            const result = await this.analystAgent.analyze(naturalLanguageQuery, dataset, metricMap)
            state.data = result.data
            state.interpretation = result.interpretation
            yield { type: 'data', data: state.data, interpretation: state.interpretation };
        }

        if (state.data.length > 0 && !state.visualization) {
            state.visualization = await this.vizAgent.generateVisualizationFromQuery(
                naturalLanguageQuery,
                datasetId,
                state.interpretation
            )
            yield { type: 'visualization', visualization: state.visualization };
        }

        // Store query in history
        await prisma.query.create({
            data: {
                datasetId,
                userId,
                naturalLanguage: naturalLanguageQuery,
                interpretation: state.interpretation || {}
            }
        })

        // Ensure explanation is a string
        const explanation = typeof state.executiveInsight === 'string' 
            ? state.executiveInsight 
            : state.executiveInsight?.summary || "Analysis completed successfully.";
        
        yield {
            type: 'complete', final: {
                interpretation: state.interpretation,
                visualization: state.visualization,
                data: state.data,
                explanation: explanation,
                forecast: state.forecast,
                anomalies: state.anomalies,
                hypotheses: state.hypotheses // NEW: Include hypothesis investigation results
            }
        };
    }
    
    /**
     * Generate evidence-backed summary from hypothesis investigation
     */
    private generateEvidenceBasedSummary(
        query: string,
        investigation: any
    ): any {
        if (!investigation || investigation.overall_confidence === 0) {
            return {
                summary: "Unable to determine root cause with available data.",
                confidence: "low",
                data_quality: "insufficient_evidence"
            };
        }
        
        let summary = `### Root Cause Analysis\n\n`;
        
        // Primary cause
        if (investigation.primary_cause) {
            const p = investigation.primary_cause;
            summary += `**Primary Cause (Confidence: ${p.confidence}%)**\n`;
            summary += `${p.hypothesis}\n\n`;
            summary += `Evidence: ${p.conclusion}\n\n`;
        }
        
        // Secondary causes
        if (investigation.secondary_causes && investigation.secondary_causes.length > 0) {
            summary += `**Contributing Factors:**\n`;
            investigation.secondary_causes.forEach((s: any, i: number) => {
                summary += `${i + 1}. ${s.hypothesis} (Confidence: ${s.confidence}%)\n`;
                summary += `   Evidence: ${s.conclusion}\n\n`;
            });
        }
        
        // Unproven hypotheses
        if (investigation.unproven_hypotheses && investigation.unproven_hypotheses.length > 0) {
            summary += `**Additional Possibilities (Unproven):**\n`;
            investigation.unproven_hypotheses.slice(0, 2).forEach((u: any, i: number) => {
                summary += `- ${u.hypothesis}\n`;
                summary += `  ${u.conclusion}\n\n`;
            });
        }
        
        const confidenceLevel = investigation.overall_confidence >= 70 ? "high" :
                               investigation.overall_confidence >= 50 ? "medium" : "low";
        
        return {
            summary: summary,
            confidence: confidenceLevel,
            data_quality: `${investigation.overall_confidence}% overall confidence`
        };
    }

    async executeQuery(datasetId: string, userId: string, naturalLanguageQuery: string): Promise<any> {
        // Check cache first
        const cacheKey = queryCache.generateKey(datasetId, naturalLanguageQuery);
        const cached = queryCache.get(cacheKey);
        
        if (cached) {
            console.log(`[QueryCache] HIT for query: ${naturalLanguageQuery.slice(0, 50)}...`);
            return {
                ...cached,
                _cached: true,
                _cachedAt: new Date()
            };
        }
        
        console.log(`[QueryCache] MISS for query: ${naturalLanguageQuery.slice(0, 50)}...`);
        
        // Execute query normally
        let finalResult: any = {};
        for await (const update of this.streamQuery(datasetId, userId, naturalLanguageQuery)) {
            if (update.type === 'complete') {
                finalResult = update.final;
            }
        }
        
        // Cache successful results (1 hour TTL)
        if (finalResult && finalResult.data && finalResult.data.length > 0) {
            queryCache.set(cacheKey, finalResult, 3600);
        }
        
        return finalResult;
    }
    private generateMockData(interpretation: any): any[] {
        const intent = interpretation.intent || 'top_N'
        const limit = interpretation.limit || 5

        // Generate sample data based on intent
        if (intent === 'top_N' || intent === 'ranking') {
            return Array.from({ length: limit }, (_, i) => ({
                name: `Item ${i + 1}`,
                value: Math.floor(Math.random() * 100000) + 10000,
                revenue: Math.floor(Math.random() * 100000) + 10000
            })).sort((a, b) => b.value - a.value)
        }

        if (intent === 'trend_analysis') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            return months.slice(0, 6).map(month => ({
                name: month,
                value: Math.floor(Math.random() * 50000) + 20000,
                revenue: Math.floor(Math.random() * 50000) + 20000
            }))
        }

        if (intent === 'comparison' || intent === 'category_analysis') {
            const categories = ['Category A', 'Category B', 'Category C', 'Category D', 'Category E']
            return categories.map(cat => ({
                name: cat,
                value: Math.floor(Math.random() * 80000) + 15000,
                revenue: Math.floor(Math.random() * 80000) + 15000
            }))
        }

        // Default
        return Array.from({ length: 5 }, (_, i) => ({
            name: `Entry ${i + 1}`,
            value: Math.floor(Math.random() * 100000),
            revenue: Math.floor(Math.random() * 100000)
        }))
    }

    private generateExplanation(interpretation: any, originalQuery: string): string {
        const intent = interpretation.intent || 'analysis'
        const metrics = interpretation.metrics || []
        const dimensions = interpretation.dimensions || []

        return `Analyzing "${originalQuery}": Performing ${intent} on ${metrics.join(', ')} grouped by ${dimensions.join(', ') || 'overall'}.`
    }

    async getQueryHistory(datasetId: string, userId: string): Promise<any[]> {
        return await prisma.query.findMany({
            where: { datasetId, userId },
            orderBy: { executedAt: 'desc' },
            take: 20
        })
    }
}

