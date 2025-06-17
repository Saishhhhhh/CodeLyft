import { FaJs, FaPython, FaReact, FaNodeJs, FaAws, FaDocker, FaAngular, FaVuejs, FaGitAlt } from 'react-icons/fa';
import { SiTypescript, SiMongodb, SiTensorflow } from 'react-icons/si';
import { motion } from 'framer-motion';

const TechStackSection = ({ colors, darkMode }) => {
  const technologies = [
    { name: "JavaScript", color: "#F7DF1E", icon: FaJs },
    { name: "Python", color: "#3776AB", icon: FaPython },
    { name: "React", color: "#61DAFB", icon: FaReact },
    { name: "Node.js", color: "#339933", icon: FaNodeJs },
    { name: "AWS", color: "#FF9900", icon: FaAws },
    { name: "Docker", color: "#2496ED", icon: FaDocker },
    { name: "TypeScript", color: "#3178C6", icon: SiTypescript },
    { name: "Angular", color: "#DD0031", icon: FaAngular },
    { name: "Vue.js", color: "#4FC08D", icon: FaVuejs },
    { name: "MongoDB", color: "#47A248", icon: SiMongodb },
    { name: "TensorFlow", color: "#FF6F00", icon: SiTensorflow },
    { name: "Git", color: "#F05032", icon: FaGitAlt }
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
      y: 20,
      scale: 0.8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-12"
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
            Learn Any Tech Stack
          </h2>
          <p className="max-w-2xl mx-auto text-xl" style={{ color: colors.textMuted }}>
            From web development to machine learning, we've got you covered
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
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
                  className="flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 backdrop-blur-sm"
                  style={{ 
                    backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(249, 250, 251, 0.6)',
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 4px 10px ${colors.shadow}`
                  }}
                >
                  <div className="relative">
                    <Icon 
                      className="mx-auto mb-3 transform transition-transform duration-300 group-hover:scale-110"
                      size={32}
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
                    className="font-medium text-sm transition-colors duration-300"
                    style={{ color: colors.text }}
                  >
                    {tech.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default TechStackSection;
