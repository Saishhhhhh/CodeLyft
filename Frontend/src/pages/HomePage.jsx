import { useTheme } from '../context/ThemeContext';
import { useEffect, useState, useRef } from 'react';
import HeroSection from '../components/home/HeroSection';
import CtaSection from '../components/home/CtaSection';
import Footer from '../components/home/Footer';
import {
  PersonalizedRoadmapSection,
  YoutubeResourcesSection,
  ProgressTrackingSection,
  CustomRoadmapSection,
  AnimationWrapper
} from '../components/home/ScrollSections';
import ProcessSection from '../components/home/ProcessSection';

const HomePage = () => {
  const { darkMode } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const requestRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const sectionRefs = useRef([]);

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
    text: darkMode ? '#F9F9F9' : '#111827', // Light Gray / Dark Gray
    textMuted: darkMode ? '#94A3B8' : '#6B7280', // Light gray / Medium gray
    
    // UI elements
    border: darkMode ? '#334155' : '#E5E7EB', // Medium-dark gray / Light gray
    codeBg: darkMode ? '#0F172A' : '#F3F4F6', // Dark blue-black / Light gray
    codeText: darkMode ? '#4F46E5' : '#4F46E5', // Indigo for consistency
    shadow: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)', // Shadows
  };

  // Initialize interactive dots
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const updateDimensions = () => {
      if (!canvasRef.current) return;
      const { width, height } = canvasRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      
      const canvas = canvasRef.current;
      canvas.width = width;
      canvas.height = height;
      
      // Initialize dots
      const dotSpacing = 40;
      const dots = [];
      
      for (let x = 0; x < width; x += dotSpacing) {
        for (let y = 0; y < height; y += dotSpacing) {
          // Add some randomness to dot positions
          const offsetX = Math.random() * 10 - 5;
          const offsetY = Math.random() * 10 - 5;
          
          dots.push({
            x: x + offsetX,
            y: y + offsetY,
            originalX: x + offsetX,
            originalY: y + offsetY,
            size: 2,
            color: Math.random() > 0.5 ? 
              darkMode ? `${colors.primary}60` : `${colors.primary}80` : 
              darkMode ? `${colors.secondary}60` : `${colors.secondary}80`,
            speedFactor: 0.8 + Math.random() * 0.4 // Random speed variation
          });
        }
      }
      
      dotsRef.current = dots;
      renderDots();
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      cancelAnimationFrame(requestRef.current);
    };
  }, [darkMode, colors.primary, colors.secondary]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!backgroundRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate normalized mouse position (-1 to 1)
      const normalizedX = (clientX / innerWidth) * 2 - 1;
      const normalizedY = (clientY / innerHeight) * 2 - 1;
      
      // Get position relative to the canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      const x = rect ? clientX - rect.left : clientX;
      const y = rect ? clientY - rect.top : clientY;
      
      setMousePosition({ x: normalizedX, y: normalizedY, canvasX: x, canvasY: y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate dots based on mouse position
  useEffect(() => {
    const animateDots = () => {
      if (!dotsRef.current.length || !mousePosition.canvasX) {
        requestRef.current = requestAnimationFrame(animateDots);
        return;
      }
      
      const { canvasX, canvasY } = mousePosition;
      const interactionRadius = 100; // How far the mouse influence reaches
      const maxDistance = 20; // Maximum distance a dot can move
      
      dotsRef.current.forEach(dot => {
        const dx = canvasX - dot.originalX;
        const dy = canvasY - dot.originalY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < interactionRadius) {
          // Calculate repulsion strength (stronger when closer)
          const strength = (interactionRadius - distance) / interactionRadius;
          
          // Calculate repulsion direction (away from mouse)
          const angle = Math.atan2(dy, dx);
          
          // Apply repulsion
          const repulsionX = Math.cos(angle) * maxDistance * strength * dot.speedFactor;
          const repulsionY = Math.sin(angle) * maxDistance * strength * dot.speedFactor;
          
          dot.x = dot.originalX - repulsionX;
          dot.y = dot.originalY - repulsionY;
        } else {
          // Return to original position with easing
          dot.x += (dot.originalX - dot.x) * 0.1;
          dot.y += (dot.originalY - dot.y) * 0.1;
        }
      });
      
      renderDots();
      requestRef.current = requestAnimationFrame(animateDots);
    };
    
    animateDots();
    return () => cancelAnimationFrame(requestRef.current);
  }, [mousePosition]);

  // Render dots on canvas
  const renderDots = () => {
    if (!canvasRef.current || !dotsRef.current.length) return;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    dotsRef.current.forEach(dot => {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();
    });
  };

  return (
    <div className="min-h-screen transition-colors duration-300 relative overflow-hidden" style={{ 
      backgroundColor: colors.background
    }}>
      {/* Global Background Elements */}
      <div ref={backgroundRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Solid background color overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundColor: darkMode ? '#4F46E510' : '#4F46E508',
            opacity: 1,
            transform: `translate(${mousePosition.x * -5}px, ${mousePosition.y * -5}px)`,
            transition: 'transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)'
          }}
        />

        {/* Interactive dot grid overlay */}
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0 w-full h-full"
          style={{
            opacity: darkMode ? 0.4 : 0.5,
          }}
        />

        {/* Decorative shapes */}
        <div className="hidden sm:block absolute -top-20 -right-20 w-96 h-96 rounded-full" style={{
          background: `radial-gradient(circle, ${darkMode ? `${colors.primary}20` : `${colors.primary}30`} 0%, ${darkMode ? `${colors.primary}05` : `${colors.primary}10`} 50%, transparent 70%)`,
          filter: darkMode ? 'blur(25px)' : 'blur(20px)',
          animation: darkMode ? 'float 15s ease-in-out infinite' : 'none',
          transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`,
          transition: 'transform 0.5s cubic-bezier(0.33, 1, 0.68, 1)'
        }}/>

        <div className="hidden sm:block absolute bottom-1/4 -left-20 w-80 h-80 rounded-full" style={{
          background: `radial-gradient(circle, ${darkMode ? `${colors.secondary}20` : `${colors.secondary}30`} 0%, ${darkMode ? `${colors.secondary}05` : `${colors.secondary}10`} 50%, transparent 70%)`,
          filter: darkMode ? 'blur(25px)' : 'blur(20px)',
          animation: darkMode ? 'float 18s ease-in-out infinite reverse' : 'none',
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 10}px)`,
          transition: 'transform 0.7s cubic-bezier(0.33, 1, 0.68, 1)'
        }}/>

        <div className="hidden lg:block absolute top-1/3 right-1/4 w-64 h-64 rounded-full" style={{
          background: `radial-gradient(circle, ${darkMode ? `${colors.accent}15` : `${colors.accent}20`} 0%, ${darkMode ? `${colors.accent}03` : `${colors.accent}05`} 50%, transparent 70%)`,
          filter: darkMode ? 'blur(30px)' : 'blur(25px)',
          animation: darkMode ? 'float 20s ease-in-out infinite' : 'none',
          transform: `translate(${mousePosition.x * -15}px, ${mousePosition.y * 12}px)`,
          transition: 'transform 0.9s cubic-bezier(0.33, 1, 0.68, 1)'
        }}/>

        {/* Add CSS keyframes for the animations */}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0px) }
            50% { transform: translateY(-10px) }
            100% { transform: translateY(0px) }
          }
        `}</style>
      </div>

      {/* Content - Optimized for smooth scrolling */}
      <div className="relative z-10">
        {/* Hero Section - Full Screen */}
        <section className="full-screen-section min-h-[90vh] flex items-center">
          <HeroSection colors={colors} darkMode={darkMode} />
        </section>
        
        {/* Scroll Sections - Each Full Screen */}
        <section className="full-screen-section min-h-[100vh] md:min-h-screen py-16 md:py-0 flex items-center">
          <div className="w-full">
            <PersonalizedRoadmapSection colors={colors} />
          </div>
        </section>
        
        <section className="full-screen-section min-h-[100vh] md:min-h-screen py-16 md:py-0 flex items-center">
          <div className="w-full">
            <YoutubeResourcesSection colors={colors} />
          </div>
        </section>
        
        <section className="full-screen-section min-h-[100vh] md:min-h-screen py-16 md:py-0 flex items-center">
          <div className="w-full">
            <ProgressTrackingSection colors={colors} />
          </div>
        </section>
        
        <section className="full-screen-section min-h-[100vh] md:min-h-screen py-16 md:py-0 flex items-center">
          <div className="w-full">
            <CustomRoadmapSection colors={colors} />
          </div>
        </section>
        
        {/* Process Section with Tech Stack */}
        <section className="py-12 md:py-16">
          <div className="w-full">
            <ProcessSection colors={colors} darkMode={darkMode} />
          </div>
        </section>
        
        {/* CTA and Footer section - Fixed to bottom */}
        <section className="mt-auto">
          <div className="w-full">
            <CtaSection colors={colors} />
          </div>
        </section>
        
        {/* Footer in its own section to ensure it's at the bottom */}
        <div className="w-full mt-auto">
          <Footer colors={colors} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;