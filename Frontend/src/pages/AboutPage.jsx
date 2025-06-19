import { useTheme } from '../context/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import Footer from '../components/home/Footer';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutPage = () => {
  const { darkMode } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef(null);

  // Define colors based on theme - Using the provided color palette
  const colors = {
    // Primary and accent colors
    primary: darkMode ? '#4F46E5' : '#4F46E5', // Indigo - main brand color
    secondary: darkMode ? '#DA2C38' : '#DA2C38', // YouTube Red - accent color
    accent: darkMode ? '#8B5CF6' : '#8B5CF6', // Purple - complementary accent
    
    // Background colors
    background: darkMode ? '#111827' : '#F9F9F9', // Dark Gray / Light Gray
    cardBg: darkMode ? '#1E293B' : '#FFFFFF', // Darker background / White
    
    // Text colors
    text: darkMode ? '#FFFFFF' : '#111827', // White / Dark Gray for better visibility
    textMuted: darkMode ? '#CBD5E1' : '#6B7280', // Lighter gray / Medium gray for better visibility
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    codeBg: darkMode ? '#0F172A' : '#F3F4F6', // Dark blue-black / Light gray
    codeText: darkMode ? '#4F46E5' : '#4F46E5', // Indigo for consistency
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  // Handle mouse movement for subtle background effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!backgroundRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized mouse position (-1 to 1)
      const normalizedX = (clientX / innerWidth) * 2 - 1;
      const normalizedY = (clientY / innerHeight) * 2 - 1;
      
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation variants for content sections
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-hidden pt-16" style={{ 
      backgroundColor: colors.background
    }}>
      {/* Simple background */}
      <div ref={backgroundRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Simple subtle background */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: darkMode ? 
              `radial-gradient(circle at 50% 50%, ${colors.primary}08, ${colors.background} 80%)` : 
              `radial-gradient(circle at 50% 50%, ${colors.primary}03, ${colors.background} 80%)`,
            opacity: 0.7
          }}
        />
      </div>

      {/* Content - Left aligned for better readability */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section - Responsive */}
        <motion.div 
          className="text-center mb-12 sm:mb-16 md:mb-20"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6" style={{ color: colors.text }}>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { 
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1]
                }
              }}
            >
              Code<span style={{ color: colors.primary }}>Lyft</span>
            </motion.span>
          </h1>
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl font-light tracking-wide" 
            style={{ 
              color: colors.textMuted,
              fontFamily: "'Inter', 'Montserrat', sans-serif",
              letterSpacing: '0.02em'
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              transition: { delay: 0.3, duration: 0.8 }
            }}
          >
            Learn What Matters. Track What Counts.
          </motion.p>
        </motion.div>

        {/* Our Story Section - Left aligned for better readability */}
        <motion.div 
          className="mb-16 sm:mb-20 md:mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8" style={{ color: colors.text }}>
            Our <span style={{ color: colors.primary }}>Story</span>
          </h2>
          
          <div className={`prose prose-lg max-w-none ${darkMode ? 'prose-invert' : ''}`} style={{ color: colors.text }}>
            <motion.p 
              className="text-lg leading-relaxed mb-6"
              variants={fadeInLeft}
              style={{ color: colors.text }}
            >
              <strong>CodeLyft</strong> was born out of a very real and frustrating problem — not knowing where or how to start learning tech.
            </motion.p>
            
            <motion.p 
              className="text-lg leading-relaxed mb-6"
              variants={fadeInLeft}
              style={{ color: colors.text }}
            >
              Like many of my friends and peers, I was constantly overwhelmed by questions like:
            </motion.p>
            
            <motion.ul 
              className="space-y-3 mb-8 list-none pl-0"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {[
                "Where should I start coding?",
                "What should I learn next?",
                "Should I buy a course or not?",
                "Which YouTube playlist is actually good?",
                "Why am I stuck in tutorial hell?"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  className="pl-6 relative"
                  variants={fadeInLeft}
                  style={{ color: colors.text }}
                >
                  <span className="absolute left-0 w-3 h-3 top-[0.4rem] rounded-full" style={{ 
                    backgroundColor: colors.secondary,
                    boxShadow: `0 0 5px ${colors.secondary}80`
                  }}></span>
                  {item}
                </motion.li>
              ))}
            </motion.ul>
            
            <motion.p 
              className="text-lg leading-relaxed mb-6"
              variants={fadeInLeft}
              style={{ color: colors.text }}
            >
              These struggles led me to build something that I wish existed earlier — a platform where you can simply enter a topic or technology and instantly get the best learning resources from YouTube.
            </motion.p>
            
            <motion.p 
              className="text-lg leading-relaxed"
              variants={fadeInLeft}
              style={{ color: colors.text }}
            >
              As I dug deeper into this idea, it evolved into something more powerful:
              A full learning ecosystem that not only helps you start but also keeps you moving — with progress tracking and personalized roadmaps.
            </motion.p>
          </div>
        </motion.div>

        {/* What Makes CodeLyft Unique Section - Improved design */}
        <motion.div 
          className="mb-16 sm:mb-20 md:mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6" style={{ color: colors.text }}>
            What Makes <strong style={{ color: colors.primary }}>CodeLyft</strong> Unique
          </h2>
          
          <p className="text-base sm:text-lg mb-8 sm:mb-10" style={{ color: colors.textMuted }}>
            <strong>CodeLyft</strong> is not just a resource aggregator. It's a complete learning companion.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            {[
              {
                title: "Personalized Roadmaps",
                description: "Tell us what you want to learn, and we generate a step-by-step roadmap tailored to your experience and goals.",
                icon: "🗺️"
              },
              {
                title: "Best Free YouTube Resources",
                description: "Curated from thousands of videos, we bring you only what matters — the best playlists and lectures for each topic.",
                icon: "🎬"
              },
              {
                title: "Progress Tracking",
                description: "Every completed topic and watched resource feels like an achievement. You can track everything in one clean, focused dashboard.",
                icon: "📊"
              },
              {
                title: "Talk to Your Roadmap",
                description: "A smart chatbot that lets you ask questions about any technology, specific topic, or even the video you're currently watching — like a 24/7 mentor.",
                icon: "💬"
              },
              {
                title: "Custom Roadmaps",
                description: "Build your own tech learning path using your favorite resources — or let the platform recommend them for you.",
                icon: "🛠️"
              },
              {
                title: "Distraction-Free Learning",
                description: "Watch videos directly within CodeLyft without the noise of YouTube's recommendations or ads.",
                icon: "🧠"
              }
            ].map((feature, index) => (
                <motion.div
                key={index}
                className="relative"
                variants={scaleIn}
                >
                <div
                    className="p-6 h-full border rounded-lg shadow-sm hover:shadow-xl transition-all duration-300"
                                         style={{
                     background: darkMode
                         ? 'linear-gradient(135deg, rgba(30,41,59,0.6), rgba(49,46,129,0.4))'
                         : 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(221,214,254,0.6))',
                     borderColor: darkMode ? 'rgba(79,70,229,0.4)' : '#c4b5fd',
                     boxShadow: darkMode
                         ? '0 4px 8px rgba(0,0,0,0.2)'
                         : '0 4px 12px rgba(139,92,246,0.15)',
                     }}
                >
                    <div className="flex items-center mb-4">
                    <span className="text-3xl mr-4" style={{ color: darkMode ? '#a78bfa' : '#6d28d9' }}>
                        {feature.icon}
                    </span>
                    <h3 className="text-xl font-bold font-poppins" style={{ color: colors.text }}>
                        {feature.title}
                    </h3>
                    </div>
                    <p
                    style={{
                        color: colors.textMuted,
                        fontWeight: darkMode ? '400' : 'normal'
                    }}
                    >
                    {feature.description}
                    </p>
                </div>
                </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works Section - Improved design */}
        <motion.div 
          className="mb-16 sm:mb-20 md:mb-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-10" style={{ color: colors.text }}>
            How It <span style={{ color: colors.primary }}>Works</span>
          </h2>
          
          <div className="space-y-12 sm:space-y-16">
            {[
              {
                number: "01",
                title: "Prompt Your Goal",
                description: `Tell us what you want to learn. For example: "I want to learn DevOps."`
              },
              {
                number: "02",
                title: "Answer 3 Smart Questions",
                description: "Based on your experience level, interest, and depth of learning, we personalize your roadmap."
              },
              {
                number: "03",
                title: "Get Your Roadmap + Resources",
                description: "We generate a clean, sequenced roadmap with the best free YouTube videos for each topic. You can even add your own."
              },
              {
                number: "04",
                title: "Track and Learn",
                description: "Progress tracking lets you see what you've completed. You can watch videos, take markdown notes, and ask questions — all in one place."
              },
              {
                number: "05",
                title: "Explore Side Quests",
                description: "Want to build your own path? Use the Custom Roadmap feature to create your personalized tech journey with your handpicked or AI-recommended resources."
              }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                className="relative"
                variants={fadeInLeft}
                custom={index}
              >
                <div className="flex flex-col sm:flex-row items-start">
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <motion.div 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: darkMode 
                          ? 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(79,70,229,0.1))' 
                          : 'linear-gradient(135deg, rgba(237,233,254,0.9), rgba(221,214,254,0.7))',
                        borderColor: darkMode ? '#4f46e5' : '#c4b5fd',
                        border: `1px solid ${darkMode ? 'rgba(79,70,229,0.5)' : 'rgba(139,92,246,0.3)'}`,
                        boxShadow: darkMode
                          ? '0 4px 12px rgba(79,70,229,0.2)'
                          : '0 4px 12px rgba(79,70,229,0.1)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <span className="text-lg font-bold" style={{ color: darkMode ? '#a78bfa' : '#6d28d9' }}>{step.number}</span>
                    </motion.div>
                  </div>
                  <div className="sm:ml-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3" style={{ color: colors.text }}>{step.title}</h3>
                    <p className="text-base sm:text-lg" style={{ 
                      color: colors.textMuted,
                      fontWeight: darkMode ? '400' : 'normal'
                    }}>{step.description}</p>
                  </div>
                </div>
                
                {/* Connector line between steps (except for the last one) */}
                {index < 4 && (
                  <div 
                    className="absolute left-6 sm:left-7 top-12 sm:top-14 w-px h-12 sm:h-16 -translate-x-1/2 hidden sm:block" 
                    style={{ 
                      background: darkMode 
                        ? 'linear-gradient(to bottom, rgba(167,139,250,0.3), rgba(167,139,250,0.05))' 
                        : 'linear-gradient(to bottom, rgba(109,40,217,0.3), rgba(109,40,217,0.05))',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section - Improved */}
        <motion.div 
          className="py-12 px-6 sm:py-16 sm:px-8 rounded-lg mb-20"
          style={{
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(49,46,129,0.2))' 
              : 'linear-gradient(135deg, rgba(237,233,254,0.7), rgba(221,214,254,0.5))',
            borderColor: darkMode ? 'rgba(79,70,229,0.3)' : '#c4b5fd',
            border: `1px solid ${darkMode ? 'rgba(79,70,229,0.3)' : 'rgba(139,92,246,0.3)'}`,
            boxShadow: darkMode
              ? '0 8px 16px rgba(0,0,0,0.2)'
              : '0 8px 20px rgba(139,92,246,0.15)'
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="text-center">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6" 
              style={{ color: colors.text }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: { duration: 0.6 }
              }}
              viewport={{ once: true }}
            >
              Ready to Start Your Learning Journey?
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: 0.2, duration: 0.5 }
              }}
              viewport={{ once: true }}
            >
              <Link to="/roadmap-test">
                <motion.button 
                  className="px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-all duration-300 text-white"
                  style={{ 
                    background: darkMode 
                      ? 'linear-gradient(135deg, #4f46e5, #6d28d9)' 
                      : 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                    boxShadow: darkMode
                      ? '0 4px 12px rgba(79,70,229,0.4)'
                      : '0 4px 12px rgba(139,92,246,0.3)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: darkMode
                      ? '0 6px 16px rgba(79,70,229,0.5)'
                      : '0 6px 16px rgba(139,92,246,0.4)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Your Roadmap
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer colors={colors} darkMode={darkMode} />
    </div>
  );
};

export default AboutPage; 