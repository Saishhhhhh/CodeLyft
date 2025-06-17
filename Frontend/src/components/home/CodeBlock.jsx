const CodeBlock = ({ colors, darkMode }) => {
  // Define syntax highlighting colors based on theme
  const syntaxColors = {
    keyword: darkMode ? '#C084FC' : '#9333EA', // Purple - keywords like const, await
    function: darkMode ? '#34D399' : '#10B981', // Green - function names
    string: colors.codeText, // Amber - string literals
    comment: darkMode ? '#94A3B8' : '#6B7280', // Gray - comments
    variable: colors.text, // Default text color - variables and objects
    punctuation: colors.text, // Default text color - punctuation
    method: darkMode ? '#60A5FA' : '#2563EB', // Blue - methods
  };

  return (
    <div className="text-left mb-12 rounded-lg overflow-hidden shadow-lg" style={{ 
      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.8)' : colors.codeBg,
      border: `1px solid ${colors.border}`,
      boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 8px 30px rgba(0, 0, 0, 0.12)'
    }}>
      <div className="px-4 py-2 flex items-center" style={{ 
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(243, 244, 246, 0.7)'
      }}>
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="ml-4 text-sm font-medium" style={{ color: colors.textMuted }}>muftcode.js</div>
      </div>
      <div className="p-6">
        <div className="mb-2">
          <span style={{ color: syntaxColors.keyword }}>const</span>
          <span style={{ color: syntaxColors.variable }}> learningPath </span>
          <span style={{ color: syntaxColors.keyword }}>=</span>
          <span style={{ color: syntaxColors.keyword }}> await</span>
          <span style={{ color: syntaxColors.variable }}> MuftCode.</span>
          <span style={{ color: syntaxColors.function }}>generate</span>
          <span style={{ color: syntaxColors.punctuation }}>(</span>
          <span style={{ color: syntaxColors.string }}>'your learning goal'</span>
          <span style={{ color: syntaxColors.punctuation }}>);</span>
        </div>
        <div className="mb-2">
          <span style={{ color: syntaxColors.variable }}>learningPath.</span>
          <span style={{ color: syntaxColors.function }}>start</span>
          <span style={{ color: syntaxColors.punctuation }}>();</span>
          <span style={{ color: syntaxColors.comment }}> // Begin your learning journey</span>
        </div>
        <div>
          <span style={{ color: syntaxColors.keyword }}>const</span>
          <span style={{ color: syntaxColors.variable }}> success </span>
          <span style={{ color: syntaxColors.keyword }}>=</span>
          <span style={{ color: syntaxColors.variable }}> learningPath.</span>
          <span style={{ color: syntaxColors.function }}>trackProgress</span>
          <span style={{ color: syntaxColors.punctuation }}>();</span>
          <span style={{ color: syntaxColors.comment }}> // Track your achievements</span>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
