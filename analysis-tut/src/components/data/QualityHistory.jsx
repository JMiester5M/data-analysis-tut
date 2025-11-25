 'use client';

import { useEffect, useState } from 'react';
import '../../../styles/DataVisualizations.css';

export default function QualityHistory({ fileName }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const url = new URL('/api/quality-history', window.location.href);
        if (fileName) url.searchParams.set('fileName', fileName);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setHistory(json.items || []);
      } catch (e) {
        console.warn('Failed to load quality history', e);
        if (mounted) setHistory([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fileName]);

  if (!history || history.length === 0) {
    return (
      <div className="chart-card">
        <h4>📈 Quality History</h4>
        <p className="chart-description">No historical data available yet.</p>
      </div>
    );
  }

  return (
    <div className="chart-card chart-card-wide">
      <h4>📈 Quality History</h4>
      <p className="chart-description">Recent dataset quality scores</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>File</th>
              <th>Overall</th>
              <th>Completeness</th>
              <th>Uniqueness</th>
              <th>Validity</th>
              <th>Consistency</th>
            </tr>
          </thead>
          <tbody>
            {history.slice(0, 50).map((h, i) => (
              <tr key={i}>
                <td>{new Date(h.ts).toLocaleString()}</td>
                <td>{h.fileName}</td>
                <td>{(h.overallScore || 0).toFixed(0)}%</td>
                <td>{(h.scores?.completeness || 0).toFixed(0)}%</td>
                <td>{(h.scores?.uniqueness || 0).toFixed(0)}%</td>
                <td>{(h.scores?.validity || 0).toFixed(0)}%</td>
                <td>{(h.scores?.consistency || 0).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
