import crypto from 'crypto';

interface CacheEntry {
    result: any;
    timestamp: number;
    ttl: number;
}

export class QueryCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxSize: number = 1000;
    
    generateKey(datasetId: string, query: string): string {
        const hash = crypto.createHash('sha256');
        hash.update(`${datasetId}:${query.toLowerCase().trim()}`);
        return hash.digest('hex');
    }
    
    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.result;
    }
    
    set(key: string, result: any, ttl: number = 3600): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            ttl
        });
    }
    
    invalidateDataset(datasetId: string): void {
        for (const [key, _] of this.cache.entries()) {
            if (key.startsWith(datasetId)) {
                this.cache.delete(key);
            }
        }
    }
    
    getStats(): { size: number, maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }
}

export const queryCache = new QueryCache();

