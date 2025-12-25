import OpenAI from "openai";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
});

export type CleaningActionType =
  | "normalize_date"
  | "remove_currency"
  | "fill_missing"
  | "remove_duplicates"
  | "cast_type";

export interface CleaningActionOption {
  label: string;
  method: string;
  recommended: boolean;
}

export interface CleaningAction {
  type: CleaningActionType;
  column: string;
  description: string;
  impact: string;
  options?: CleaningActionOption[];
}

const CLEANING_SYSTEM_PROMPT = `
You are a senior data analyst.

You receive:
- Column names
- Basic data profile (metrics, dimensions, issues)

Your job is to propose a CLEANING PLAN.

Rules:
- NEVER silently auto-clean.
- ALWAYS explain issues and options in simple language.
- Focus on missing values, mixed formats, currency symbols, obvious outliers.

Return STRICT JSON:
{
  "summary": string,
  "actions": CleaningAction[]
}

Where CleaningAction:
- type: one of ["normalize_date","remove_currency","fill_missing","remove_duplicates","cast_type"]
- column: column name
- description: human readable
- impact: description of how many rows/what effect
- options: optional array of { label, method, recommended }

Return ONLY JSON.
`;

export class CleaningAgent {
  async generatePlan(datasetId: string) {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: { profile: true },
    });

    if (!dataset || !dataset.profile) {
      throw new Error("Dataset or profile not found");
    }

    const payload = {
      columns: {
        metrics: dataset.profile.metrics,
        dimensions: dataset.profile.dimensions,
      },
      issues: dataset.profile.issues,
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CLEANING_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty cleaning response from AI");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse cleaning JSON from AI");
    }

    const plan = await prisma.cleaningPlan.create({
      data: {
        datasetId: dataset.id,
        suggestedActions: parsed.actions ?? [],
      },
    });

    await prisma.dataset.update({
      where: { id: dataset.id },
      data: { status: "CLEANING_SUGGESTED" },
    });

    return {
      summary: parsed.summary ?? "Cleaning suggestions generated.",
      plan,
    };
  }
}


