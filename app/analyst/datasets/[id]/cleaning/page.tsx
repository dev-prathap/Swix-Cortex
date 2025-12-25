"use client"

import { use, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react'

export default function CleaningPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [plan, setPlan] = useState<any>(null)
    const [generating, setGenerating] = useState(false)
    const [applying, setApplying] = useState(false)
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchPlan()
    }, [id])

    async function fetchPlan() {
        try {
            const res = await fetch(`/api/analyst/datasets/${id}/cleaning`)
            if (res.ok) {
                const data = await res.json()
                setPlan(data.plan)
            } else if (res.status === 404) {
                // No plan exists, generate one
                await generatePlan()
            }
        } catch (error) {
            console.error('Failed to fetch plan:', error)
        }
    }

    async function generatePlan() {
        setGenerating(true)
        try {
            const res = await fetch(`/api/analyst/datasets/${id}/cleaning`, {
                method: 'POST'
            })
            if (res.ok) {
                const data = await res.json()
                setPlan(data.plan)
            }
        } catch (error) {
            console.error('Failed to generate plan:', error)
        } finally {
            setGenerating(false)
        }
    }

    async function applyPlan() {
        setApplying(true)
        try {
            // Safely handle suggestedActions (might not be an array)
            const actionsArray = Array.isArray(plan.suggestedActions) ? plan.suggestedActions : []
            const actions = actionsArray.map((action: any, idx: number) => {
                if (action.options) {
                    const selectedMethod = selectedOptions[idx] || action.options.find((o: any) => o.recommended)?.method
                    return { ...action, selectedMethod }
                }
                return action
            })

            const res = await fetch(`/api/analyst/datasets/${id}/cleaning`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    approvedActions: actions
                })
            })

            if (res.ok) {
                alert('Cleaning applied successfully!')
            }
        } catch (error) {
            console.error('Failed to apply cleaning:', error)
        } finally {
            setApplying(false)
        }
    }

    if (generating) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-lg font-semibold">AI is analyzing data quality...</p>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No cleaning plan available</p>
            </div>
        )
    }

    const actions = Array.isArray(plan.suggestedActions) ? plan.suggestedActions : []

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Data Cleaning</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Review and approve AI-suggested cleaning steps
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Cleaning Plan Summary
                    </CardTitle>
                    <CardDescription>
                        {plan.summary || `Found ${actions.length} data quality issues to review`}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Actions */}
            <div className="space-y-4">
                {actions.map((action: any, idx: number) => (
                    <Card key={idx}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{action.description}</CardTitle>
                                    <CardDescription className="mt-1">
                                        Column: <Badge variant="outline">{action.column}</Badge>
                                    </CardDescription>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-slate-600">
                                <strong>Impact:</strong> {action.impact}
                            </div>

                            {action.options && action.options.length > 0 && (
                                <div>
                                    <Label className="text-sm font-semibold mb-2 block">
                                        Choose Action:
                                    </Label>
                                    <RadioGroup
                                        value={selectedOptions[idx] || action.options.find((o: any) => o.recommended)?.method}
                                        onValueChange={(value) => {
                                            setSelectedOptions({ ...selectedOptions, [idx]: value })
                                        }}
                                    >
                                        {action.options.map((option: any, optIdx: number) => (
                                            <div key={optIdx} className="flex items-center space-x-2 p-3 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
                                                <RadioGroupItem value={option.method} id={`${idx}-${optIdx}`} />
                                                <Label htmlFor={`${idx}-${optIdx}`} className="flex-1 cursor-pointer">
                                                    {option.label}
                                                    {option.recommended && (
                                                        <Badge variant="secondary" className="ml-2">Recommended</Badge>
                                                    )}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Apply Button */}
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900">
                <CardContent className="flex items-center justify-between p-6">
                    <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-400">
                            Ready to apply cleaning?
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                            This will create a new cleaned version of your data
                        </p>
                    </div>
                    <Button size="lg" onClick={applyPlan} disabled={applying}>
                        {applying ? (
                            <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Applying...</>
                        ) : (
                            <><CheckCircle2 className="h-5 w-5 mr-2" /> Apply Cleaning</>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

