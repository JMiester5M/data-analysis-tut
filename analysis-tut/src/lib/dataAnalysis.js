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

  return {
    byColumn: missingByColumn,
    byRow: missingByRow,
    total: totalMissing,
    percentage: (totalMissing / totalCells) * 100,
    completenessScore: 100 - ((totalMissing / totalCells) * 100)
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

  return {
    count: duplicates.length,
    percentage: (duplicates.length / rows.length) * 100,
    duplicates: duplicates,
    uniquenessScore: 100 - ((duplicates.length / rows.length) * 100)
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

  // Calculate overall quality scores
  const completenessScore = missingValues.completenessScore;
  const uniquenessScore = duplicates.uniquenessScore;
  
  // Validity score based on data type consistency
  const validityScore = Object.values(dataTypes).reduce((sum, type) => {
    return sum + (type.confidence * 100);
  }, 0) / parsedData.headers.length;

  // Consistency score (inverse of mixed types)
  const mixedTypeColumns = Object.values(dataTypes).filter(t => t.mixedTypes).length;
  const consistencyScore = 100 - ((mixedTypeColumns / parsedData.headers.length) * 100);

  // Overall quality score (weighted average)
  const overallScore = (
    completenessScore * 0.3 +
    uniquenessScore * 0.2 +
    validityScore * 0.3 +
    consistencyScore * 0.2
  );

  // Generate issues list
  const issues = [];

  // Missing value issues
  Object.entries(missingValues.byColumn).forEach(([column, data]) => {
    if (data.percentage > 10) {
      issues.push({
        type: 'missing',
        severity: data.percentage > 50 ? 'high' : data.percentage > 25 ? 'medium' : 'low',
        column,
        description: `${column} has ${data.count} missing values (${data.percentage.toFixed(1)}%)`,
        count: data.count
      });
    }
  });

  // Duplicate issues
  if (duplicates.count > 0) {
    issues.push({
      type: 'duplicate',
      severity: duplicates.percentage > 10 ? 'high' : duplicates.percentage > 5 ? 'medium' : 'low',
      description: `Found ${duplicates.count} duplicate rows (${duplicates.percentage.toFixed(1)}%)`,
      count: duplicates.count
    });
  }

  // Data type inconsistency issues
  Object.entries(dataTypes).forEach(([column, type]) => {
    if (type.mixedTypes && type.confidence < 0.9) {
      issues.push({
        type: 'inconsistent',
        severity: 'medium',
        column,
        description: `${column} has mixed data types (${(type.confidence * 100).toFixed(0)}% ${type.type})`,
        confidence: type.confidence
      });
    }
  });

  // Outlier issues
  Object.entries(columnStats).forEach(([column, stats]) => {
    if (stats.outliers && stats.outliers.count > 0) {
      issues.push({
        type: 'outlier',
        severity: stats.outliers.percentage > 5 ? 'medium' : 'low',
        column,
        description: `${column} has ${stats.outliers.count} outliers (${stats.outliers.percentage.toFixed(1)}%)`,
        count: stats.outliers.count
      });
    }
  });

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
