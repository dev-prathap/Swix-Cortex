import { VectorService } from "./vector-service";

export class ContextManager {
    private vectorService: VectorService;

    constructor() {
        this.vectorService = new VectorService();
    }

    /**
     * Ingest a document into the vector database.
     * Chunks the text and stores each chunk.
     */
    async ingestDocument(datasetId: string, text: string, metadata: any = {}) {
        const chunks = this.chunkText(text, 1000, 200);
        console.log(`[ContextManager] Ingesting ${chunks.length} chunks for dataset ${datasetId}`);

        for (let i = 0; i < chunks.length; i++) {
            await this.vectorService.storeChunk(datasetId, chunks[i], {
                ...metadata,
                chunkIndex: i,
                totalChunks: chunks.length
            });
        }
    }

    /**
     * Simple text chunking logic.
     */
    private chunkText(text: string, chunkSize: number, overlap: number): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            chunks.push(text.slice(start, end));
            start += chunkSize - overlap;
        }

        return chunks;
    }

    /**
     * Retrieve relevant context for a query.
     */
    async getRelevantContext(datasetId: string, query: string, limit: number = 5) {
        const results = await this.vectorService.searchSimilar(datasetId, query, limit);
        return results;
    }
}
