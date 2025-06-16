import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlus } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const CreateRoadmapButton = () => {
  return (
    <motion.div
      variants={fadeIn}
      whileHover={{ y: -5 }}
      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md overflow-hidden mb-8"
    >
      <Link to="/" className="block">
        <div className="p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Create New Roadmap</h3>
            <p className="opacity-90">Start your learning journey with a personalized roadmap</p>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-full">
            <FaPlus className="text-white text-xl" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CreateRoadmapButton;
