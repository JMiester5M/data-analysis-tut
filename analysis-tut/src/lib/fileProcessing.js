/**
 * File Processing Library
 * Handles CSV and JSON file parsing
 */

import Papa from 'papaparse';

/**
 * Parse a CSV file and return structured data
 * @param {File} file - The CSV file to parse
 * @returns {Promise<Object>} Parsed data with headers and rows
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            error => error.type === 'FieldMismatch' || error.type === 'Quotes'
          );
          
          if (criticalErrors.length > 0) {
            reject({
              message: 'Failed to parse CSV file',
              errors: criticalErrors,
              type: 'ParseError'
            });
            return;
          }
        }

        const headers = results.meta.fields || [];
        const rows = results.data;

        resolve({
          headers,
          rows,
          fileName: file.name,
          fileSize: file.size,
          rowCount: rows.length,
          columnCount: headers.length,
          parseErrors: results.errors,
          metadata: {
            delimiter: results.meta.delimiter,
            linebreak: results.meta.linebreak,
            aborted: results.meta.aborted,
            truncated: results.meta.truncated
          }
        });
      },
      error: (error) => {
        reject({
          message: 'Failed to parse CSV file',
          error: error.message,
          type: 'ParseError'
        });
      }
    });
  });
}

/**
 * Parse a JSON file and return structured data
 * @param {File} file - The JSON file to parse
 * @returns {Promise<Object>} Parsed data with headers and rows
 */
export function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        // Handle array of objects
        if (Array.isArray(data)) {
          if (data.length === 0) {
            reject({
              message: 'JSON file is empty',
              type: 'EmptyFile'
            });
            return;
          }

          // Extract headers from first object
          const headers = Object.keys(data[0]);
          
          resolve({
            headers,
            rows: data,
            fileName: file.name,
            fileSize: file.size,
            rowCount: data.length,
            columnCount: headers.length,
            parseErrors: [],
            metadata: {
              isArray: true
            }
          });
        } 
        // Handle single object
        else if (typeof data === 'object' && data !== null) {
          const headers = Object.keys(data);
          const rows = [data];
          
          resolve({
            headers,
            rows,
            fileName: file.name,
            fileSize: file.size,
            rowCount: 1,
            columnCount: headers.length,
            parseErrors: [],
            metadata: {
              isArray: false
            }
          });
        } 
        else {
          reject({
            message: 'Invalid JSON format. Expected object or array of objects.',
            type: 'InvalidFormat'
          });
        }
      } catch (error) {
        reject({
          message: 'Failed to parse JSON file',
          error: error.message,
          type: 'ParseError'
        });
      }
    };

    reader.onerror = () => {
      reject({
        message: 'Failed to read file',
        type: 'ReadError'
      });
    };

    reader.readAsText(file);
  });
}

/**
 * Detect file type and parse accordingly
 * @param {File} file - The file to parse
 * @returns {Promise<Object>} Parsed data
 */
export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'json':
      return parseJSON(file);
    default:
      throw {
        message: `Unsupported file type: .${extension}`,
        type: 'UnsupportedFileType'
      };
  }
}

/**
 * Validate parsed data structure
 * @param {Object} parsedData - The parsed data to validate
 * @returns {Object} Validation result
 */
export function validateParsedData(parsedData) {
  const issues = [];

  // Check if data exists
  if (!parsedData.rows || parsedData.rows.length === 0) {
    issues.push({
      type: 'error',
      message: 'No data rows found in file'
    });
  }

  // Check if headers exist
  if (!parsedData.headers || parsedData.headers.length === 0) {
    issues.push({
      type: 'error',
      message: 'No column headers found in file'
    });
  }

  // Check for duplicate headers
  const headerCounts = {};
  parsedData.headers?.forEach(header => {
    headerCounts[header] = (headerCounts[header] || 0) + 1;
  });
  
  const duplicates = Object.entries(headerCounts)
    .filter(([_, count]) => count > 1)
    .map(([header, _]) => header);
  
  if (duplicates.length > 0) {
    issues.push({
      type: 'warning',
      message: `Duplicate column names found: ${duplicates.join(', ')}`
    });
  }

  // Check for empty headers
  const emptyHeaders = parsedData.headers?.filter(h => !h || h.trim() === '');
  if (emptyHeaders && emptyHeaders.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found ${emptyHeaders.length} column(s) with empty names`
    });
  }

  // Check row consistency
  if (parsedData.rows && parsedData.rows.length > 0) {
    const expectedColumns = parsedData.headers.length;
    const inconsistentRows = parsedData.rows.filter(row => {
      const rowColumns = Object.keys(row).length;
      return rowColumns !== expectedColumns;
    });

    if (inconsistentRows.length > 0) {
      issues.push({
        type: 'warning',
        message: `${inconsistentRows.length} row(s) have inconsistent column counts`
      });
    }
  }

  return {
    isValid: issues.filter(i => i.type === 'error').length === 0,
    issues
  };
}

/**
 * Get file information without parsing full content
 * @param {File} file - The file to inspect
 * @returns {Object} File information
 */
export function getFileInfo(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const sizeInKB = (file.size / 1024).toFixed(2);
  const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

  return {
    name: file.name,
    extension: extension,
    size: file.size,
    sizeFormatted: file.size < 1024 * 1024 
      ? `${sizeInKB} KB` 
      : `${sizeInMB} MB`,
    type: file.type || 'unknown',
    lastModified: new Date(file.lastModified),
    isSupported: ['csv', 'json'].includes(extension)
  };
}
