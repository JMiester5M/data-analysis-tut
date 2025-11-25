'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import { parseFile, validateParsedData } from '@/lib/fileProcessing';
import '../../styles/HomePage.css';

export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);

  // Load recent analyses list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/recent-analyses');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setRecent(json.items || []);
      } catch (e) {
        console.warn('Failed to load recent analyses', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleFileSelect = async (file) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Parse the file
      const parsedData = await parseFile(file);
      
      // Validate the parsed data
      const validation = validateParsedData(parsedData);
      
      if (!validation.isValid) {
        const errorMessages = validation.issues
          .filter(issue => issue.type === 'error')
          .map(issue => issue.message)
          .join('. ');
        throw new Error(errorMessages);
      }
      
      // Store parsed data in sessionStorage
      sessionStorage.setItem('parsedData', JSON.stringify({
        ...parsedData,
        validation
      }));
      
      // Navigate to analysis page
      router.push('/analysis');
    } catch (err) {
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process file. Please check the file format and try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="home-page">
      {/* Tagline Box */}
      <div className="tagline-box">
        <h2>Upload Your Dataset</h2>
        <p>Instant AI-Powered Quality Analysis</p>
      </div>

      {/* Upload Card */}
      <div className="upload-card">
        <div className="upload-dropzone-wrapper">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>
        <p className="supported-formats">Supported: CSV, JSON (max 50MB)</p>
        {isProcessing && (
          <div className="processing-indicator">
            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Parsing & validating...</span>
          </div>
        )}
        {error && (
          <div className="error-alert">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h4>Parsing Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Analyses & Quick Tips */}
      <div className="recent-and-tips">
        <div className="recent-analyses">
          <h3>Recent Analyses</h3>
          {recent.length === 0 && <p className="empty-recent">No analyses yet.</p>}
          {recent.length > 0 && (
            <ul>
              {recent.map((r, i) => (
                <li key={i}>
                  <span className="file-name">{r.fileName}</span>
                  <span className="score">Score: {r.score.toFixed(0)} ({r.score >= 80 ? 'Good' : r.score >= 60 ? 'Fair' : 'Poor'})</span>
                  <span className="time">{new Date(r.analyzedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="quick-tips">
          <h3>Quick Tips</h3>
          <ul>
            <li>Ensure column headers are on the first row</li>
            <li>Use consistent date formats (YYYY-MM-DD)</li>
            <li>Remove duplicate rows before uploading</li>
            <li>Prefer lowercase emails for consistency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
