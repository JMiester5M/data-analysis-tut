/**
 * Quality Utilities
 * Generate human-readable explanations and SQL recommendations
 */

function humanizeColumn(col) {
  return `Column "${col}"`;
}

export function generateExplanations(issues = [], columnStats = {}, parsedData = {}) {
  // Returns an array of short, plain-language explanations for each issue
  const explanations = issues.map(issue => {
    if (issue.type === 'missing') {
      return {
        title: `${humanizeColumn(issue.column)} has missing values`,
        text: `${humanizeColumn(issue.column)} is missing ${issue.count} value(s) (${issue.description.match(/\((.*)\)/)?.[1] || ''}). These missing values can cause incomplete analysis and errors.`
      };
    }

    if (issue.type === 'duplicate') {
      return {
        title: `Duplicate rows detected`,
        text: `The dataset contains ${issue.count} duplicate row(s). Duplicate rows can bias aggregates and reporting.`
      };
    }

    if (issue.type === 'inconsistent') {
      return {
        title: `${humanizeColumn(issue.column)} has mixed data types`,
        text: `${humanizeColumn(issue.column)} contains values of different types or formats which reduces reliability (confidence ${Math.round((issue.confidence||0)*100)}%).`
      };
    }

    if (issue.type === 'format') {
      return {
        title: `${humanizeColumn(issue.column)} has inconsistent formatting`,
        text: `${humanizeColumn(issue.column)} shows mixed formatting (e.g. some values use currency symbols or commas). This makes numeric aggregation unreliable.`
      };
    }

    if (issue.type === 'outlier') {
      return {
        title: `Outliers in ${issue.column}`,
        text: `${humanizeColumn(issue.column)} has ${issue.count} outlier(s) (${issue.description}). Outliers can skew averages and should be reviewed.`
      };
    }

    return {
      title: issue.type || 'Issue',
      text: issue.description || 'An issue was detected.'
    };
  });

  return explanations;
}

export function generateRecommendations(issues = [], columnStats = {}, parsedData = {}) {
  // Return a list of recommended fixes and SQL snippets
  const recommendations = [];

  issues.forEach(issue => {
    if (issue.type === 'missing') {
      const col = issue.column;
      recommendations.push({
        title: `Fill or handle missing values in ${col}`,
        recommendation: `Decide on a strategy: remove rows, fill with a default, or impute values. Example SQL to set NULLs to a default:\n\nUPDATE dataset_table\nSET \"${col}\" = 'UNKNOWN'\nWHERE \"${col}\" IS NULL;`,
        sql: `-- Replace NULLs in ${col}\nUPDATE dataset_table\nSET \"${col}\" = 'UNKNOWN'\nWHERE \"${col}\" IS NULL;`
      });
    }

    if (issue.type === 'duplicate') {
      recommendations.push({
        title: 'Remove duplicate rows',
        recommendation: `Identify and remove duplicates based on a primary key or by exact-match. Example (Postgres):\n\nWITH dedup AS (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY *) AS rn\n  FROM dataset_table\n)\nDELETE FROM dataset_table\nWHERE ctid IN (SELECT ctid FROM dedup WHERE rn > 1);`,
        sql: `-- Remove exact duplicate rows (example approach, adapt for your DB)\nDELETE FROM dataset_table a\nUSING dataset_table b\nWHERE a.ctid < b.ctid\n  AND a.col1 = b.col1\n  AND a.col2 = b.col2;`
      });
    }

    if (issue.type === 'inconsistent' || issue.type === 'format') {
      const col = issue.column;
      recommendations.push({
        title: `Standardize ${col} formatting`,
        recommendation: `Normalize values (remove currency symbols, trim whitespace, unify date formats). Example SQL to strip symbols and cast to numeric:\n\nUPDATE dataset_table\nSET \"${col}\" = REPLACE(REPLACE(\"${col}\", '$', ''), ',', '')::numeric\nWHERE \"${col}\" IS NOT NULL;`,
        sql: `-- Strip currency symbols and cast to numeric\nUPDATE dataset_table\nSET \"${col}\" = CAST(REGEXP_REPLACE(\"${col}\", '[^0-9.-]', '', 'g') AS NUMERIC)\nWHERE \"${col}\" IS NOT NULL;`
      });
    }

    if (issue.type === 'outlier') {
      const col = issue.column;
      recommendations.push({
        title: `Review outliers in ${col}`,
        recommendation: `Inspect and decide to cap, remove, or keep outliers. Example SQL to find extreme values:\n\nSELECT * FROM dataset_table\nORDER BY \"${col}\" DESC\nLIMIT 50;`,
        sql: `-- Select potential outliers in ${col}\nSELECT * FROM dataset_table\nWHERE \"${col}\" IS NOT NULL\nORDER BY \"${col}\" DESC\nLIMIT 100;`
      });
    }
  });

  // If no specific recommendations, add a general cleanup suggestion
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'General cleanup',
      recommendation: 'Run a schema validation and normalize formats. Consider using a staging table to transform and validate before inserting into the production table.',
      sql: '-- Example: create staging table, load raw data, run transformations, then insert into final table'
    });
  }

  return recommendations;
}

export default { generateExplanations, generateRecommendations };
