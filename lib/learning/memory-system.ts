import prisma from '@/lib/prisma'

export class MemorySystem {
    async recordMemory(
        userId: string,
        memoryType: 'CLEANING_PREFERENCE' | 'COLUMN_RENAME' | 'REJECTED_SUGGESTION' | 'ACCEPTED_SUGGESTION' | 'SEMANTIC_MAPPING' | 'QUERY_PATTERN',
        context: any,
        action: any
    ): Promise<void> {
        await prisma.userMemory.create({
            data: {
                userId,
                memoryType,
                context,
                action
            }
        })
    }

    async getMemories(
        userId: string,
        memoryType?: string
    ): Promise<any[]> {
        const where: any = { userId }
        if (memoryType) {
            where.memoryType = memoryType
        }

        return await prisma.userMemory.findMany({
            where,
            orderBy: { learnedAt: 'desc' },
            take: 50
        })
    }

    async getCleaningPreference(
        userId: string,
        issueType: string,
        columnType: string
    ): Promise<string | null> {
        const memories = await prisma.userMemory.findMany({
            where: {
                userId,
                memoryType: 'CLEANING_PREFERENCE'
            },
            orderBy: { learnedAt: 'desc' },
            take: 20
        })

        // Find most recent matching preference
        for (const memory of memories) {
            const ctx = memory.context as any
            if (ctx.issue === issueType && ctx.column_type === columnType) {
                return (memory.action as any).chosen_method
            }
        }

        return null
    }

    async recordCleaningChoice(
        userId: string,
        issue: string,
        columnType: string,
        chosenMethod: string,
        rejectedMethods: string[]
    ): Promise<void> {
        await this.recordMemory(
            userId,
            'CLEANING_PREFERENCE',
            {
                issue,
                column_type: columnType
            },
            {
                chosen_method: chosenMethod,
                rejected_methods: rejectedMethods
            }
        )
    }

    async recordSemanticMapping(
        userId: string,
        concept: string,
        columns: string[],
        confirmed: boolean
    ): Promise<void> {
        await this.recordMemory(
            userId,
            'SEMANTIC_MAPPING',
            { concept },
            { columns, confirmed }
        )
    }

    async recordQueryPattern(
        userId: string,
        queryText: string,
        interpretation: any,
        wasHelpful: boolean
    ): Promise<void> {
        await this.recordMemory(
            userId,
            'QUERY_PATTERN',
            { query: queryText, interpretation },
            { was_helpful: wasHelpful }
        )
    }

    async getSuggestionsBasedOnHistory(userId: string, datasetDomain: string): Promise<string[]> {
        // Get user's query patterns
        const memories = await prisma.userMemory.findMany({
            where: {
                userId,
                memoryType: 'QUERY_PATTERN'
            },
            orderBy: { learnedAt: 'desc' },
            take: 10
        })

        const suggestions: string[] = []

        // Extract common query patterns
        for (const memory of memories) {
            const ctx = memory.context as any
            if ((memory.action as any).was_helpful) {
                suggestions.push(ctx.query)
            }
        }

        return suggestions.slice(0, 5)
    }
}

