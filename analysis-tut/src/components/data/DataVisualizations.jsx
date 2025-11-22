'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import '../../../styles/DataVisualizations.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DataVisualizations({ qualityAnalysis, parsedData }) {
  if (!qualityAnalysis || !parsedData) {
    return (
      <div className="visualizations-error">
        <p>No data available for visualization</p>
      </div>
    );
  }

  // Quality Scores Bar Chart Data
  const qualityScoresData = useMemo(() => ({
    labels: ['Completeness', 'Uniqueness', 'Validity', 'Consistency'],
    datasets: [
      {
        label: 'Quality Score',
        data: [
          qualityAnalysis.scores.completeness,
          qualityAnalysis.scores.uniqueness,
          qualityAnalysis.scores.validity,
          qualityAnalysis.scores.consistency,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',  // green
          'rgba(59, 130, 246, 0.8)',  // blue
          'rgba(245, 158, 11, 0.8)',  // amber
          'rgba(139, 92, 246, 0.8)',  // purple
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(59, 130, 246)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 2,
      },
    ],
  }), [qualityAnalysis]);

  // Data Type Distribution Pie Chart
  const dataTypeData = useMemo(() => {
    const typeCounts = {};
    Object.values(qualityAnalysis.dataTypes).forEach(typeInfo => {
      typeCounts[typeInfo.type] = (typeCounts[typeInfo.type] || 0) + 1;
    });

    return {
      labels: Object.keys(typeCounts),
      datasets: [
        {
          data: Object.values(typeCounts),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [qualityAnalysis]);

  // Missing Values by Column Bar Chart
  const missingValuesData = useMemo(() => {
    const columns = parsedData.headers.slice(0, 10); // Limit to 10 columns for readability
    const missingCounts = columns.map(
      col => qualityAnalysis.missingValues.byColumn[col]?.count || 0
    );

    return {
      labels: columns,
      datasets: [
        {
          label: 'Missing Values',
          data: missingCounts,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
        },
      ],
    };
  }, [qualityAnalysis, parsedData]);

  // Issues by Severity Pie Chart
  const issuesSeverityData = useMemo(() => {
    const severityCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };

    qualityAnalysis.issues.forEach(issue => {
      severityCounts[issue.severity] = (severityCounts[issue.severity] || 0) + 1;
    });

    return {
      labels: ['High Severity', 'Medium Severity', 'Low Severity'],
      datasets: [
        {
          data: [severityCounts.high, severityCounts.medium, severityCounts.low],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(16, 185, 129, 0.8)',
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(16, 185, 129)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }, [qualityAnalysis]);

  // Chart Options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y.toFixed(1)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => value + '%',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  const missingValuesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} missing values`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="data-visualizations">
      <div className="charts-grid">
        {/* Quality Scores Chart */}
        <div className="chart-card">
          <h4>📊 Quality Dimensions</h4>
          <p className="chart-description">Breakdown of quality scores across all dimensions</p>
          <div className="chart-container">
            <Bar data={qualityScoresData} options={barOptions} />
          </div>
        </div>

        {/* Data Type Distribution */}
        <div className="chart-card">
          <h4>🔢 Data Type Distribution</h4>
          <p className="chart-description">Distribution of data types across columns</p>
          <div className="chart-container">
            <Pie data={dataTypeData} options={pieOptions} />
          </div>
        </div>

        {/* Missing Values by Column */}
        <div className="chart-card chart-card-wide">
          <h4>❌ Missing Values by Column</h4>
          <p className="chart-description">Number of missing values in each column</p>
          <div className="chart-container">
            <Bar data={missingValuesData} options={missingValuesOptions} />
          </div>
        </div>

        {/* Issues by Severity */}
        {qualityAnalysis.issues.length > 0 && (
          <div className="chart-card">
            <h4>⚠️ Issues by Severity</h4>
            <p className="chart-description">Distribution of data quality issues</p>
            <div className="chart-container">
              <Pie data={issuesSeverityData} options={pieOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="visualization-summary">
        <div className="summary-stat">
          <span className="stat-icon">📈</span>
          <div>
            <span className="stat-value">{qualityAnalysis.overallScore.toFixed(0)}%</span>
            <span className="stat-label">Overall Quality</span>
          </div>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">📋</span>
          <div>
            <span className="stat-value">{qualityAnalysis.summary.totalColumns}</span>
            <span className="stat-label">Columns Analyzed</span>
          </div>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">⚠️</span>
          <div>
            <span className="stat-value">{qualityAnalysis.issues.length}</span>
            <span className="stat-label">Issues Found</span>
          </div>
        </div>
        <div className="summary-stat">
          <span className="stat-icon">✅</span>
          <div>
            <span className="stat-value">{qualityAnalysis.scores.completeness.toFixed(0)}%</span>
            <span className="stat-label">Completeness</span>
          </div>
        </div>
      </div>
    </div>
  );
}
