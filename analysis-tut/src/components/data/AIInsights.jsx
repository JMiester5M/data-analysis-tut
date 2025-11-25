'use client';

import { useState } from 'react';
import '../../../styles/AIInsights.css';

export default function AIInsights({ qualityAnalysis, insights, onGenerateInsights = () => {} }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateClick = async () => {
    if (typeof onGenerateInsights !== 'function') {
      console.error('onGenerateInsights is not a function:', typeof onGenerateInsights, onGenerateInsights);
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      await onGenerateInsights();
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
          {/* Summary Section */}
          <div className="insight-section">
            <h3 className="section-title">📝 Summary</h3>
            <p className="section-text">{insights.summary}</p>
          </div>

          {/* Critical Issues Section */}
          {Array.isArray(insights?.criticalIssues) && insights.criticalIssues.length > 0 && (
            <div className="insight-section">
              <h3 className="section-title">⚠️ Critical Issues</h3>
              <ul className="issues-list">
                {insights.criticalIssues.map((i, idx) => (
                  <li key={idx} className={`issue-item severity-${i?.severity || 'unknown'}`}>
                    <span className="issue-icon">{getSeverityIcon(i?.severity)}</span>
                    <div className="issue-details">
                      <strong className="issue-title">{i?.issue || 'Unknown issue'}</strong>
                      <p className="issue-impact">{i?.impact || 'No impact description'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations Section */}
          {Array.isArray(insights?.recommendations) && insights.recommendations.length > 0 && (
            <div className="insight-section">
              <h3 className="section-title">💡 Recommendations</h3>
              <ol className="recommendations-list">
                {insights.recommendations.map((r, idx) => (
                  <li key={idx} className={`recommendation-item priority-${r?.priority || 'unknown'}`}>
                    <div className="recommendation-header">
                      <strong className="recommendation-title">{r?.title || 'Untitled'}</strong>
                      <span className="priority-badge">{r?.priority || 'unknown'}</span>
                    </div>
                    <p className="recommendation-description">{r?.description || 'No description'}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Readiness Section */}
          {insights?.readiness && typeof insights.readiness === 'object' && (
            <div className="insight-section readiness-section">
              <h3 className="section-title">✅ Data Readiness Assessment</h3>
              <div className={`readiness-status ${insights.readiness.ready === true ? 'ready' : 'not-ready'}`}>
                <span className="readiness-icon">{insights.readiness.ready === true ? '✓' : '✗'}</span>
                <div className="readiness-text">
                  <strong>{insights.readiness.ready === true ? 'Ready for Analysis' : 'Needs Cleaning'}</strong>
                  <p>{insights.readiness.reason || 'No reason provided'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
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