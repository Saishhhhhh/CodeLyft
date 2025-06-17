import { useEffect, useRef } from 'react';

/**
 * Simple hook for one-way animations
 * Elements animate in when they enter the viewport and stay animated
 */
const useSimpleAnimation = () => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only handle animation when elements enter the viewport
          if (entry.isIntersecting) {
            // Find all animation elements
            const animatedElements = entry.target.querySelectorAll('.animate-on-scroll');
            
            // Add animation class with staggered delay
            animatedElements.forEach((element, index) => {
              setTimeout(() => {
                element.classList.add('animated');
              }, index * 100);
            });
            
            // Once elements are animated, unobserve the section
            // This ensures elements stay animated permanently
            observer.unobserve(entry.target);
          }
        });
      },
      { 
        threshold: 0.15,
        rootMargin: '-20% 0px'
      }
    );
    
    // Observe the section
    observer.observe(sectionRef.current);
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return sectionRef;
};

export default useSimpleAnimation;
