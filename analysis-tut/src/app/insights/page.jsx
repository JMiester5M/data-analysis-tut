"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeDataQuality } from '@/lib/dataAnalysis';
import { generateAIInsights } from '@/lib/aiIntegration';
import AIInsights from '@/components/data/AIInsights';
import '../../../styles/InsightsPage.css';

export default function InsightsPage() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem('parsedData');
    if (!raw) { router.push('/'); return; }
    try {
      const data = JSON.parse(raw);
      setParsedData(data);
      const qa = analyzeDataQuality(data);
      setQualityAnalysis(qa);
    } catch (e) {
      console.error('Failed to load insights', e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

 const handleGenerate = async () => {
  if (!qualityAnalysis) return;
  console.log('Button clicked, generating AI insights'); // <- Debug
  try {
    const res = await fetch('app/api/ai-insights/route.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataAnalysis: qualityAnalysis }),
    });
    if (!res.ok) throw new Error('AI API call failed');
    const data = await res.json();
    console.log('AI response:', data); // <- Debug
    setAiInsights(data);
  } catch (err) {
    console.error('AI generation failed:', err);
    alert('Failed to generate AI insights. Check console for details.');
  }
};

  if (loading) return <div className="insights-page"><p>Loading insights...</p></div>;
  if (!parsedData) return null;

  // Helper to classify column severity
  const classifyColumn = (stats) => {
    if (!stats) return 'none';
    const missingPct = stats.missing?.percentage || 0;
    const uniquePct = stats.uniquePercentage || 100;
    if (missingPct > 20 || uniquePct < 40) return 'high';
    if (missingPct > 5 || uniquePct < 70) return 'medium';
    return 'low';
  };

  // Suggested fixes heuristics
  const suggestedFixes = (header, stats) => {
    const fixes = [];
    if (stats.missing?.count) fixes.push(`Fill or remove ${stats.missing.count} missing values (${stats.missing.percentage.toFixed(1)}%).`);
    if (stats.type?.type === 'string') fixes.push('Standardize casing & trim whitespace.');
    if (stats.uniquePercentage < 50 && stats.type?.type === 'string') fixes.push('Consider normalization / reference table.');
    if (stats.type?.type === 'number' && stats.missing?.count === 0) fixes.push('Validate numeric range constraints.');
    if (!fixes.length) fixes.push('No fixes required.');
    return fixes;
  };

  const [open, setOpen] = useState({});
  const toggle = (col) => setOpen(o => ({...o, [col]: !o[col]}));

  return (
    <div className="insights-page">
      <div className="page-header">
        <div>
          <h2>Detailed Insights</h2>
          <p>File: <span className="filename">{parsedData.fileName}</span> • {parsedData.rowCount} rows × {parsedData.columnCount} columns</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.push('/analysis')}>← Back to Analysis</button>
        </div>
      </div>

      {qualityAnalysis && (
        <div className="section-card">
          <h3>Column Insights</h3>
          <div className="columns-accordion">
            {Object.keys(qualityAnalysis.columnStats).map((col, i) => {
              const stats = qualityAnalysis.columnStats[col];
              const sev = classifyColumn(stats);
              const openState = open[col];
              return (
                <div key={col} className={`column-panel severity-${sev}`}> 
                  <button className="column-panel-header" onClick={() => toggle(col)}>
                    <span className="triangle">{openState ? '▼' : '▶'}</span>
                    <span className="column-name">{col} ({stats.type?.type || stats.type})</span>
                    <span className="issue-count-label">{sev === 'low' ? 'No Issues ✓' : `${sev.charAt(0).toUpperCase()+sev.slice(1)} Issues`}</span>
                  </button>
                  {openState && (
                    <div className="column-panel-body">
                      <div className="panel-section">
                        <h4>Analysis Details</h4>
                        <ul className="details-list">
                          <li>Type: {stats.type?.type || stats.type}</li>
                          <li>Missing: {stats.missing.count} ({stats.missing.percentage.toFixed(1)}%)</li>
                          <li>Unique Values: {stats.unique} ({stats.uniquePercentage.toFixed(1)}%)</li>
                          <li>Duplicates: {stats.duplicates || 0}</li>
                        </ul>
                      </div>
                      <div className="panel-section">
                        <h4>Suggested Fixes</h4>
                        <ol className="fixes-list">
                          {suggestedFixes(col, stats).map((f, idx) => <li key={idx}>{f}</li>)}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {qualityAnalysis && (
        <div className="section-card">
          <h3>Prioritized Actions</h3>
          <ol className="priority-actions">
            {qualityAnalysis.issues.filter(i => i.severity === 'high').map((issue, i) => (
              <li key={`high-${i}`}>[High] {issue.type.replace(/_/g,' ')} in {issue.column || 'dataset'} • Address immediately.</li>
            ))}
            {qualityAnalysis.issues.filter(i => i.severity === 'medium').map((issue, i) => (
              <li key={`med-${i}`}>[Medium] {issue.type.replace(/_/g,' ')} in {issue.column || 'dataset'} • Schedule fix.</li>
            ))}
            {qualityAnalysis.issues.filter(i => i.severity === 'low').map((issue, i) => (
              <li key={`low-${i}`}>[Low] {issue.type.replace(/_/g,' ')} • Optional optimization.</li>
            ))}
            {qualityAnalysis.issues.length === 0 && <li>No action required.</li>}
          </ol>
        </div>
      )}

      {qualityAnalysis && (
        <div className="section-card">
          <h3>AI Enhancement Suggestions</h3>
          <div className="ai-insights-preview">
            <p>Total Columns: {qualityAnalysis.columnStats ? Object.keys(qualityAnalysis.columnStats).length : 0}</p>
            <p>Total Issues: {qualityAnalysis.issues?.length || 0}</p>
          </div>
          <AIInsights
            qualityAnalysis={qualityAnalysis}
            insights={aiInsights}            // parent state
            onGenerate={handleGenerate}
            />
        </div>
      )}

      <div className="section-card">
        <h3>Navigation</h3>
        <p>Use the analysis page for charts or return to preview to inspect raw rows.</p>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <button className="btn-secondary" onClick={() => router.push('/preview')}>Preview</button>
          <button className="btn-primary" onClick={() => router.push('/analysis')}>Analysis</button>
        </div>
      </div>
    </div>
  );
}
