/**
 * Universal Chart Data Normalizer
 * 
 * Converts DuckDB raw output to Recharts-compatible format.
 * This is the KEY adapter layer that fixes chart rendering.
 * 
 * DuckDB returns: { facility_name: "Apollo", total_amount: 50000 }
 * Recharts needs: { name: "Apollo", value: 50000 }
 */

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

/**
 * Normalize raw database rows to chart-ready format
 * 
 * @param rows - Raw rows from DuckDB
 * @param interpretation - AI interpretation with dimensions and metrics
 * @returns Recharts-compatible data array
 */
export function normalizeChartData(
  rows: any[],
  interpretation: {
    dimensions?: string[]
    metrics?: string[]
    intent?: string
  }
): ChartDataPoint[] {
  if (!rows || rows.length === 0) {
    console.warn('[ChartNormalizer] No rows to normalize')
    return []
  }

  // Extract dimension and metrics
  const dimension = interpretation.dimensions?.[0]
  const metrics = interpretation.metrics || []

  console.log('[ChartNormalizer] Normalizing:', {
    rowCount: rows.length,
    dimension,
    metrics,
    sampleRow: rows[0]
  })

  // If data already has {name, value} format, return as-is
  if (rows[0]?.name !== undefined && rows[0]?.value !== undefined) {
    console.log('[ChartNormalizer] Data already normalized')
    return rows as ChartDataPoint[]
  }

  // Single metric (most common case)
  if (metrics.length === 1) {
    const metric = metrics[0]
    
    return rows.map((row, idx) => {
      // Try to find name from dimension or use row keys
      let name: string
      
      if (dimension && row[dimension] !== undefined) {
        name = String(row[dimension])
      } else if (row.name !== undefined) {
        name = String(row.name)
      } else {
        // Fallback: use first column or index
        const firstKey = Object.keys(row)[0]
        name = row[firstKey] !== undefined ? String(row[firstKey]) : `Item ${idx + 1}`
      }

      // Try to find value from metric or use numeric columns
      let value: number
      
      if (metric && row[metric] !== undefined) {
        const rawValue = row[metric]
        // Handle different value types
        if (typeof rawValue === 'bigint') {
          value = Number(rawValue)
        } else if (typeof rawValue === 'string') {
          // Clean currency strings: "$1,676.40" → 1676.40
          const cleaned = rawValue.replace(/[\$₹€£,]/g, '').trim()
          value = Number(cleaned) || 0
        } else {
          value = Number(rawValue) || 0
        }
      } else if (row.value !== undefined) {
        const rawValue = row.value
        if (typeof rawValue === 'bigint') {
          value = Number(rawValue)
        } else if (typeof rawValue === 'string') {
          const cleaned = rawValue.replace(/[\$₹€£,]/g, '').trim()
          value = Number(cleaned) || 0
        } else {
          value = Number(rawValue) || 0
        }
      } else {
        // Fallback: use first numeric or currency column
        const numericValue = Object.values(row).find(v => {
          if (typeof v === 'number' || typeof v === 'bigint') return true
          if (typeof v === 'string' && /[\$₹€£,\d]/.test(v)) return true
          return false
        })
        
        if (numericValue !== undefined) {
          if (typeof numericValue === 'string') {
            const cleaned = numericValue.replace(/[\$₹€£,]/g, '').trim()
            value = Number(cleaned) || 0
          } else {
            value = Number(numericValue) || 0
          }
        } else {
          value = 0
        }
      }

      return {
        name,
        value,
        ...row // Keep original data for tooltip
      }
    })
  }

  // Multiple metrics (advanced case)
  if (metrics.length > 1) {
    console.log('[ChartNormalizer] Multiple metrics detected, creating multi-series data')
    
    return rows.map((row, idx) => {
      // Get name
      let name: string
      if (dimension && row[dimension] !== undefined) {
        name = String(row[dimension])
      } else {
        const firstKey = Object.keys(row)[0]
        name = row[firstKey] !== undefined ? String(row[firstKey]) : `Item ${idx + 1}`
      }

      // Create object with all metrics
      const dataPoint: any = { name }
      
      metrics.forEach(metric => {
        if (row[metric] !== undefined) {
          const rawValue = row[metric]
          
          // Handle different value types
          if (typeof rawValue === 'bigint') {
            dataPoint[metric] = Number(rawValue)
          } else if (typeof rawValue === 'string') {
            // Clean currency strings: "$1,676.40" → 1676.40
            const cleaned = rawValue.replace(/[\$₹€£,]/g, '').trim()
            dataPoint[metric] = Number(cleaned) || 0
          } else {
            dataPoint[metric] = Number(rawValue) || 0
          }
        } else {
          dataPoint[metric] = 0
        }
      })

      // Use first metric as primary 'value' for simple charts
      dataPoint.value = dataPoint[metrics[0]] || 0

      return dataPoint
    })
  }

  // Fallback: try to extract any meaningful data
  console.warn('[ChartNormalizer] No metrics specified, attempting smart detection')
  
  // Smart metric detection: find columns with currency or numeric values
  const firstRow = rows[0]
  const potentialMetrics = Object.entries(firstRow)
    .filter(([key, value]) => {
      // Detect currency columns (contains $, ₹, €, £, etc.)
      if (typeof value === 'string' && /[\$₹€£,]/.test(value)) {
        console.log(`[ChartNormalizer] Found currency column: ${key}`)
        return true
      }
      // Detect numeric columns
      if (typeof value === 'number' || typeof value === 'bigint') {
        return true
      }
      return false
    })
    .map(([key]) => key)
  
  console.log('[ChartNormalizer] Detected metrics:', potentialMetrics)
  
  // Use first detected metric or fallback to second column
  const metricColumn = potentialMetrics[0]
  const nameColumn = dimension || Object.keys(firstRow)[0]
  
  return rows.map((row, idx) => {
    // Get name from dimension or first column
    let name: string
    if (nameColumn && row[nameColumn] !== undefined) {
      name = String(row[nameColumn])
    } else {
      name = `Item ${idx + 1}`
    }
    
    // Get value from detected metric
    let value: number = 0
    if (metricColumn && row[metricColumn] !== undefined) {
      const rawValue = row[metricColumn]
      // Handle currency strings
      if (typeof rawValue === 'string') {
        const cleaned = rawValue.replace(/[\$₹€£,]/g, '').trim()
        value = Number(cleaned) || 0
      } else if (typeof rawValue === 'bigint') {
        value = Number(rawValue)
      } else {
        value = Number(rawValue) || 0
      }
    }
    
    console.log(`[ChartNormalizer] Mapped: ${name} -> ${value}`)
    
    return { name, value, ...row }
  })
}

/**
 * Validate chart data structure
 */
export function validateChartData(data: any[]): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[ChartValidator] Data is empty or not an array')
    return false
  }

  const hasName = data.every(d => d.name !== undefined)
  const hasValue = data.every(d => d.value !== undefined || typeof d.value === 'number')

  if (!hasName || !hasValue) {
    console.warn('[ChartValidator] Data missing name or value fields:', data[0])
    return false
  }

  console.log('[ChartValidator] Data is valid ✅')
  return true
}

