import { useTheme } from '../../context/ThemeContext';

/**
 * A reusable form input component for text, email, etc.
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.type - Input type (text, email, etc.)
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Input change handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {string} [props.error] - Error message for the input
 */
const FormInput = ({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  error
}) => {
  const { darkMode } = useTheme();

  // Define colors based on theme
  const colors = {
    primary: darkMode ? '#8B5CF6' : '#4F46E5', // Vibrant purple for dark mode, Indigo for light
    secondary: darkMode ? '#10B981' : '#059669', // Emerald
    accent: darkMode ? '#F59E0B' : '#D97706', // Amber
    tertiary: darkMode ? '#EC4899' : '#DB2777', // Pink
    
    // Background colors
    background: darkMode ? '#0F172A' : '#ffffff', // Deeper blue-black for dark mode
    inputBg: darkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)', // Semi-transparent input background
    
    // Text colors
    text: darkMode ? '#F8FAFC' : '#111827', // Brighter white for dark mode
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Slate 400 for better readability
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Slate 600 for more visible borders
    error: darkMode ? '#EF4444' : '#DC2626', // Red for errors
  };

  return (
    <div>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium mb-2"
        style={{ color: colors.text }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            error ? 'border-2' : 'border'
          }`}
          style={{ 
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.error : colors.border,
            color: colors.text,
            boxShadow: error ? `0 0 0 1px ${colors.error}` : 'none',
          }}
        />
        {error && (
          <p className="mt-1 text-sm" style={{ color: colors.error }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FormInput; 