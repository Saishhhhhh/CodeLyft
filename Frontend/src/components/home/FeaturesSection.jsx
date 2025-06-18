const FeaturesSection = ({ colors, darkMode }) => {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4" style={{ color: colors.text }}>
            How CodeLyft Works
          </h2>
          <p className="max-w-2xl mx-auto text-lg" style={{ color: colors.textMuted }}>
            Our AI-powered platform creates personalized learning experiences tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="rounded-lg p-6 transition-all duration-200 hover:shadow-md backdrop-blur-sm" style={{ 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(249, 250, 251, 0.8)',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 4px 15px ${colors.shadow}`
          }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.primary}20` }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.primary} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              Personalized Roadmaps
            </h3>
            <p style={{ color: colors.textMuted }}>
              Custom learning paths tailored to your experience level and specific goals
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-lg p-6 transition-all duration-200 hover:shadow-md backdrop-blur-sm" style={{ 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(249, 250, 251, 0.8)',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 4px 15px ${colors.shadow}`
          }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.secondary}20` }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.secondary} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              Curated YouTube Content
            </h3>
            <p style={{ color: colors.textMuted }}>
              The best free videos and playlists, automatically organized for optimal learning
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-lg p-6 transition-all duration-200 hover:shadow-md backdrop-blur-sm" style={{ 
            backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(249, 250, 251, 0.8)',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 4px 15px ${colors.shadow}`
          }}>
            <div className="w-12 h-12 rounded-md flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.accent}20` }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={colors.accent} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              Progress Tracking
            </h3>
            <p style={{ color: colors.textMuted }}>
              Track your learning journey with intuitive checklists and milestone achievements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
