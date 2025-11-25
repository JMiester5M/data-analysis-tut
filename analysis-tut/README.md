# Data Analysis Platform

This is a data quality analysis platform that helps users quickly assess, understand, and improve their CSV/JSON datasets. It provides instant quality scoring, issue detection, AI-powered insights, and historical tracking.

## Features

- **CSV/JSON Upload & Parsing**: Robust file parsing that handles messy, real-world data
- **Automated Data Quality Scoring**: Multi-dimensional scoring across completeness, uniqueness, validity, and consistency
- **Issue Detection**: Identifies missing values, duplicates, format inconsistencies, and data anomalies
- **Plain-Language Explanations**: AI-powered summaries of quality issues in simple, non-technical language
- **SQL Recommendations**: Auto-generated cleanup steps and SQL queries to remediate issues
- **Quality History Tracking**: Monitor dataset quality over time with server-side persistence
- **Recent Analyses**: Quick access to recently analyzed files
- **AI-Powered Insights**: Uses OpenAI to generate actionable recommendations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19 with TypeScript support
- **Data Parsing**: Papa Parse (CSV) + native JSON support
- **Visualization**: Chart.js + react-chartjs-2
- **Database**: lowdb (file-based JSON for development; upgrade to SQLite/Postgres for production)
- **AI Integration**: OpenAI API (server-side)
- **Styling**: Custom CSS with responsive design

## Project Structure

```
src/
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.jsx                 # Home page (recent analyses)
│   ├── analysis/
│   │   └── page.jsx             # Analysis results page
│   └── api/
│       ├── ai-insights/route.js # AI insights generation
│       ├── quality-history/route.js
│       └── recent-analyses/route.js
├── components/
│   ├── FileUpload.tsx           # File upload UI
│   ├── data/
│   │   ├── AIInsights.tsx
│   │   ├── DataVisualizations.jsx
│   │   └── QualityHistory.jsx
│   ├── QualityScore.tsx
│   └── DataPreview.tsx
├── lib/
│   ├── dataAnalysis.js          # Core scoring & detection logic
│   ├── fileProcessing.js        # CSV/JSON parsing
│   ├── qualityUtils.js          # Plain-language explanations & SQL snippets
│   ├── aiIntegration.js         # OpenAI client wrapper
│   ├── db.js                    # File-based database (lowdb)
│   └── reportGenerator.js       # Export reports (TXT, CSV, JSON)
└── types/
    └── DataTypes.ts            # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for AI insights feature)

### Installation

1. Clone the repository and install dependencies:
```bash
cd analysis-tut
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the `analysis-tut` directory:
```
OPENAI_API_KEY=sk-your-key-here
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Upload & Analyze

1. Click the upload area or drag-and-drop a CSV/JSON file
2. The system parses and analyzes the file automatically
3. View quality scores, detected issues, and visualizations
4. Review AI-generated insights and recommendations

### Quality Scoring

The platform calculates quality across four dimensions:

- **Completeness**: % of non-empty values across columns
- **Uniqueness**: % of unique records and low-cardinality penalties
- **Validity**: % of data matching expected formats/patterns
- **Consistency**: % of consistent data types across columns

Overall score = average of the four dimensions

### Detecting Issues

The system identifies:

- Missing/null values (by column)
- Duplicate rows
- Format inconsistencies (mixed data types, date format variations)
- Low-cardinality columns (potential ID/key columns with poor uniqueness)
- Outliers and anomalies

### Server-side Persistence

All analysis history is stored server-side in `data/db.json` using lowdb. No client-side `localStorage` is used for persistence.

**Available API endpoints:**

- `GET /api/recent-analyses` — list of 5 most recent analyses
- `POST /api/recent-analyses` — save a recent analysis entry
- `GET /api/quality-history?fileName=...` — quality history for a specific file (optional fileName filter)
- `POST /api/quality-history` — save a quality history snapshot

### Exporting Reports

From the analysis page, download reports in three formats:

- **Text (.txt)** — human-readable summary
- **CSV (.csv)** — tabular data (scores, metrics, issues)
- **JSON (.json)** — complete analysis payload (programmatic use)

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for AI insights | Yes |

## Development

### Build

```bash
npm run build
```

### Run Production Build Locally

```bash
npm run start
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm run test
```

## Database & Persistence

### Current Setup (Development)

Uses **lowdb** for file-based JSON persistence:

- DB file: `data/db.json`
- Auto-created on first server startup
- Stores quality history and recent analyses

### Production Recommendations

For multi-instance or production deployments, migrate to:

- **SQLite** (file-based SQL via `better-sqlite3`)
- **PostgreSQL** (shared DB for distributed deployments)
- **MongoDB** (if you need a document DB)

Update `src/lib/db.js` with the appropriate driver and schema.

### Migrating localStorage Data (Optional)

If you have browser-stored `localStorage` data from earlier versions, run these snippets in the browser console while the dev server is running:

**Quality history migration:**
```javascript
(async () => {
  const raw = localStorage.getItem('qualityHistory');
  if (!raw) return console.log('No qualityHistory found');
  const arr = JSON.parse(raw || '[]');
  for (const entry of arr.slice().reverse()) {
    try {
      await fetch('/api/quality-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error('Failed to migrate entry', entry, e);
    }
  }
  console.log('Quality history migration done');
})();
```

**Recent analyses migration:**
```javascript
(async () => {
  const raw = localStorage.getItem('recentAnalyses');
  if (!raw) return console.log('No recentAnalyses found');
  const arr = JSON.parse(raw || '[]');
  for (const entry of arr.reverse()) {
    try {
      await fetch('/api/recent-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error('Failed to migrate recent entry', entry, e);
    }
  }
  console.log('Recent analyses migration done');
})();
```

## Deployment

### Vercel

Recommended hosting for Next.js:

1. Push code to GitHub
2. Connect repo to Vercel
3. Set `OPENAI_API_KEY` in environment variables
4. Deploy

For persistent DB, consider:
- Vercel Postgres (managed PostgreSQL)
- Vercel KV (Redis for caching)
- Or externally hosted database

### Self-Hosted

1. Build: `npm run build`
2. Start: `npm start`
3. Use a proper database (SQLite, Postgres, etc.)
4. Configure reverse proxy (Nginx, etc.) for HTTPS

## Troubleshooting

### Dev server exits with code 130

- Check terminal output for the first error (usually cause of exit)
- Verify all dependencies installed: `npm install`
- Clear `.next` cache: `rm -rf .next && npm run dev`
- Check for port conflicts: try `npm run dev -- -p 3001`

### Upload fails or parsing errors

- Ensure CSV has headers on first row
- Verify file size < 50MB
- Check for non-standard delimiters (only standard CSV supported)
- Try a smaller test file first

### AI insights not generating

- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has available credits
- Review server logs for API errors
- System will fall back to template insights if AI unavailable

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature description"`
3. Push and open a pull request

## Support

For issues, questions, or feature requests, open an issue on GitHub or contact the project maintainer.
