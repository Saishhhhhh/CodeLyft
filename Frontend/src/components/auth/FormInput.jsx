import { motion } from 'framer-motion';

/**
 * A reusable form input component for text, email, etc.
 * @param {Object} props - Component props
 * @param {string} props.id - Input ID
 * @param {string} props.type - Input type (text, email, etc.)
 * @param {string} props.label - Input label
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Input change handler
 * @param {string} [props.placeholder] - Input placeholder
 * @param {boolean} [props.required=true] - Whether the input is required
 * @param {string} [props.helpText] - Optional help text to display below input
 * @param {string} [props.className] - Additional class names for the container
 */
const FormInput = ({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder = "",
  required = true,
  helpText,
  className = "",
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-200 mb-1">
          {label}
        </label>
      )}
      <motion.input
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
        placeholder={placeholder}
        required={required}
        aria-label={label || id}
      />
      {helpText && (
        <p className="mt-1 text-xs text-gray-400">{helpText}</p>
      )}
    </div>
  );
};

export default FormInput; 