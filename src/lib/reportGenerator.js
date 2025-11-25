/**
 * Report Generator Library
 * Functions for generating downloadable reports
 */

/**
 * Generate a comprehensive data quality report
 * @param {Object} parsedData - Parsed dataset
 * @param {Object} qualityAnalysis - Quality analysis results
 * @param {Object} aiInsights - AI-generated insights (optional)
 * @returns {string} Report content
 */
export function generateTextReport(parsedData, qualityAnalysis, aiInsights = null) {
  const timestamp = new Date().toLocaleString();
  
  let report = `DATA QUALITY ANALYSIS REPORT
Generated: ${timestamp}
${'-'.repeat(80)}

FILE INFORMATION
${'-'.repeat(80)}
File Name: ${parsedData.fileName}
File Size: ${formatFileSize(parsedData.fileSize)}
Total Rows: ${parsedData.rowCount}
Total Columns: ${parsedData.columnCount}
Total Cells: ${qualityAnalysis.summary.totalCells}

OVERALL QUALITY SCORE: ${qualityAnalysis.overallScore.toFixed(1)}/100
Grade: ${getScoreGrade(qualityAnalysis.overallScore)}
${'-'.repeat(80)}

QUALITY DIMENSIONS
${'-'.repeat(80)}
Completeness:  ${qualityAnalysis.scores.completeness.toFixed(1)}/100
Uniqueness:    ${qualityAnalysis.scores.uniqueness.toFixed(1)}/100
Validity:      ${qualityAnalysis.scores.validity.toFixed(1)}/100
Consistency:   ${qualityAnalysis.scores.consistency.toFixed(1)}/100

DATA SUMMARY
${'-'.repeat(80)}
Missing Cells:   ${qualityAnalysis.summary.missingCells} (${((qualityAnalysis.summary.missingCells / qualityAnalysis.summary.totalCells) * 100).toFixed(2)}%)
Duplicate Rows:  ${qualityAnalysis.summary.duplicateRows}
Issues Detected: ${qualityAnalysis.summary.issueCount}

`;

  // Column Analysis
  report += `\nCOLUMN ANALYSIS\n${'-'.repeat(80)}\n`;
  parsedData.headers.forEach(header => {
    const stats = qualityAnalysis.columnStats[header];
    report += `\n${header}:\n`;
    report += `  Type: ${stats.type.type} (${(stats.type.confidence * 100).toFixed(0)}% confidence)\n`;
    report += `  Missing: ${stats.missing.count} (${stats.missing.percentage.toFixed(1)}%)\n`;
    report += `  Unique Values: ${stats.unique} (${stats.uniquePercentage.toFixed(1)}%)\n`;
    
    if (stats.statistics) {
      report += `  Statistics:\n`;
      report += `    Mean: ${stats.statistics.mean.toFixed(2)}\n`;
      report += `    Median: ${stats.statistics.median.toFixed(2)}\n`;
      report += `    Std Dev: ${stats.statistics.stdDev.toFixed(2)}\n`;
      report += `    Min: ${stats.statistics.min}\n`;
      report += `    Max: ${stats.statistics.max}\n`;
    }
    
    if (stats.outliers && stats.outliers.count > 0) {
      report += `  Outliers: ${stats.outliers.count} (${stats.outliers.percentage.toFixed(1)}%)\n`;
    }
  });

  // Issues
  if (qualityAnalysis.issues.length > 0) {
    report += `\n\nISSUES DETECTED\n${'-'.repeat(80)}\n`;
    
    const issuesByType = {
      high: qualityAnalysis.issues.filter(i => i.severity === 'high'),
      medium: qualityAnalysis.issues.filter(i => i.severity === 'medium'),
      low: qualityAnalysis.issues.filter(i => i.severity === 'low'),
    };

    ['high', 'medium', 'low'].forEach(severity => {
      if (issuesByType[severity].length > 0) {
        report += `\n${severity.toUpperCase()} SEVERITY (${issuesByType[severity].length}):\n`;
        issuesByType[severity].forEach((issue, index) => {
          report += `  ${index + 1}. ${issue.description}\n`;
          if (issue.column) report += `     Column: ${issue.column}\n`;
        });
      }
    });
  }

  // AI Insights
  if (aiInsights) {
    report += `\n\nAI-POWERED INSIGHTS\n${'-'.repeat(80)}\n`;
    report += `\nSummary:\n${aiInsights.summary}\n`;
    
    if (aiInsights.criticalIssues && aiInsights.criticalIssues.length > 0) {
      report += `\nCritical Issues:\n`;
      aiInsights.criticalIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.issue}\n`;
        report += `   Impact: ${issue.impact}\n`;
      });
    }
    
    if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
      report += `\nRecommendations:\n`;
      aiInsights.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec.title} [${rec.priority}]\n`;
        report += `   ${rec.description}\n`;
        if (rec.sql) report += `   SQL: ${rec.sql}\n`;
      });
    }
    
    report += `\nData Readiness: ${aiInsights.readiness.ready ? 'READY' : 'NOT READY'}\n`;
    report += `Reason: ${aiInsights.readiness.reason}\n`;
  }

  report += `\n${'-'.repeat(80)}\nEND OF REPORT\n`;
  
  return report;
}

/**
 * Generate CSV report
 * @param {Object} qualityAnalysis - Quality analysis results
 * @returns {string} CSV content
 */
export function generateCSVReport(qualityAnalysis, parsedData) {
  let csv = 'Column,Data Type,Confidence,Missing Count,Missing %,Unique Values,Unique %,Has Issues\n';
  
  parsedData.headers.forEach(header => {
    const stats = qualityAnalysis.columnStats[header];
    const hasIssues = qualityAnalysis.issues.some(i => i.column === header);
    
    csv += `"${header}",`;
    csv += `"${stats.type.type}",`;
    csv += `${(stats.type.confidence * 100).toFixed(1)},`;
    csv += `${stats.missing.count},`;
    csv += `${stats.missing.percentage.toFixed(1)},`;
    csv += `${stats.unique},`;
    csv += `${stats.uniquePercentage.toFixed(1)},`;
    csv += `${hasIssues ? 'Yes' : 'No'}\n`;
  });
  
  return csv;
}

/**
 * Generate JSON report
 * @param {Object} parsedData - Parsed dataset
 * @param {Object} qualityAnalysis - Quality analysis results
 * @param {Object} aiInsights - AI-generated insights (optional)
 * @returns {string} JSON content
 */
export function generateJSONReport(parsedData, qualityAnalysis, aiInsights = null) {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      fileName: parsedData.fileName,
      fileSize: parsedData.fileSize,
      rowCount: parsedData.rowCount,
      columnCount: parsedData.columnCount,
    },
    overallScore: qualityAnalysis.overallScore,
    scores: qualityAnalysis.scores,
    summary: qualityAnalysis.summary,
    columns: {},
    issues: qualityAnalysis.issues,
  };

  // Add column details
  parsedData.headers.forEach(header => {
    report.columns[header] = qualityAnalysis.columnStats[header];
  });

  // Add AI insights if available
  if (aiInsights) {
    report.aiInsights = aiInsights;
  }

  return JSON.stringify(report, null, 2);
}

/**
 * Download a file with given content
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download report in specified format
 * @param {string} format - Report format (txt, csv, json)
 * @param {Object} parsedData - Parsed dataset
 * @param {Object} qualityAnalysis - Quality analysis results
 * @param {Object} aiInsights - AI-generated insights (optional)
 */
export function downloadReport(format, parsedData, qualityAnalysis, aiInsights = null) {
  const timestamp = new Date().toISOString().split('T')[0];
  const baseFilename = `${parsedData.fileName.replace(/\.[^/.]+$/, '')}_quality_report_${timestamp}`;
  
  let content, filename, mimeType;
  
  switch (format) {
    case 'txt':
      content = generateTextReport(parsedData, qualityAnalysis, aiInsights);
      filename = `${baseFilename}.txt`;
      mimeType = 'text/plain';
      break;
    case 'csv':
      content = generateCSVReport(qualityAnalysis, parsedData);
      filename = `${baseFilename}.csv`;
      mimeType = 'text/csv';
      break;
    case 'json':
      content = generateJSONReport(parsedData, qualityAnalysis, aiInsights);
      filename = `${baseFilename}.json`;
      mimeType = 'application/json';
      break;
    default:
      throw new Error('Unsupported report format');
  }
  
  downloadFile(content, filename, mimeType);
}

// Helper functions
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getScoreGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}
