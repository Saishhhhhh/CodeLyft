import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

/**
 * A reusable password input component with show/hide toggle
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Input change handler
 * @param {boolean} [props.required=false] - Whether the input is required
 * @param {string} [props.error] - Optional error message to display below input
 */
const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  required = false,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
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
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          style={{ color: colors.textMuted }}
        >
          {showPassword ? (
            <FaEyeSlash className="h-5 w-5" />
          ) : (
            <FaEye className="h-5 w-5" />
          )}
        </button>
        {error && (
          <p className="mt-1 text-sm" style={{ color: colors.error }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default PasswordInput; 