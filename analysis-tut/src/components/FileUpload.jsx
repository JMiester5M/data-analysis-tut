'use client';

import React, { useState, useCallback, useRef } from 'react';
import '../../styles/FileUpload.css';

export default function FileUpload({ 
  onFileSelect, 
  acceptedFormats = ['.csv', '.json'],
  maxSizeMB = 10 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = (file) => {
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit`;
    }

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(extension)) {
      return `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    return null;
  };

  const handleFile = useCallback((file) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const uploadedFileData = {
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream'
    };

    setUploadedFile(uploadedFileData);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="file-upload-container">
      {!uploadedFile ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            className="file-input-hidden"
          />
          
          <div className="drop-zone-content">
            <svg 
              className={`upload-icon ${isDragging ? 'active' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            
            <div>
              <p className="drop-zone-title">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="drop-zone-subtitle">
                or click to browse
              </p>
            </div>
            
            <div className="drop-zone-info">
              <p>Accepted formats: {acceptedFormats.join(', ')}</p>
              <p>Maximum file size: {maxSizeMB}MB</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="file-preview">
          <div className="file-preview-content">
            <div className="file-info">
              <div className="file-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </div>
              
              <div className="file-details">
                <h3>{uploadedFile.name}</h3>
                <p>{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              className="remove-button"
              aria-label="Remove file"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>
          
          <div className="success-message">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            File uploaded successfully
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
