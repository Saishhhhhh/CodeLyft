import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaBookOpen, FaFileImport, FaPlus, FaTools } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const EmptyState = ({ onImport }) => {
  return (
    <motion.div 
      variants={fadeIn}
      className="bg-white rounded-xl shadow-md p-10 text-center"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaBookOpen className="text-gray-400 text-3xl" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Your roadmap collection is empty</h2>
      <p className="text-gray-500 mb-8 max-w-lg mx-auto">
        Create your first learning roadmap to organize your educational journey or import an existing one.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onImport}
          className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <FaFileImport className="mr-2" /> Import a Roadmap
        </button>
        <Link 
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" /> Create a Roadmap
        </Link>
        <Link 
          to="/custom-roadmap"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaTools className="mr-2" /> Create Custom Roadmap
        </Link>
      </div>
    </motion.div>
  );
};

export default EmptyState; 