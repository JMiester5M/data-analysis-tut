'use client';

import { useState } from 'react';
import '../../../styles/AIInsights.css';

export default function AIInsights({ qualityAnalysis, insights, onGenerate = () => {} }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateClick = async () => {
    if (!onGenerate) return;
    setIsGenerating(true);
    setError(null);
    try {
      onGenerate();
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const countBySeverity = (issues, severity) => issues?.filter(i => i.severity === severity).length || 0;

  return (
    <div className="ai-insights">
      {!insights ? (
        <div className="insights-prompt">
          <h4>Get AI-Powered Insights</h4>

          {qualityAnalysis && (
            <div className="ai-preview">
              <p>Total Columns: {Object.keys(qualityAnalysis.columnStats || {}).length}</p>
              <p>Total Issues: {qualityAnalysis.issues?.length || 0} 
                (🔴 {countBySeverity(qualityAnalysis.issues, 'high')} • 🟡 {countBySeverity(qualityAnalysis.issues, 'medium')} • 🟢 {countBySeverity(qualityAnalysis.issues, 'low')})
              </p>
            </div>
          )}

          <p>Our AI will analyze your data quality report and provide:</p>
          <ul className="insights-features">
            <li>📊 Summary of data quality</li>
            <li>⚠️ Critical issues & business impact</li>
            <li>💡 Recommendations for improvement</li>
            <li>✅ Readiness assessment</li>
          </ul>

          <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="btn-primary"
          >
            {isGenerating ? 'Generating Insights...' : '✨ Generate AI Insights'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="insights-content">
          <h4>📝 Summary</h4>
          <p>{insights.summary}</p>

          {insights.criticalIssues?.length > 0 && (
            <div>
              <h4>⚠️ Critical Issues</h4>
              {insights.criticalIssues.map((i, idx) => (
                <p key={idx}>{getSeverityIcon(i.severity)} {i.issue} — {i.impact}</p>
              ))}
            </div>
          )}

          {insights.recommendations?.length > 0 && (
            <div>
              <h4>💡 Recommendations</h4>
              {insights.recommendations.map((r, idx) => (
                <p key={idx}>[{r.priority}] {r.title}: {r.description}</p>
              ))}
            </div>
          )}

          <div className="insights-metadata">
            <small>Generated: {new Date(insights.generated).toLocaleString()}</small>
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="btn-secondary"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}