import * as path from 'path'

// Dynamic import to avoid Next.js bundling issues with native modules
let Database: any = null
let globalDbInstance: any = null

/**
 * DuckDB Query Engine
 * 
 * Fast SQL queries on CSV/Parquet files without loading into memory.
 * DuckDB can query multi-GB CSV files efficiently.
 */
export class DuckDBEngine {
  private db: any

  constructor() {
    // Lazy load DuckDB only when needed (avoids Next.js build issues)
    if (!Database) {
      try {
        const duckdb = require('duckdb');
        Database = duckdb.Database;
      } catch (error) {
        try {
          const duckdb = eval('require')('duckdb');
          Database = duckdb.Database;
        } catch (evalError) {
          console.error('[DuckDB] Failed to load duckdb module:', error);
          throw new Error('DuckDB not available. Install with: npm install duckdb');
        }
      }
    }

    // Singleton pattern for the database instance
    if (!globalDbInstance) {
      globalDbInstance = new Database(':memory:');
      console.log('[DuckDB] Global database instance initialized');
    }

    this.db = globalDbInstance;
  }

  private getReadFunction(filePath: string): string {
    if (filePath.endsWith('.parquet')) return `read_parquet('${filePath}')`
    if (filePath.endsWith('.json')) return `read_json_auto('${filePath}')`
    return `read_csv_auto('${filePath}')`
  }

  /**
   * Execute raw SQL on a CSV or Parquet file
   */
  async query(filePath: string, sqlQuery: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const readFunction = this.getReadFunction(filePath)
      const isFullQuery = sqlQuery.trim().toUpperCase().startsWith('SELECT')

      const finalQuery = isFullQuery
        ? sqlQuery.replace('{{filePath}}', filePath).replace('{{readFunction}}', readFunction)
        : `SELECT * FROM ${readFunction} ${sqlQuery}`

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
   * Convert a CSV file to Parquet for optimized storage and querying
   */
  async convertCSVToParquet(csvPath: string, parquetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        COPY (SELECT * FROM read_csv_auto('${csvPath}')) 
        TO '${parquetPath}' (FORMAT PARQUET)
      `, (err: any) => {
        if (err) {
          console.error('[DuckDB] CSV Conversion error:', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Convert a JSON file to Parquet for optimized storage and querying
   */
  async convertJSONToParquet(jsonPath: string, parquetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`
        COPY (SELECT * FROM read_json_auto('${jsonPath}')) 
        TO '${parquetPath}' (FORMAT PARQUET)
      `, (err: any) => {
        if (err) {
          console.error('[DuckDB] JSON Conversion error:', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  /**
   * Get top N rows by a specific column
   */
  async getTopN(
    filePath: string,
    column: string,
    n: number = 10,
    orderDirection: 'ASC' | 'DESC' = 'DESC',
    nameColumn?: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const cleanedColumn = `CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${column}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`
      const selectColumns = nameColumn
        ? `CAST("${nameColumn}" AS VARCHAR) as name, ${cleanedColumn} as value`
        : `CAST(ROW_NUMBER() OVER (ORDER BY ${cleanedColumn} ${orderDirection}) AS VARCHAR) as name, ${cleanedColumn} as value`

      this.db.all(`
        SELECT ${selectColumns}
        FROM ${this.getReadFunction(filePath)}
        WHERE TRY_CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${column}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE) IS NOT NULL
        ORDER BY value ${orderDirection}
        LIMIT ${n}
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  /**
   * Aggregate data by dimension
   */
  async getAggregate(
    filePath: string,
    metric: string,
    dimension: string,
    aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' = 'SUM',
    formula?: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const metricExpression = formula || `CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${metric}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`

      this.db.all(`
        SELECT 
          "${dimension}" as name,
          ${formula ? formula : `${aggregation}(${metricExpression})`} as value
        FROM ${this.getReadFunction(filePath)}
        WHERE ${formula ? '1=1' : `REGEXP_REPLACE(REGEXP_REPLACE(CAST("${metric}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') != ''`}
        GROUP BY "${dimension}"
        ORDER BY value DESC
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  /**
   * Get trend over time
   */
  async getTrend(
    filePath: string,
    timeColumn: string,
    metric: string,
    aggregation: 'SUM' | 'AVG' | 'COUNT' = 'SUM',
    formula?: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const metricExpression = formula || `CAST(REGEXP_REPLACE(REGEXP_REPLACE(CAST("${metric}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') AS DOUBLE)`

      this.db.all(`
        SELECT 
          "${timeColumn}" as name,
          ${formula ? formula : `${aggregation}(${metricExpression})`} as value
        FROM ${this.getReadFunction(filePath)}
        WHERE ${formula ? '1=1' : `REGEXP_REPLACE(REGEXP_REPLACE(CAST("${metric}" AS VARCHAR), '[₹$€£,]', '', 'g'), ' ', '', 'g') != ''`}
        GROUP BY "${timeColumn}"
        ORDER BY "${timeColumn}" ASC
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  /**
   * Execute query based on NL interpretation
   */
  async executeInterpretation(
    filePath: string,
    interpretation: any,
    metricMap: Record<string, string> = {}
  ): Promise<any[]> {
    const { intent, metrics, dimensions, aggregation, limit } = interpretation

    try {
      if (intent === 'top_N' || intent === 'ranking') {
        const metric = metrics?.[0]
        const dimension = dimensions?.[0]
        if (!metric) return await this.getSample(filePath, limit || 10)

        if (dimension && aggregation && aggregation.toLowerCase() !== 'none') {
          const validAgg = aggregation.toUpperCase()
          if (['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(validAgg)) {
            return await this.getAggregate(filePath, metric, dimension, validAgg as any, metricMap[metric])
          }
        }
        return await this.getTopN(filePath, metric, limit || 10, 'DESC', dimension)
      }

      if (intent === 'trend_analysis') {
        const metric = metrics?.[0]
        const timeColumn = dimensions?.[0]
        if (!metric || !timeColumn) return await this.getSample(filePath, limit || 10)

        const validAgg = aggregation?.toUpperCase() || 'SUM'
        const agg = ['SUM', 'AVG', 'COUNT'].includes(validAgg) ? validAgg : 'SUM'
        return await this.getTrend(filePath, timeColumn, metric, agg as any, metricMap[metric])
      }

      if (intent === 'comparison' || intent === 'category_analysis' || intent === 'summary' || intent === 'aggregation' || intent === 'group_by') {
        const metric = metrics?.[0]
        const dimension = dimensions?.[0]
        if (!metric || !dimension) return await this.getSample(filePath, limit || 10)

        const validAgg = aggregation?.toUpperCase() || 'SUM'
        const agg = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'].includes(validAgg) ? validAgg : 'SUM'
        return await this.getAggregate(filePath, metric, dimension, agg as any, metricMap[metric])
      }

      return await this.getSample(filePath, limit || 10)
    } catch (error) {
      console.error('[DuckDB] Interpretation execution failed:', error)
      return await this.getSample(filePath, limit || 10)
    }
  }

  async getSample(filePath: string, limit: number = 100): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM ${this.getReadFunction(filePath)}
        LIMIT ${limit}
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  async getSchema(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        DESCRIBE SELECT * FROM ${this.getReadFunction(filePath)}
      `, (err: any, result: any) => {
        if (err) reject(err)
        else resolve(result || [])
      })
    })
  }

  /**
   * Append data to existing Parquet file (for real-time updates)
   */
  async appendToParquet(existingPath: string, newData: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create temp JSON file
      const tempJsonPath = existingPath.replace('.parquet', '_append.json');
      const fs = require('fs');
      fs.writeFileSync(tempJsonPath, JSON.stringify(newData));

      // Union existing + new data and write to temp parquet
      const tempParquetPath = `${existingPath}.new`;
      
      this.db.run(`
        COPY (
          SELECT * FROM read_parquet('${existingPath}')
          UNION ALL
          SELECT * FROM read_json_auto('${tempJsonPath}')
        ) TO '${tempParquetPath}' (FORMAT PARQUET)
      `, (err: any) => {
        // Cleanup temp JSON
        if (fs.existsSync(tempJsonPath)) {
          fs.unlinkSync(tempJsonPath);
        }

        if (err) {
          console.error('[DuckDB] Append error:', err);
          reject(err);
        } else {
          // Replace old file with new one
          try {
            fs.unlinkSync(existingPath);
            fs.renameSync(tempParquetPath, existingPath);
            console.log(`[DuckDB] Appended ${newData.length} records to ${existingPath}`);
            resolve();
          } catch (fsErr) {
            reject(fsErr);
          }
        }
      });
    });
  }

  close(): void {
    // In singleton mode, we don't close the global instance
    // but we can clear local references if needed.
  }
}

export function getLocalFilePath(location: string): string {
  const basePath = process.env.LOCAL_STORAGE_PATH || './data/uploads'
  return path.join(basePath, location)
}
