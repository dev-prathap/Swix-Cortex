import { OpenAI } from "openai";
import prisma from "@/lib/prisma";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class VectorService {
    /**
     * Generate embedding for a given text using OpenAI.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0].embedding;
    }

    /**
     * Store a document chunk with its embedding in the database.
     */
    async storeChunk(datasetId: string, content: string, metadata: any = {}) {
        const embedding = await this.generateEmbedding(content);

        // Prisma doesn't support pgvector directly in its standard methods for 'vector' type
        // so we use $executeRaw
        const id = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
            `INSERT INTO "DocumentChunk" (id, "datasetId", content, metadata, embedding, "createdAt") 
             VALUES ($1, $2, $3, $4, $5::vector, NOW())`,
            id,
            datasetId,
            content,
            JSON.stringify(metadata),
            `[${embedding.join(",")}]`
        );

        return id;
    }

    /**
     * Search for similar document chunks.
     */
    async searchSimilar(datasetId: string, query: string, limit: number = 5) {
        const embedding = await this.generateEmbedding(query);
        const embeddingString = `[${embedding.join(",")}]`;

        // Cosine similarity search
        const results = await prisma.$queryRawUnsafe(
            `SELECT id, content, metadata, 1 - (embedding <=> $1::vector) as similarity
             FROM "DocumentChunk"
             WHERE "datasetId" = $2
             ORDER BY embedding <=> $1::vector
             LIMIT $3`,
            embeddingString,
            datasetId,
            limit
        );

        return results;
    }
}
