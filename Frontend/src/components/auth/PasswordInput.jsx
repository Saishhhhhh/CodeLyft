import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

/**
 * A reusable password input component with show/hide toggle
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Input change handler
 * @param {string} [props.placeholder="••••••••"] - Input placeholder
 * @param {boolean} [props.required=true] - Whether the input is required
 * @param {string} [props.helpText] - Optional help text to display below input
 * @param {string} [props.className] - Additional class names for the container
 */
const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  placeholder = "••••••••",
  required = true,
  helpText,
  className = "",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-200 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <motion.input
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
          type={showPassword ? "text" : "password"}
          id={id}
          value={value}
          onChange={onChange}
          className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
          placeholder={placeholder}
          required={required}
          aria-label={label || "Password"}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {helpText && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default PasswordInput; 