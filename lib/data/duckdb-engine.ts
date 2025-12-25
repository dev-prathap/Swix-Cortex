import * as path from 'path'

// Dynamic import to avoid Next.js bundling issues with native modules
let Database: any = null

/**
 * DuckDB Query Engine
 * 
 * Fast SQL queries on CSV/Parquet files without loading into memory.
 * DuckDB can query multi-GB CSV files efficiently.
 * 
 * Note: DuckDB is lazy-loaded to avoid Next.js Turbopack bundling issues
 */
export class DuckDBEngine {
  private db: any

  constructor() {
    // Lazy load DuckDB only when needed (avoids Next.js build issues)
    if (!Database) {
      try {
        Database = require('duckdb').Database
      } catch (error) {
        console.error('[DuckDB] Failed to load duckdb module:', error)
        throw new Error('DuckDB not available. Install with: bun add duckdb')
      }
    }
    
    // In-memory database (fast)
    this.db = new Database(':memory:')
  }

  /**
   * Execute raw SQL on a CSV file (for simple WHERE/ORDER BY/LIMIT clauses)
   */
  async queryCSV(filePath: string, sqlQuery: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // If sqlQuery is a fragment (ORDER BY, LIMIT), append to SELECT
      // If sqlQuery is a full query, use it as-is
      const isFullQuery = sqlQuery.trim().toUpperCase().startsWith('SELECT')
      
      const finalQuery = isFullQuery 
        ? sqlQuery.replace('{{filePath}}', filePath)
        : `SELECT * FROM read_csv_auto('${filePath}') ${sqlQuery}`
      
      this.db.all(finalQuery, (err: any, result: any) => {
        if (err) {
          console.error('[DuckDB] Query error:', err)
          reject(err)
        } else {
          resolve(result || [])
        }
      })
    })
  }

  /**
   * Get top N rows by a specific column
   * Automatically handles text-to-numeric conversion for currency/formatted numbers
   * Returns data formatted for charts: {name, value}
   */
  async getTopN(
    filePath: string, 
    column: string, 
    n: number = 10,
    orderDirection: 'ASC' | 'DESC' = 'DESC',
    nameColumn?: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Clean and cast the metric column for proper sorting (handles currency)
      const cleanedColumn = `CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${column}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`
      
      // For charts, we need name + value format
      // If no nameColumn specified, use row number as name
      const selectColumns = nameColumn 
        ? `CAST("${nameColumn}" AS VARCHAR) as name, ${cleanedColumn} as value`
        : `CAST(ROW_NUMBER() OVER (ORDER BY ${cleanedColumn} ${orderDirection}) AS VARCHAR) as name, ${cleanedColumn} as value`
      
      this.db.all(`
        SELECT ${selectColumns}
        FROM read_csv_auto('${filePath}')
        WHERE TRY_CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${column}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE) IS NOT NULL
        ORDER BY value ${orderDirection}
        LIMIT ${n}
      `, (err: any, result: any) => {
        if (err) {
          console.error('[DuckDB] Query error:', err)
          reject(err)
        } else {
          resolve(result || [])
        }
      })
    })
  }

  /**
   * Aggregate data by dimension
   * Automatically handles text-to-numeric conversion for currency/formatted numbers
   */
  async getAggregate(
    filePath: string,
    metric: string,
    dimension: string,
    aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' = 'SUM'
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Clean and cast metric column: remove currency symbols, commas, then cast to DOUBLE
      const cleanedMetric = `CAST(REGEXP_REPLACE(REGEXP_REPLACE("${metric}", '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`
      
      this.db.all(`
        SELECT 
          "${dimension}" as name,
          ${aggregation}(${cleanedMetric}) as value
        FROM read_csv_auto('${filePath}')
        WHERE REGEXP_REPLACE(REGEXP_REPLACE("${metric}", '[₹$€£,]', '', 'g'), ' ', '', 'g') != ''
        GROUP BY "${dimension}"
        ORDER BY value DESC
      `, (err: any, result: any) => {
        if (err) {
          console.error('[DuckDB] Query error:', err)
          reject(err)
        } else {
          resolve(result || [])
        }
      })
    })
  }

  /**
   * Get trend over time
   * Automatically handles text-to-numeric conversion for currency/formatted numbers
   */
  async getTrend(
    filePath: string,
    timeColumn: string,
    metric: string,
    aggregation: 'SUM' | 'AVG' | 'COUNT' = 'SUM'
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Clean and cast metric column: remove currency symbols, commas, then cast to DOUBLE
      const cleanedMetric = `CAST(REGEXP_REPLACE(REGEXP_REPLACE("${metric}", '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`
      
      this.db.all(`
        SELECT 
          "${timeColumn}" as name,
          ${aggregation}(${cleanedMetric}) as value
        FROM read_csv_auto('${filePath}')
        WHERE REGEXP_REPLACE(REGEXP_REPLACE("${metric}", '[₹$€£,]', '', 'g'), ' ', '', 'g') != ''
        GROUP BY "${timeColumn}"
        ORDER BY "${timeColumn}" ASC
      `, (err: any, result: any) => {
        if (err) {
          console.error('[DuckDB] Query error:', err)
          reject(err)
        } else {
          resolve(result || [])
        }
      })
    })
  }

  /**
   * Execute query based on NL interpretation
   */
  async executeInterpretation(
    filePath: string,
    interpretation: any
  ): Promise<any[]> {
    const { intent, metrics, dimensions, aggregation, limit, sort } = interpretation

    try {
      // Top N / Ranking queries
      if (intent === 'top_N' || intent === 'ranking') {
        const metric = metrics?.[0]
        const dimension = dimensions?.[0]
        
        // If no metric specified, fallback to getting sample rows
        if (!metric) {
          console.warn('[DuckDB] No metric specified for top_N query, returning sample')
          return await this.getSample(filePath, limit || 10)
        }
        
        // For top N queries, if there's a dimension AND aggregation is needed
        if (dimension && aggregation && aggregation.toLowerCase() !== 'none') {
          const validAgg = aggregation?.toUpperCase()
          if (['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(validAgg)) {
            return await this.getAggregate(
              filePath,
              metric,
              dimension,
              validAgg as any
            )
          }
        }
        
        // Default: get top N rows sorted by metric
        // Use dimension as name column if available
        return await this.getTopN(filePath, metric, limit || 10, 'DESC', dimension)
      }

      // Trend analysis
      if (intent === 'trend_analysis') {
        const metric = metrics?.[0]
        const timeColumn = dimensions?.[0]
        
        // Need both metric and time column for trend analysis
        if (!metric || !timeColumn) {
          console.warn('[DuckDB] Missing metric or time column for trend_analysis, returning sample')
          return await this.getSample(filePath, limit || 10)
        }
        
        const validAgg = aggregation?.toUpperCase() || 'SUM'
        const agg = ['SUM', 'AVG', 'COUNT'].includes(validAgg) ? validAgg : 'SUM'
        return await this.getTrend(
          filePath,
          timeColumn,
          metric,
          agg as any
        )
      }

      // Comparison / Category analysis
      if (intent === 'comparison' || intent === 'category_analysis') {
        const metric = metrics?.[0]
        const dimension = dimensions?.[0]
        
        // Need both metric and dimension for comparison
        if (!metric || !dimension) {
          console.warn('[DuckDB] Missing metric or dimension for comparison, returning sample')
          return await this.getSample(filePath, limit || 10)
        }
        
        const validAgg = aggregation?.toUpperCase() || 'SUM'
        const agg = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(validAgg) ? validAgg : 'SUM'
        return await this.getAggregate(
          filePath,
          metric,
          dimension,
          agg as any
        )
      }

      // Summary / Aggregation (same as comparison)
      if (intent === 'summary' || intent === 'aggregation' || intent === 'group_by') {
        const metric = metrics?.[0]
        const dimension = dimensions?.[0]
        
        // Need both metric and dimension for summary
        if (!metric || !dimension) {
          console.warn('[DuckDB] Missing metric or dimension for summary, returning sample')
          return await this.getSample(filePath, limit || 10)
        }
        
        const validAgg = aggregation?.toUpperCase() || 'SUM'
        const agg = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(validAgg) ? validAgg : 'SUM'
        return await this.getAggregate(
          filePath,
          metric,
          dimension,
          agg as any
        )
      }

      // Default: return sample rows if nothing matches
      console.warn('[DuckDB] No matching intent, returning sample rows')
      return await this.getSample(filePath, limit || 10)
    } catch (error) {
      console.error('[DuckDB] Interpretation execution failed:', error)
      // Fallback: return first N rows
      return await this.getSample(filePath, limit || 10)
    }
  }

  /**
   * Get basic statistics about a CSV file
   */
  async getStats(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          COUNT(*) as row_count,
          * 
        FROM (
          SELECT * FROM read_csv_auto('${filePath}') LIMIT 5
        )
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result)
      })
    })
  }

  /**
   * Get sample rows from CSV
   */
  async getSample(filePath: string, limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM read_csv_auto('${filePath}')
        LIMIT ${limit}
      `, (err: any, result: any) => {
        if (err) {
          console.error('[DuckDB] Query error:', err)
          reject(err)
        } else {
          resolve(result || [])
        }
      })
    })
  }

  /**
   * Get column names and types
   */
  async getSchema(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        DESCRIBE SELECT * FROM read_csv_auto('${filePath}')
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close()
  }
}

/**
 * Helper: Get local file path from object storage location
 */
export function getLocalFilePath(location: string): string {
  // If using local storage, construct the full path
  const basePath = process.env.LOCAL_STORAGE_PATH || './data/uploads'
  return path.join(basePath, location)
}

