import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client (server-side only)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { dataAnalysis } = body;

    if (!dataAnalysis) {
      return NextResponse.json(
        { error: 'Data analysis is required' },
        { status: 400 }
      );
    }

    const { overallScore, scores, issues, summary, columnStats } = dataAnalysis;

    // Build context for AI
    const context = {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'high').length,
      mediumIssues: issues.filter(i => i.severity === 'medium').length,
      lowIssues: issues.filter(i => i.severity === 'low').length,
      dataSize: `${summary.totalRows} rows × ${summary.totalColumns} columns`
    };

    // Generate insights using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a data quality expert who explains analysis results in plain, non-technical language. 
Your explanations should be clear, actionable, and accessible to business users without technical backgrounds.
Focus on practical impact and specific recommendations.`
        },
        {
          role: 'user',
          content: `Analyze this dataset quality report and provide insights:

Dataset Summary:
- Total Rows: ${summary.totalRows}
- Total Columns: ${summary.totalColumns}
- Overall Quality Score: ${overallScore.toFixed(1)}/100

Quality Dimensions:
- Completeness: ${scores.completeness.toFixed(1)}/100 (${summary.missingCells} missing values)
- Uniqueness: ${scores.uniqueness.toFixed(1)}/100 (${summary.duplicateRows} duplicates)
- Validity: ${scores.validity.toFixed(1)}/100
- Consistency: ${scores.consistency.toFixed(1)}/100

Top Issues:
${issues.slice(0, 5).map(issue => `- ${issue.description} [${issue.severity}]`).join('\n')}

Column Details:
${Object.entries(columnStats).slice(0, 5).map(([col, stats]) => 
  `- ${col}: ${stats.type.type} (${stats.missing.percentage.toFixed(1)}% missing, ${stats.unique} unique values)`
).join('\n')}

Please provide:
1. A brief summary of the overall data quality (2-3 sentences)
2. The top 3 most critical issues and their business impact
3. Specific, actionable recommendations to improve quality
4. An assessment of whether this data is ready for analysis or needs cleaning

Format your response as JSON with this structure:
{
  "summary": "overall assessment",
  "criticalIssues": [
    {"issue": "description", "impact": "business impact", "severity": "high/medium/low"}
  ],
  "recommendations": [
    {"title": "short title", "description": "detailed action", "priority": "high/medium/low"}
  ],
  "readiness": {"ready": true/false, "reason": "explanation"}
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const aiResponse = completion.choices[0].message.content;

    return NextResponse.json({
      ...aiResponse,
      generated: new Date().toISOString(),
      model: 'gpt-4o-mini',
      context: context
    });

  } catch (error) {
    console.error('AI Insights generation failed:', error);
    
    // Return fallback insights on error
    return NextResponse.json({
      summary: `This dataset has an overall quality score of ${body.dataAnalysis.overallScore.toFixed(0)}/100. ${
        body.dataAnalysis.overallScore >= 90 ? 'The data appears to be in excellent condition.' :
        body.dataAnalysis.overallScore >= 70 ? 'The data quality is acceptable but has some issues to address.' :
        'The data quality needs significant improvement before analysis.'
      }`,
      criticalIssues: body.dataAnalysis.issues
        .filter(i => i.severity === 'high')
        .slice(0, 3)
        .map(issue => ({
          issue: issue.description,
          impact: 'This may affect the reliability of analysis results.',
          severity: issue.severity
        })),
      recommendations: [
        {
          title: 'Address Missing Values',
          description: 'Review columns with high percentages of missing data and determine appropriate handling strategies.',
          priority: 'high'
        },
        {
          title: 'Remove Duplicates',
          description: 'Identify and remove duplicate records to improve data uniqueness.',
          priority: 'medium'
        },
        {
          title: 'Standardize Data Types',
          description: 'Ensure consistent data types across all columns.',
          priority: 'medium'
        }
      ],
      readiness: {
        ready: body.dataAnalysis.overallScore >= 70,
        reason: body.dataAnalysis.overallScore >= 70 
          ? 'The data quality is sufficient for initial analysis.'
          : 'Significant data cleaning is recommended before proceeding with analysis.'
      },
      generated: new Date().toISOString(),
      model: 'fallback',
      context: {
        totalIssues: body.dataAnalysis.issues.length,
        criticalIssues: body.dataAnalysis.issues.filter(i => i.severity === 'high').length,
        mediumIssues: body.dataAnalysis.issues.filter(i => i.severity === 'medium').length,
        lowIssues: body.dataAnalysis.issues.filter(i => i.severity === 'low').length,
        dataSize: `${body.dataAnalysis.summary.totalRows} rows × ${body.dataAnalysis.summary.totalColumns} columns`
      },
      error: true,
      errorMessage: 'AI service temporarily unavailable, showing fallback insights'
    }, { status: 200 }); // Return 200 with fallback data
  }
}
