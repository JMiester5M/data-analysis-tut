/**
 * AI Integration Library
 * Client-side functions for calling secure AI API routes
 */

/**
 * Generate AI-powered insights from data quality analysis
 * @param {Object} dataAnalysis - Complete quality analysis object
 * @returns {Promise<Object>} AI insights with explanations and recommendations
 */
export async function generateAIInsights(dataAnalysis) {
  try {
    const response = await fetch('/api/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataAnalysis: dataAnalysis }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const insights = await response.json();
    return insights;
  } catch (error) {
    console.error('AI Insights generation failed:', error);
    return getFallbackInsights(dataAnalysis);
  }
}

/**
 * Get recommendations for specific quality issues
 * @param {Object} qualityMetrics - Quality metrics object
 * @returns {Promise<Array>} List of recommendations
 */
export async function getRecommendations(qualityMetrics) {
  const { issues } = qualityMetrics;

  if (!issues || issues.length === 0) {
    return [{
      title: 'Excellent Data Quality',
      description: 'Your dataset appears to be in good shape with no major issues detected.',
      priority: 'low',
      type: 'positive'
    }];
  }

  return getFallbackRecommendations(qualityMetrics);
}

/**
 * Generate natural language explanation for a specific data quality metric
 * @param {string} metricName - Name of the metric (e.g., 'completeness', 'uniqueness')
 * @param {number} score - Score value (0-100)
 * @param {Object} details - Additional details about the metric
 * @returns {Promise<string>} Plain language explanation
 */
export async function explainMetric(metricName, score, details) {
  return `${metricName} score is ${score}/100. ${score >= 90 ? 'Excellent!' : score >= 70 ? 'Good, but could be improved.' : 'Needs attention.'}`;
}

/**
 * Build context summary from analysis data
 * @param {Object} dataAnalysis - Data analysis object
 * @returns {Object} Context summary
 */
function buildAnalysisContext(dataAnalysis) {
  return {
    totalIssues: dataAnalysis.issues.length,
    criticalIssues: dataAnalysis.issues.filter(i => i.severity === 'high').length,
    mediumIssues: dataAnalysis.issues.filter(i => i.severity === 'medium').length,
    lowIssues: dataAnalysis.issues.filter(i => i.severity === 'low').length,
    dataSize: `${dataAnalysis.summary.totalRows} rows × ${dataAnalysis.summary.totalColumns} columns`
  };
}

/**
 * Fallback insights when AI is unavailable
 * @param {Object} dataAnalysis - Data analysis object
 * @returns {Object} Basic insights without AI
 */
function getFallbackInsights(dataAnalysis) {
  const { overallScore, issues } = dataAnalysis;

  return {
    summary: `This dataset has an overall quality score of ${overallScore.toFixed(0)}/100. ${
      overallScore >= 90 ? 'The data appears to be in excellent condition.' :
      overallScore >= 70 ? 'The data quality is acceptable but has some issues to address.' :
      'The data quality needs significant improvement before analysis.'
    }`,
    criticalIssues: issues
      .filter(i => i.severity === 'high')
      .slice(0, 3)
      .map(issue => ({
        issue: issue.description,
        impact: 'This may affect the reliability of analysis results.',
        severity: issue.severity
      })),
    recommendations: [
      {
        title: 'Address Missing Values',
        description: 'Review columns with high percentages of missing data and determine appropriate handling strategies.',
        priority: 'high'
      },
      {
        title: 'Remove Duplicates',
        description: 'Identify and remove duplicate records to improve data uniqueness.',
        priority: 'medium'
      },
      {
        title: 'Standardize Data Types',
        description: 'Ensure consistent data types across all columns.',
        priority: 'medium'
      }
    ],
    readiness: {
      ready: overallScore >= 70,
      reason: overallScore >= 70 
        ? 'The data quality is sufficient for initial analysis.'
        : 'Significant data cleaning is recommended before proceeding with analysis.'
    },
    generated: new Date().toISOString(),
    model: 'fallback',
    context: buildAnalysisContext(dataAnalysis)
  };
}

/**
 * Fallback recommendations when AI is unavailable
 * @param {Object} qualityMetrics - Quality metrics object
 * @returns {Array} Basic recommendations
 */
function getFallbackRecommendations(qualityMetrics) {
  const recommendations = [];

  if (qualityMetrics.issues.some(i => i.type === 'missing')) {
    recommendations.push({
      title: 'Handle Missing Values',
      description: 'Consider imputation strategies or removal based on business requirements.',
      priority: 'high',
      type: 'missing'
    });
  }

  if (qualityMetrics.issues.some(i => i.type === 'duplicate')) {
    recommendations.push({
      title: 'Remove Duplicate Records',
      description: 'Identify unique identifiers and remove duplicate entries.',
      priority: 'high',
      type: 'duplicate'
    });
  }

  if (qualityMetrics.issues.some(i => i.type === 'inconsistent')) {
    recommendations.push({
      title: 'Standardize Data Types',
      description: 'Ensure all values in each column conform to the expected data type.',
      priority: 'medium',
      type: 'inconsistent'
    });
  }

  return recommendations;
}
