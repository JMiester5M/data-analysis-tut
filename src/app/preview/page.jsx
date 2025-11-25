"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataPreview from '@/components/data/DataPreview';
import ColumnDetails from '@/components/data/ColumnDetails';
import QualityScore from '@/components/data/QualityScore';
import { analyzeDataQuality } from '@/lib/dataAnalysis';
import '../../../styles/PreviewPage.css';

export default function PreviewPage() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem('parsedData');
    if (!raw) { router.push('/'); return; }
    try {
      const data = JSON.parse(raw);
      setParsedData(data);
      // Simulate progressive analysis to show progress bar
      let pct = 0;
      const interval = setInterval(() => {
        pct += Math.random() * 25 + 10; // random increments
        if (pct >= 100) {
          pct = 100;
          clearInterval(interval);
          const qa = analyzeDataQuality(data);
          setQualityAnalysis(qa);
        }
        setProgress(pct);
      }, 180);
    } catch (e) {
      console.error('Failed to load preview', e);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <div className="preview-page"><p>Loading preview...</p></div>;
  if (!parsedData) return null;

  return (
    <div className="preview-page">
      <div className="page-header">
        <div>
          <h2>Data Preview</h2>
          <p>File: <span className="filename">{parsedData.fileName}</span> • {parsedData.rowCount} rows × {parsedData.columnCount} columns</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => router.push('/analysis')}>Go to Analysis →</button>
        </div>
      </div>

      {/* Progress Bar */}
      {!qualityAnalysis && (
        <div className="progress-box">
          <div className="progress-header">
            <span>Analyzing...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{width: `${progress}%`}} /></div>
        </div>
      )}

      <div className="layout-grid" style={{gridTemplateColumns: '360px 1fr'}}>
        <div className="section-card">
          <h3>Quality Overview</h3>
          {qualityAnalysis ? <QualityScore qualityAnalysis={qualityAnalysis} /> : <p>Analyzing...</p>}
        </div>
        <div className="section-card">
          <h3>Sample Data</h3>
          <DataPreview parsedData={parsedData} maxRows={25} />
        </div>
      </div>

      {qualityAnalysis && (
        <div className="section-card">
          <h3>Column Details</h3>
          <ColumnDetails qualityAnalysis={qualityAnalysis} />
        </div>
      )}

      <div className="section-card">
        <h3>Next Steps</h3>
        <ul>
          <li>Review column metrics for anomalies.</li>
          <li>Proceed to detailed quality analysis.</li>
          <li>Generate AI insights to prioritize fixes.</li>
        </ul>
        <button className="btn-primary" onClick={() => router.push('/analysis')}>Run Full Analysis</button>
      </div>
    </div>
  );
}
