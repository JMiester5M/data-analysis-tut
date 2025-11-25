/**
 * Data Analysis Library
 * Core logic for analyzing data quality
 */

/**
 * Detect the data type of a column
 * @param {Array} values - Array of values from a column
 * @returns {Object} Data type information
 */
export function detectDataType(values) {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  if (nonNullValues.length === 0) {
    return {
      type: 'empty',
      confidence: 1.0,
      nullable: true
    };
  }

  let numberCount = 0;
  let stringCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  nonNullValues.forEach(value => {
    // Check if boolean
    if (typeof value === 'boolean' || 
        (typeof value === 'string' && ['true', 'false', 'yes', 'no', '1', '0'].includes(value.toLowerCase()))) {
      booleanCount++;
    }
    // Check if number
    else if (typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)))) {
      numberCount++;
    }
    // Check if date
    else if (isValidDate(value)) {
      dateCount++;
    }
    // Default to string
    else {
      stringCount++;
    }
  });

  const total = nonNullValues.length;
  const types = [
    { type: 'number', count: numberCount, confidence: numberCount / total },
    { type: 'string', count: stringCount, confidence: stringCount / total },
    { type: 'boolean', count: booleanCount, confidence: booleanCount / total },
    { type: 'date', count: dateCount, confidence: dateCount / total }
  ];

  const dominant = types.reduce((max, curr) => curr.count > max.count ? curr : max);

  return {
    type: dominant.type,
    confidence: dominant.confidence,
    nullable: values.length > nonNullValues.length,
    mixedTypes: types.filter(t => t.count > 0).length > 1
  };
}

/**
 * Helper function to check if a value is a valid date
 */
function isValidDate(value) {
  if (typeof value === 'number') return false;
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/,  // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/,  // DD-MM-YYYY
  ];
  
  if (typeof value === 'string' && datePatterns.some(pattern => pattern.test(value))) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * Find missing values in the dataset
 * @param {Object} parsedData - Parsed data object with headers and rows
 * @returns {Object} Missing values analysis
 */
export function findMissingValues(parsedData) {
  const { headers, rows } = parsedData;
  const missingByColumn = {};
  const missingByRow = [];

  headers.forEach(header => {
    missingByColumn[header] = {
      count: 0,
      percentage: 0,
      positions: []
    };
  });

  rows.forEach((row, rowIndex) => {
    let missingInRow = 0;
    
    headers.forEach(header => {
      const value = row[header];
      const isMissing = value === null || 
                       value === undefined || 
                       value === '' || 
                       (typeof value === 'string' && value.trim() === '');
      
      if (isMissing) {
        missingByColumn[header].count++;
        missingByColumn[header].positions.push(rowIndex);
        missingInRow++;
      }
    });

    if (missingInRow > 0) {
      missingByRow.push({
        rowIndex,
        missingCount: missingInRow,
        percentage: (missingInRow / headers.length) * 100
      });
    }
  });

  // Calculate percentages
  headers.forEach(header => {
    missingByColumn[header].percentage = 
      (missingByColumn[header].count / rows.length) * 100;
  });

  const totalCells = headers.length * rows.length;
  const totalMissing = Object.values(missingByColumn).reduce((sum, col) => sum + col.count, 0);
  
  // Strict completeness calculation: penalize heavily for any missing values
  // Plus penalize for each column that has missing values
  const columnsWithMissing = Object.values(missingByColumn).filter(col => col.count > 0).length;
  const percentMissing = (totalMissing / totalCells) * 100;
  const columnMissingPenalty = (columnsWithMissing / headers.length) * 15; // Up to 15 points
  const strictCompletenessScore = Math.max(0, 100 - percentMissing - columnMissingPenalty);

  return {
    byColumn: missingByColumn,
    byRow: missingByRow,
    total: totalMissing,
    percentage: (totalMissing / totalCells) * 100,
    completenessScore: strictCompletenessScore
  };
}

/**
 * Find duplicate rows in the dataset
 * @param {Object} parsedData - Parsed data object with headers and rows
 * @returns {Object} Duplicate rows analysis
 */
export function findDuplicates(parsedData) {
  const { headers, rows } = parsedData;
  const seen = new Map();
  const duplicates = [];

  rows.forEach((row, index) => {
    // Create a hash of the row
    const rowHash = JSON.stringify(
      headers.map(header => row[header]).sort()
    );

    if (seen.has(rowHash)) {
      const originalIndex = seen.get(rowHash);
      duplicates.push({
        originalRow: originalIndex,
        duplicateRow: index,
        data: row
      });
    } else {
      seen.set(rowHash, index);
    }
  });

  // Calculate uniqueness penalty based on:
  // 1. Exact duplicate rows
  // 2. Low unique value ratio in ID-like columns
  let totalUniquenessPenalty = 0;
  
  // Check all columns for low cardinality
  headers.forEach(header => {
    const columnValues = rows.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    if (columnValues.length > 0) {
      const uniqueValues = new Set(columnValues).size;
      const uniqueRatio = uniqueValues / columnValues.length;
      
      // Penalize if a column has low unique ratio (many repeats)
      if (uniqueRatio < 0.8) {
        totalUniquenessPenalty += (0.8 - uniqueRatio) * 10; // Up to 2 points per column
      }
    }
  });

  // Base uniqueness score from exact duplicates
  let uniquenessScore = 100 - ((duplicates.length / rows.length) * 100);
  
  // Apply additional penalties for low cardinality
  uniquenessScore = Math.max(0, uniquenessScore - totalUniquenessPenalty);

  return {
    count: duplicates.length,
    percentage: (duplicates.length / rows.length) * 100,
    duplicates: duplicates,
    uniquenessScore: uniquenessScore
  };
}

/**
 * Analyze data types for all columns
 * @param {Object} parsedData - Parsed data object with headers and rows
 * @returns {Object} Data type analysis for each column
 */
export function analyzeDataTypes(parsedData) {
  const { headers, rows } = parsedData;
  const typeAnalysis = {};

  headers.forEach(header => {
    const columnValues = rows.map(row => row[header]);
    typeAnalysis[header] = detectDataType(columnValues);
  });

  return typeAnalysis;
}

/**
 * Calculate statistics for a numeric column
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistical measures
 */
export function calculateStatistics(values) {
  const numericValues = values
    .filter(v => v !== null && v !== undefined && v !== '')
    .map(v => typeof v === 'number' ? v : parseFloat(v))
    .filter(v => !isNaN(v));

  if (numericValues.length === 0) {
    return null;
  }

  const sorted = [...numericValues].sort((a, b) => a - b);
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / numericValues.length;
  
  // Calculate variance and standard deviation
  const squaredDiffs = numericValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / numericValues.length;
  const stdDev = Math.sqrt(variance);

  // Calculate quartiles
  const q1Index = Math.floor(sorted.length * 0.25);
  const q2Index = Math.floor(sorted.length * 0.5);
  const q3Index = Math.floor(sorted.length * 0.75);

  return {
    count: numericValues.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: mean,
    median: sorted[q2Index],
    mode: calculateMode(numericValues),
    stdDev: stdDev,
    variance: variance,
    q1: sorted[q1Index],
    q2: sorted[q2Index],
    q3: sorted[q3Index],
    range: sorted[sorted.length - 1] - sorted[0]
  };
}

/**
 * Calculate mode (most frequent value)
 */
function calculateMode(values) {
  const frequency = {};
  let maxFreq = 0;
  let mode = null;

  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  });

  return mode;
}

/**
 * Detect outliers using IQR method
 * @param {Array} values - Array of numeric values
 * @returns {Object} Outlier information
 */
export function detectOutliers(values) {
  const stats = calculateStatistics(values);
  
  if (!stats) {
    return { outliers: [], count: 0, percentage: 0 };
  }

  const iqr = stats.q3 - stats.q1;
  const lowerBound = stats.q1 - (1.5 * iqr);
  const upperBound = stats.q3 + (1.5 * iqr);

  const outliers = [];
  values.forEach((value, index) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(numValue) && (numValue < lowerBound || numValue > upperBound)) {
      outliers.push({
        index,
        value: numValue,
        type: numValue < lowerBound ? 'low' : 'high'
      });
    }
  });

  return {
    outliers,
    count: outliers.length,
    percentage: (outliers.length / values.length) * 100,
    lowerBound,
    upperBound
  };
}

/**
 * Comprehensive data quality analysis
 * @param {Object} parsedData - Parsed data object
 * @returns {Object} Complete quality analysis
 */
export function analyzeDataQuality(parsedData) {
  const missingValues = findMissingValues(parsedData);
  const duplicates = findDuplicates(parsedData);
  const dataTypes = analyzeDataTypes(parsedData);

  // Generate human-friendly explanations and recommendations
  // (lazy import style to avoid cyclic issues in some bundlers)
  let generateExplanations, generateRecommendations;
  try {
    const q = require('./qualityUtils');
    generateExplanations = q.generateExplanations;
    generateRecommendations = q.generateRecommendations;
  } catch (e) {
    // fallback - functions will be undefined if module can't be loaded
    generateExplanations = undefined;
    generateRecommendations = undefined;
  }

  // Calculate column-level statistics
  const columnStats = {};
  parsedData.headers.forEach(header => {
    const columnValues = parsedData.rows.map(row => row[header]);
    const typeInfo = dataTypes[header];

    columnStats[header] = {
      type: typeInfo,
      missing: missingValues.byColumn[header],
      unique: new Set(columnValues.filter(v => v !== null && v !== undefined && v !== '')).size,
      uniquePercentage: (new Set(columnValues).size / columnValues.length) * 100
    };

    // Add statistics for numeric columns
    if (typeInfo.type === 'number') {
      columnStats[header].statistics = calculateStatistics(columnValues);
      columnStats[header].outliers = detectOutliers(columnValues);
    }
  });

  // Calculate overall quality scores - STRICT MODE with heavy penalties
  const completenessScore = missingValues.completenessScore;
  const uniquenessScore = duplicates.uniquenessScore;
  
  // VALIDITY SCORE: Check if data follows expected format patterns
  // Look for inconsistent formatting, mixed case, pattern violations
  let validityIssues = 0;
  Object.entries(columnStats).forEach(([column, stats]) => {
    const columnValues = parsedData.rows.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (columnValues.length === 0) return;
    
    // Check for consistent formatting in string columns
    if (stats.type.type === 'string') {
      const formats = columnValues.map(v => {
        const str = v.toString();
        if (/^\d+$/.test(str)) return 'numeric';
        if (/^[a-z]+$/.test(str)) return 'lowercase';
        if (/^[A-Z]+$/.test(str)) return 'uppercase';
        if (/^[a-z][a-z\s]*$/.test(str)) return 'lowercase-phrase';
        if (/^[A-Z][a-z\s]*$/.test(str)) return 'titlecase-phrase';
        return 'mixed';
      });
      const uniqueFormats = new Set(formats).size;
      if (uniqueFormats > 1) validityIssues += 2; // Different formats in same column
    }
    
    // Check for consistent null/empty representation
    const nullVariations = columnValues.filter(v => 
      v === '' || v === 'null' || v === 'NULL' || v === 'N/A' || v === 'n/a' || v === '-'
    ).length;
    if (nullVariations > 0 && nullVariations < columnValues.length) {
      validityIssues += 1; // Inconsistent empty value representation
    }
  });
  
  const validityScore = Math.max(0, 100 - validityIssues);

  // CONSISTENCY SCORE: Check for mixed data types and format inconsistencies
  const mixedTypeColumns = Object.values(dataTypes).filter(t => t.mixedTypes).length;
  const mixedTypesPenalty = (mixedTypeColumns / parsedData.headers.length) * 100;
  
  // Additional penalty for format inconsistency in numeric columns
  let formatInconsistencyPenalty = 0;
  Object.entries(columnStats).forEach(([column, stats]) => {
    if (stats.type.type === 'number') {
      const columnValues = parsedData.rows.map(row => row[column]).filter(v => v);
      const withSymbols = columnValues.filter(v => v.toString().match(/[\$,()]/)).length;
      const withoutSymbols = columnValues.length - withSymbols;
      
      if (withSymbols > 0 && withoutSymbols > 0) {
        formatInconsistencyPenalty += 3; // Mixed number formatting
      }
    }
  });
  
  const consistencyScore = Math.max(0, 100 - mixedTypesPenalty - formatInconsistencyPenalty);

  // Missing values penalty - for every column with ANY missing values
  const columnsWithMissing = Object.values(missingValues.byColumn).filter(m => m.count > 0).length;
  const missingColumnsPenalty = (columnsWithMissing / parsedData.headers.length) * 20; // Up to 20 point penalty

  // Format consistency check
  let formatIssuesPenalty = 0;
  Object.entries(columnStats).forEach(([column, stats]) => {
    if (stats.type.type === 'number') {
      const columnValues = parsedData.rows.map(row => row[column]);
      const formattedCount = columnValues.filter(v => 
        v && (v.toString().includes('$') || v.toString().includes(',') || v.toString().includes('('))
      ).length;
      if (formattedCount > 0 && formattedCount < columnValues.length) {
        formatIssuesPenalty += 5;
      }
    }
  });

  // Overall quality score (stricter weighted average with aggressive penalties)
  const baseScore = (
    completenessScore * 0.40 +
    uniquenessScore * 0.30 +
    validityScore * 0.20 +
    consistencyScore * 0.10
  );
  
  const overallScore = Math.max(0, baseScore - missingColumnsPenalty - formatIssuesPenalty);

  // Generate issues list - STRICT MODE
  const issues = [];

  // Missing value issues - flag ANY missing values (not just > 10%)
  Object.entries(missingValues.byColumn).forEach(([column, data]) => {
    if (data.count > 0) {
      let severity = 'low';
      if (data.percentage > 50) severity = 'high';
      else if (data.percentage > 25) severity = 'high';
      else if (data.percentage > 10) severity = 'medium';
      else if (data.percentage > 0) severity = 'low';
      
      issues.push({
        type: 'missing',
        severity,
        column,
        description: `${column} has ${data.count} missing values (${data.percentage.toFixed(1)}%)`,
        count: data.count
      });
    }
  });

  // Duplicate issues - NO LENIENCY
  if (duplicates.count > 0) {
    issues.push({
      type: 'duplicate',
      severity: 'high',
      description: `Found ${duplicates.count} duplicate rows (${duplicates.percentage.toFixed(1)}%)`,
      count: duplicates.count
    });
  }

  // Data type inconsistency issues - flag any mixed types
  Object.entries(dataTypes).forEach(([column, type]) => {
    if (type.mixedTypes) {
      let severity = 'medium';
      if (type.confidence < 0.75) severity = 'high';
      issues.push({
        type: 'inconsistent',
        severity,
        column,
        description: `${column} has mixed data types (${(type.confidence * 100).toFixed(0)}% ${type.type})`,
        confidence: type.confidence
      });
    }
  });

  // Format consistency issues - flag inconsistent formatting
  Object.entries(columnStats).forEach(([column, stats]) => {
    if (stats.type.type === 'number') {
      const columnValues = parsedData.rows.map(row => row[column]).filter(v => v);
      const formattedValues = columnValues.filter(v => 
        v.toString().includes('$') || v.toString().includes(',') || v.toString().includes('(') || v.toString().includes(')')
      );
      const unformattedValues = columnValues.filter(v => 
        !v.toString().includes('$') && !v.toString().includes(',') && !v.toString().includes('(') && !v.toString().includes(')')
      );
      
      if (formattedValues.length > 0 && unformattedValues.length > 0) {
        issues.push({
          type: 'format',
          severity: 'low',
          column,
          description: `${column} has inconsistent number formatting (${formattedValues.length} formatted, ${unformattedValues.length} unformatted)`,
          count: formattedValues.length + unformattedValues.length
        });
      }
    }
  });

  // Outlier issues
  Object.entries(columnStats).forEach(([column, stats]) => {
    if (stats.outliers && stats.outliers.count > 0) {
      issues.push({
        type: 'outlier',
        severity: stats.outliers.percentage > 5 ? 'high' : stats.outliers.percentage > 2 ? 'medium' : 'low',
        column,
        description: `${column} has ${stats.outliers.count} outliers (${stats.outliers.percentage.toFixed(1)}%)`,
        count: stats.outliers.count
      });
    }
  });

  // Generate plain-language explanations and actionable recommendations
  const explanations = generateExplanations ? generateExplanations(issues, columnStats, parsedData) : [];
  const recommendations = generateRecommendations ? generateRecommendations(issues, columnStats, parsedData) : [];

  return {
    overallScore,
    scores: {
      completeness: completenessScore,
      uniqueness: uniquenessScore,
      validity: validityScore,
      consistency: consistencyScore
    },
    missingValues,
    duplicates,
    dataTypes,
    columnStats,
    issues,
    explanations,
    recommendations,
    summary: {
      totalRows: parsedData.rows.length,
      totalColumns: parsedData.headers.length,
      totalCells: parsedData.rows.length * parsedData.headers.length,
      missingCells: missingValues.total,
      duplicateRows: duplicates.count,
      issueCount: issues.length
    }
  };
}
