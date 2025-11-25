// Clean replacement of corrupted file
// CLEAN REWRITE AFTER CORRUPTION
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeDataQuality } from '@/lib/dataAnalysis';
import { generateAIInsights } from '@/lib/aiIntegration';
import { downloadReport } from '@/lib/reportGenerator';
import AIInsights from '@/components/data/AIInsights';
import DataVisualizations from '@/components/data/DataVisualizations';
import QualityHistory from '@/components/data/QualityHistory';
import '../../../styles/AnalysisPage.css';

function scoreColor(score) {
  if (score >= 80) return 'var(--quality-excellent)';
  if (score >= 60) return 'var(--quality-warning)';
  return 'var(--quality-critical)';
}
function scoreGrade(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

export default function AnalysisPage() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('parsedData');
    if (!raw) {
      router.push('/');
      return;
    }
    try {
      const data = JSON.parse(raw);
      setParsedData(data);
      setAnalyzing(true);
      const analysis = analyzeDataQuality(data);
      setQualityAnalysis(analysis);
    } catch (e) {
      console.error('Analysis failed', e);
      router.push('/');
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  }, [router]);

  // Persist recent analyses when qualityAnalysis is ready
  useEffect(() => {
    if (!qualityAnalysis || !parsedData) return;
    (async () => {
      try {
        const entry = {
          fileName: parsedData.fileName,
          score: qualityAnalysis.overallScore,
          analyzedAt: Date.now()
        };
        await fetch('/api/recent-analyses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (err) {
        console.warn('Failed to persist recent analysis', err);
      }
    })()
  }, [qualityAnalysis, parsedData]);

  // Persist quality history (for monitoring over time)
  useEffect(() => {
    if (!qualityAnalysis || !parsedData) return;
    (async () => {
      try {
        const entry = {
          fileName: parsedData.fileName,
          ts: Date.now(),
          overallScore: qualityAnalysis.overallScore,
          scores: qualityAnalysis.scores
        };
        await fetch('/api/quality-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        })
      } catch (err) {
        console.warn('Failed to persist quality history', err);
      }
    })()
  }, [qualityAnalysis, parsedData]);

  const handleNewUpload = () => {
    sessionStorage.removeItem('parsedData');
    router.push('/');
  };
  const handleDownload = (fmt) => {
    if (!parsedData || !qualityAnalysis) return;
    downloadReport(fmt, parsedData, qualityAnalysis, aiInsights);
  };
  const handleGenerateInsights = async () => {
    if (!qualityAnalysis) return;
    try {
      const insights = await generateAIInsights(qualityAnalysis);
      setAiInsights(insights);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  };

  if (loading) return <div className="analysis-page"><p>Loading analysis...</p></div>;
  if (!parsedData) return null;
  const gradeClass = qualityAnalysis ? (
    qualityAnalysis.overallScore >= 80 ? 'quality-state-excellent'
    : qualityAnalysis.overallScore >= 60 ? 'quality-state-warning'
    : 'quality-state-critical'
  ) : '';

  return (
    <div className="analysis-page">
      <div className="page-header">
        <div>
          <h2>Data Quality Analysis</h2>
          <p>File: <span className="filename">{parsedData.fileName}</span> ({parsedData.rowCount} rows × {parsedData.columnCount} columns)</p>
        </div>
        <div className="header-actions">
          <div className="download-dropdown">
            <button className="btn-secondary download-btn">📄 Download Report</button>
            <div className="dropdown-menu">
              <button onClick={() => handleDownload('txt')}>📝 Text (.txt)</button>
              <button onClick={() => handleDownload('csv')}>📈 CSV (.csv)</button>
              <button onClick={() => handleDownload('json')}>📦 JSON (.json)</button>
            </div>
          </div>
          <button onClick={handleNewUpload} className="btn-primary">Upload New File</button>
        </div>
      </div>

      {parsedData.validation?.issues?.length > 0 && (
        <div className="validation-warnings">
            <h3>Data Validation Issues</h3>
            <ul>
              {parsedData.validation.issues.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
        </div>
      )}

      <div className="layout-grid">
        <div className="section-card">
          <h3>Quality Score</h3>
          {analyzing ? (
            <div className="analyzing-indicator">Analyzing...</div>
          ) : qualityAnalysis ? (
            <div className="quality-score-content">
              <div className="overall-score">
                <div className="score-square" style={{background: scoreColor(qualityAnalysis.overallScore)}}>
                  <span className="score-square-value">{qualityAnalysis.overallScore.toFixed(0)}</span>
                </div>
                <div className="score-metrics">
                  {['completeness','consistency','validity','uniqueness'].map(key => (
                    <div key={key} className="metric-row">
                      <span className="metric-label">{key.charAt(0).toUpperCase()+key.slice(1)}</span>
                      <div className="metric-bar"><div className="metric-bar-fill" style={{width: `${qualityAnalysis.scores[key]}%`, background: scoreColor(qualityAnalysis.scores[key])}} /></div>
                      <span className="metric-value">{qualityAnalysis.scores[key].toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <div className="placeholder">No analysis</div>}
        </div>
        <div className="section-card">
          <h3>Quality Metrics Summary</h3>
          {qualityAnalysis ? (
            <ul className="metrics-summary-list">
              <li><strong>Missing Values:</strong> {qualityAnalysis.missingValues.total} across {Object.keys(qualityAnalysis.missingValues.byColumn).length} columns</li>
              <li><strong>Format Variations:</strong> {qualityAnalysis.issues.filter(i => i.type.includes('format')).length} detected</li>
              <li><strong>Potential Duplicates:</strong> {qualityAnalysis.duplicates?.count || 0}</li>
              <li><strong>Columns Analyzed:</strong> {parsedData.columnCount}</li>
            </ul>
          ) : <p>Loading metrics...</p>}
        </div>
      </div>

      {qualityAnalysis && (
        <div className="section-card">
          <h3>Data Quality Visualizations</h3>
          <DataVisualizations qualityAnalysis={qualityAnalysis} parsedData={parsedData} mode="basic" />
        </div>
      )}

      {qualityAnalysis && (
        <div className="section-card">
          <h3>Quality History</h3>
          <QualityHistory fileName={parsedData.fileName} />
        </div>
      )}

      {qualityAnalysis && (
        <div className="section-card">
          <h3>AI-Powered Insights</h3>
          <AIInsights qualityAnalysis={qualityAnalysis} onGenerateInsights={handleGenerateInsights} insights={aiInsights} />
        </div>
      )}
    </div>
  );
}
