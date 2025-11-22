import '../../styles/globals.css';

export const metadata = {
  title: 'Data Quality Analyzer',
  description: 'Analyze your data files for quality, completeness, and insights',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>
          <div className="header-container">
            <div className="header-content">
              <div className="logo-section">
                <svg 
                  className="logo-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
                <h1>Data Quality Analyzer</h1>
              </div>
              <nav>
                <a href="/">Upload</a>
                <a href="/analysis">Analysis</a>
              </nav>
            </div>
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer>
          <div className="footer-container">
            <p>© {new Date().getFullYear()} Data Quality Analyzer. Built with Next.js & AI.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
