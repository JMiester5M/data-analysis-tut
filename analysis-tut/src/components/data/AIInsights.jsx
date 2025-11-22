'use client';

import { useState } from 'react';
import '../../../styles/AIInsights.css';

export default function AIInsights({ qualityAnalysis, onGenerate }) {
  const [insights, setInsights] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await onGenerate(qualityAnalysis);
      setInsights(result);
    } catch (err) {
      console.error('Failed to generate insights:', err);
      setError('Failed to generate AI insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="ai-insights">
      {!insights ? (
        <div className="insights-prompt">
          <div className="prompt-icon">✨</div>
          <h4>Get AI-Powered Insights</h4>
          <p>
            Our AI will analyze your data quality report and provide:
          </p>
          <ul className="insights-features">
            <li>📊 Plain-language summary of data quality</li>
            <li>⚠️ Critical issues and their business impact</li>
            <li>💡 Specific recommendations for improvement</li>
            <li>✅ Readiness assessment for analysis</li>
          </ul>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary generate-btn"
          >
            {isGenerating ? (
              <>
                <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Generating Insights...
              </>
            ) : (
              <>
                ✨ Generate AI Insights
              </>
            )}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="insights-content">
          {/* Summary Section */}
          <div className="insight-section summary-section">
            <h4>📝 Summary</h4>
            <p className="summary-text">{insights.summary}</p>
            <div className="readiness-badge">
              <span className={`badge ${insights.readiness.ready ? 'ready' : 'not-ready'}`}>
                {insights.readiness.ready ? '✅ Ready for Analysis' : '⚠️ Cleaning Recommended'}
              </span>
              <p className="readiness-reason">{insights.readiness.reason}</p>
            </div>
          </div>

          {/* Critical Issues Section */}
          {insights.criticalIssues && insights.criticalIssues.length > 0 && (
            <div className="insight-section issues-section">
              <h4>⚠️ Critical Issues</h4>
              <div className="issues-list">
                {insights.criticalIssues.map((issue, index) => (
                  <div key={index} className="issue-card">
                    <div className="issue-header">
                      <span className="severity-icon">{getSeverityIcon(issue.severity)}</span>
                      <h5>{issue.issue}</h5>
                    </div>
                    <p className="issue-impact"><strong>Impact:</strong> {issue.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Section */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="insight-section recommendations-section">
              <h4>💡 Recommendations</h4>
              <div className="recommendations-list">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className={`recommendation-card ${getPriorityClass(rec.priority)}`}>
                    <div className="rec-header">
                      <h5>{rec.title}</h5>
                      <span className="priority-badge">{rec.priority}</span>
                    </div>
                    <p className="rec-description">{rec.description}</p>
                    {rec.sql && (
                      <div className="sql-example">
                        <code>{rec.sql}</code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="insights-metadata">
            <small>
              Generated: {new Date(insights.generated).toLocaleString()} 
              {insights.model && ` • Model: ${insights.model}`}
            </small>
            <button 
              onClick={handleGenerate}
              className="btn-secondary regenerate-btn"
              disabled={isGenerating}
            >
              🔄 Regenerate Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
