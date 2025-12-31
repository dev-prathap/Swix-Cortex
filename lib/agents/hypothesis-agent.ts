import { BaseAgent } from "./base-agent";
import { safeParseJson } from "@/lib/utils/ai-helpers";
import { DuckDBEngine, getLocalFilePath } from "@/lib/data/duckdb-engine";

export interface Hypothesis {
    id: string;
    hypothesis: string;
    test_query: string;
    evidence: any;
    strength: number;      // 0-100
    confidence: number;    // 0-100
    conclusion: string;
}

export interface InvestigationResult {
    primary_cause: Hypothesis | null;
    secondary_causes: Hypothesis[];
    unproven_hypotheses: Hypothesis[];
    overall_confidence: number;
}

export class HypothesisAgent extends BaseAgent {
    constructor() {
        // Use FAST model for hypothesis generation (cheaper)
        super('fast', 2);
    }
    
    /**
     * Investigate a "why" question with evidence-backed hypotheses
     */
    async investigate(
        query: string,
        dataset: any,
        initialData: any[],
        interpretation: any
    ): Promise<InvestigationResult> {
        console.log(`[HypothesisAgent] Investigating: ${query}`);
        
        // Step 1: Generate testable hypotheses using LLM
        const hypotheses = await this.generateHypotheses(
            query,
            dataset,
            initialData,
            interpretation
        );
        
        if (hypotheses.length === 0) {
            return {
                primary_cause: null,
                secondary_causes: [],
                unproven_hypotheses: [],
                overall_confidence: 0
            };
        }
        
        // Step 2: Test each hypothesis with real SQL
        const testedHypotheses = await this.testHypotheses(
            hypotheses,
            dataset,
            initialData
        );
        
        // Step 3: Rank by evidence strength
        const ranked = this.rankHypotheses(testedHypotheses);
        
        return ranked;
    }
    
    /**
     * Generate 5-7 testable hypotheses
     */
    private async generateHypotheses(
        query: string,
        dataset: any,
        initialData: any[],
        interpretation: any
    ): Promise<Array<{hypothesis: string, test_query: string}>> {
        const prompt = `You are a data detective investigating: "${query}"

CONTEXT:
Dataset: ${dataset.name}
Domain: ${dataset.profile.domain}
Available Metrics: ${JSON.stringify(dataset.profile.metrics)}
Available Dimensions: ${JSON.stringify(dataset.profile.dimensions)}

INITIAL OBSERVATION:
${JSON.stringify(initialData.slice(0, 10))}

TASK:
Generate 5 testable hypotheses that could explain this phenomenon.
Each hypothesis must be testable with a SQL query.

RULES:
1. Hypotheses must be specific (not "market conditions")
2. Each must have a corresponding DuckDB SQL query
3. Queries should compare current vs. previous period
4. Use existing columns only

OUTPUT FORMAT (strict JSON):
{
  "hypotheses": [
    {
      "hypothesis": "Sales dropped because order volume decreased",
      "test_query": "SELECT COUNT(*) as current_orders FROM {{readFunction}} WHERE _type='order' AND created_at >= CURRENT_DATE - INTERVAL '7 days' UNION ALL SELECT COUNT(*) as previous_orders FROM {{readFunction}} WHERE _type='order' AND created_at >= CURRENT_DATE - INTERVAL '14 days' AND created_at < CURRENT_DATE - INTERVAL '7 days'"
    }
  ]
}`;

        const response = await this.retryWithContext(async () => {
            return await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: "system", content: "You are a data detective. Generate testable, specific hypotheses." },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.6, // Higher temp for creative hypothesis generation
            });
        });

        const content = response.choices[0].message.content || '{"hypotheses": []}';
        const parsed = safeParseJson(content, { hypotheses: [] });
        
        console.log(`[HypothesisAgent] Generated ${parsed.hypotheses?.length || 0} hypotheses`);
        
        return (parsed.hypotheses || []).slice(0, 5); // Max 5 hypotheses
    }
    
    /**
     * Test each hypothesis with actual SQL queries
     */
    private async testHypotheses(
        hypotheses: Array<{hypothesis: string, test_query: string}>,
        dataset: any,
        baselineData: any[]
    ): Promise<Hypothesis[]> {
        const duckdb = new DuckDBEngine();
        const filePath = getLocalFilePath(dataset.rawFileLocation);
        const tested: Hypothesis[] = [];
        
        for (let i = 0; i < hypotheses.length; i++) {
            const h = hypotheses[i];
            console.log(`[HypothesisAgent] Testing hypothesis ${i + 1}/${hypotheses.length}: ${h.hypothesis}`);
            
            try {
                // Execute the test query
                const evidence = await duckdb.query(filePath, h.test_query);
                
                // Evaluate the evidence strength
                const evaluation = this.evaluateEvidence(evidence, h.hypothesis, baselineData);
                
                tested.push({
                    id: `hyp_${i + 1}`,
                    hypothesis: h.hypothesis,
                    test_query: h.test_query,
                    evidence: evidence.slice(0, 10), // Limit for storage
                    strength: evaluation.strength,
                    confidence: evaluation.confidence,
                    conclusion: evaluation.conclusion
                });
                
            } catch (error) {
                console.error(`[HypothesisAgent] Test failed for: ${h.hypothesis}`, error);
                
                // Mark as unproven due to test failure
                tested.push({
                    id: `hyp_${i + 1}`,
                    hypothesis: h.hypothesis,
                    test_query: h.test_query,
                    evidence: null,
                    strength: 0,
                    confidence: 0,
                    conclusion: "Unable to test: Query execution failed"
                });
            }
        }
        
        duckdb.close();
        return tested;
    }
    
    /**
     * Evaluate evidence strength and confidence
     */
    private evaluateEvidence(
        evidence: any[],
        hypothesis: string,
        baselineData: any[]
    ): { strength: number; confidence: number; conclusion: string } {
        if (!evidence || evidence.length === 0) {
            return {
                strength: 0,
                confidence: 0,
                conclusion: "No data to support this hypothesis"
            };
        }
        
        // Try to detect comparison (current vs previous)
        if (evidence.length >= 2) {
            const current = this.extractNumericValue(evidence[0]);
            const previous = this.extractNumericValue(evidence[1]);
            
            if (current !== null && previous !== null && previous !== 0) {
                const percentChange = ((current - previous) / previous) * 100;
                const absoluteChange = Math.abs(percentChange);
                
                // Strength based on magnitude of change
                let strength = 0;
                if (absoluteChange > 50) strength = 90;
                else if (absoluteChange > 30) strength = 75;
                else if (absoluteChange > 20) strength = 60;
                else if (absoluteChange > 10) strength = 45;
                else if (absoluteChange > 5) strength = 30;
                else strength = 15;
                
                // Confidence based on data volume
                let confidence = 50; // Base confidence
                if (current > 100 && previous > 100) confidence += 30;
                else if (current > 50 && previous > 50) confidence += 20;
                else if (current > 10 && previous > 10) confidence += 10;
                
                const direction = current < previous ? "decreased" : "increased";
                const conclusion = `Strong evidence: ${direction} by ${Math.abs(percentChange).toFixed(1)}% (${previous} → ${current})`;
                
                return { strength, confidence: Math.min(confidence, 95), conclusion };
            }
        }
        
        // Single value evidence
        const value = this.extractNumericValue(evidence[0]);
        if (value !== null) {
            return {
                strength: 40,
                confidence: 50,
                conclusion: `Found evidence: value = ${value}. Comparison data needed for stronger conclusion.`
            };
        }
        
        // Multiple data points without clear comparison
        return {
            strength: 25,
            confidence: 40,
            conclusion: `Weak evidence: Found ${evidence.length} data points but no clear change pattern.`
        };
    }
    
    /**
     * Extract first numeric value from evidence row
     */
    private extractNumericValue(row: any): number | null {
        if (!row) return null;
        
        for (const key in row) {
            const value = row[key];
            if (typeof value === 'number') return value;
            if (typeof value === 'bigint') return Number(value);
            if (typeof value === 'string') {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) return parsed;
            }
        }
        return null;
    }
    
    /**
     * Rank hypotheses by evidence strength
     */
    private rankHypotheses(hypotheses: Hypothesis[]): InvestigationResult {
        // Sort by strength * confidence (combined score)
        const sorted = hypotheses
            .map(h => ({
                ...h,
                combined_score: h.strength * h.confidence / 100
            }))
            .sort((a, b) => b.combined_score - a.combined_score);
        
        // Categorize
        const primary = sorted.find(h => h.strength >= 50 && h.confidence >= 50) || null;
        const secondary = sorted.filter(h => 
            h !== primary && h.strength >= 30 && h.confidence >= 40
        ).slice(0, 2);
        const unproven = sorted.filter(h => 
            h !== primary && !secondary.includes(h)
        );
        
        // Overall confidence is the primary cause's confidence
        const overall = primary ? primary.confidence : 0;
        
        return {
            primary_cause: primary,
            secondary_causes: secondary,
            unproven_hypotheses: unproven,
            overall_confidence: overall
        };
    }
}

