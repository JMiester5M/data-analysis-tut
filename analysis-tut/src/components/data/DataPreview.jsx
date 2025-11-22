'use client';

import { useState, useMemo } from 'react';
import '../../../styles/DataPreview.css';

/**
 * Data Preview Table Component
 * @param {Object} parsedData - Parsed data with headers and rows
 * @param {number} maxRows - Maximum rows to display per page
 * @param {boolean} enableSearch - Enable search functionality
 * @param {boolean} enableSort - Enable column sorting
 */
export default function DataPreview({ 
  parsedData, 
  maxRows = 10,
  enableSearch = true,
  enableSort = true,
  enablePagination = true
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });

  if (!parsedData || !parsedData.rows || !parsedData.headers) {
    return (
      <div className="data-preview-error">
        <p>No data available to preview</p>
      </div>
    );
  }

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm) return parsedData.rows;

    return parsedData.rows.filter(row => {
      return parsedData.headers.some(header => {
        const value = row[header];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [parsedData.rows, parsedData.headers, searchTerm]);

  // Sort rows based on sort configuration
  const sortedRows = useMemo(() => {
    if (!sortConfig.column) return filteredRows;

    const sorted = [...filteredRows].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Try numeric comparison first
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredRows, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / maxRows);
  const startIndex = (currentPage - 1) * maxRows;
  const endIndex = startIndex + maxRows;
  const paginatedRows = enablePagination 
    ? sortedRows.slice(startIndex, endIndex)
    : sortedRows.slice(0, maxRows);

  // Handle column sort
  const handleSort = (column) => {
    if (!enableSort) return;

    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get cell class based on value
  const getCellClass = (value) => {
    if (value === null || value === undefined || value === '') return 'cell-null';
    if (typeof value === 'number' || !isNaN(parseFloat(value))) return 'cell-number';
    if (typeof value === 'boolean' || value === 'true' || value === 'false') return 'cell-boolean';
    return 'cell-string';
  };

  // Format cell value
  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="null-indicator">—</span>;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return String(value);
  };

  return (
    <div className="data-preview">
      {/* Search Bar */}
      {enableSearch && (
        <div className="preview-controls">
          <div className="search-box">
            <svg 
              className="search-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <input
              type="text"
              placeholder="Search in data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="results-info">
            {searchTerm && (
              <span className="search-results">
                {filteredRows.length} of {parsedData.rows.length} rows
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th className="row-number-header">#</th>
                {parsedData.headers.map((header, index) => (
                  <th 
                    key={index}
                    onClick={() => handleSort(header)}
                    className={`
                      ${enableSort ? 'sortable' : ''}
                      ${sortConfig.column === header ? 'sorted' : ''}
                    `}
                  >
                    <div className="header-content">
                      <span className="header-text">{header || `Column ${index + 1}`}</span>
                      {enableSort && (
                        <span className="sort-indicator">
                          {sortConfig.column === header ? (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          ) : '⇅'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rowIndex) => (
                  <tr key={startIndex + rowIndex}>
                    <td className="row-number">{startIndex + rowIndex + 1}</td>
                    {parsedData.headers.map((header, colIndex) => (
                      <td 
                        key={colIndex}
                        className={getCellClass(row[header])}
                      >
                        {formatCellValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={parsedData.headers.length + 1} className="no-results">
                    {searchTerm ? 'No results found' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {enablePagination && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="First page"
          >
            «
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="Previous page"
          >
            ‹
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="Next page"
          >
            ›
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="Last page"
          >
            »
          </button>

          <span className="page-info">
            Page {currentPage} of {totalPages} ({sortedRows.length} rows)
          </span>
        </div>
      )}

      {/* Footer Info */}
      {!enablePagination && parsedData.rows.length > maxRows && (
        <div className="preview-footer">
          <p className="preview-note">
            Showing first {maxRows} of {parsedData.rows.length} rows
          </p>
        </div>
      )}
    </div>
  );
}
