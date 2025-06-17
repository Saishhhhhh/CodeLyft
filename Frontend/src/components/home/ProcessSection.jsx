import { motion } from 'framer-motion';
import { FaQuestionCircle, FaRoad, FaYoutube, FaChartLine, FaMobile, FaBrain, FaRobot, FaShieldAlt, FaBitcoin, FaDatabase, FaServer, FaCloud } from 'react-icons/fa';
import { FaJs, FaPython, FaReact, FaNodeJs, FaAws, FaDocker, FaAngular, FaVuejs, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiMongodb, SiTensorflow, SiFlutter, SiEthereum, SiKubernetes, SiRedis, SiPostgresql, SiGraphql, SiRust } from 'react-icons/si';

const ProcessSection = ({ colors, darkMode }) => {
  const steps = [
    {
      icon: FaQuestionCircle,
      title: "Tell Us What You Want to Learn",
      description: "Share your goals and answer 3 quick questions",
      color: "#3B82F6"
    },
    {
      icon: FaRoad,
      title: "Get Your Roadmap",
      description: "Receive a personalized learning path",
      color: "#10B981"
    },
    {
      icon: FaYoutube,
      title: "Learn with Videos",
      description: "Access curated YouTube tutorials",
      color: "#EF4444"
    },
    {
      icon: FaChartLine,
      title: "Track Progress",
      description: "Mark completed items as you learn",
      color: "#8B5CF6"
    }
  ];

  const technologies = [
    { name: 'React', icon: FaReact, color: '#61DAFB' }, // Web Development
    { name: 'Flutter', icon: SiFlutter, color: '#02569B' }, // App Development
    { name: 'TensorFlow', icon: SiTensorflow, color: '#FF6F00' }, // Machine Learning
    { name: 'Docker', icon: FaDocker, color: '#2496ED' }, // DevOps
    { name: 'Kali', icon: FaShieldAlt, color: '#557C94' }, // Cybersecurity
    { name: 'Ethereum', icon: SiEthereum, color: '#627EEA' }, // Blockchain
    { name: 'Kubernetes', icon: SiKubernetes, color: '#326CE5' }, // Cloud Native
    { name: 'PostgreSQL', icon: SiPostgresql, color: '#336791' }, // Database
    { name: 'GraphQL', icon: SiGraphql, color: '#E10098' }, // API
    { name: 'Redis', icon: SiRedis, color: '#DC382D' }, // Caching
    { name: 'Rust', icon: SiRust, color: '#000000' }, // Systems Programming
    { name: 'AWS', icon: FaAws, color: '#FF9900' }, // Cloud Computing
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  return (
    <div id="how-it-works" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 15
            }
          }}
        >
          <h2 className="text-4xl font-extrabold tracking-tight mb-4" style={{ color: colors.text }}>
            How It Works
          </h2>
          <p className="max-w-2xl mx-auto text-xl" style={{ color: colors.textMuted }}>
            Your personalized learning journey in four simple steps
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-16">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative"
              >
                {/* Step Number */}
                <div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ 
                    backgroundColor: step.color,
                    color: '#FFFFFF'
                  }}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center text-center pt-4 pb-8 md:pb-0">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transform transition-all duration-300 hover:scale-110"
                    style={{ 
                      backgroundColor: `${step.color}20`,
                      boxShadow: `0 0 20px ${step.color}40`
                    }}
                  >
                    <step.icon 
                      size={28}
                      style={{ color: step.color }}
                    />
                  </div>
                  <h3 
                    className="text-lg font-bold mb-2"
                    style={{ color: colors.text }}
                  >
                    {step.title}
                  </h3>
                  <p 
                    className="text-sm"
                    style={{ color: colors.textMuted }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Tech Stack */}
        <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-8 md:pb-16">
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {technologies.map((tech, index) => {
              const Icon = tech.icon;
              return (
                <motion.div 
                  key={index}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 10
                    }
                  }}
                  className="group relative"
                >
                  <div 
                    className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl transition-all duration-300 backdrop-blur-sm"
                    style={{ 
                      backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(249, 250, 251, 0.6)',
                      border: `1px solid ${colors.border}`,
                      boxShadow: `0 4px 10px ${colors.shadow}`
                    }}
                  >
                    <div className="relative">
                      <Icon 
                        className="mx-auto mb-2 md:mb-3 transform transition-transform duration-300 group-hover:scale-110"
                        size={28}
                        style={{ 
                          color: tech.color,
                          filter: `drop-shadow(0 0 8px ${tech.color}80)`
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                        style={{ backgroundColor: tech.color }}
                      />
                    </div>
                    <span 
                      className="font-medium text-xs md:text-sm transition-colors duration-300"
                      style={{ color: colors.text }}
                    >
                      {tech.name}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          
          {/* And many more text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ 
              opacity: 1, 
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: 0.2
              }
            }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <p className="text-xl font-medium" style={{ color: colors.textMuted }}>
              And many more...
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSection; 