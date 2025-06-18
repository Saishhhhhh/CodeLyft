import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  darkMode 
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Show max 5 page numbers
  const getVisiblePages = () => {
    if (totalPages <= 5) return pages;
    
    if (currentPage <= 3) return pages.slice(0, 5);
    if (currentPage >= totalPages - 2) return pages.slice(totalPages - 5);
    
    return pages.slice(currentPage - 3, currentPage + 2);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      {/* Previous button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          p-2 rounded-lg transition-colors duration-200
          ${darkMode
            ? currentPage === 1
              ? 'bg-gray-800 text-gray-600'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : currentPage === 1
              ? 'bg-gray-100 text-gray-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${currentPage === 1 ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Previous page"
      >
        <FaChevronLeft className="w-4 h-4" />
      </motion.button>

      {/* Page numbers */}
      {visiblePages.map((page) => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`
            w-10 h-10 rounded-lg transition-colors duration-200
            ${page === currentPage
              ? darkMode
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-500 text-white'
              : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {page}
        </motion.button>
      ))}

      {/* Next button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          p-2 rounded-lg transition-colors duration-200
          ${darkMode
            ? currentPage === totalPages
              ? 'bg-gray-800 text-gray-600'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            : currentPage === totalPages
              ? 'bg-gray-100 text-gray-400'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
          ${currentPage === totalPages ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Next page"
      >
        <FaChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default Pagination; 