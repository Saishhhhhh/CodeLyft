import { useEffect, useRef } from 'react';

/**
 * Simple hook for basic scroll animations
 * Adds animation classes when elements enter the viewport
 */
const useBasicScrollAnimation = () => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When element enters viewport
          if (entry.isIntersecting) {
            // Find all animation elements
            const animatedElements = entry.target.querySelectorAll('.animate-on-scroll');
            
            // Add animation class to each element
            animatedElements.forEach((element, index) => {
              // Add staggered delay based on data attribute or index
              const delay = element.dataset.delay || index * 100;
              element.style.transitionDelay = `${delay}ms`;
              element.classList.add('animated');
            });
          }
        });
      },
      { threshold: 0.1 } // Trigger when at least 10% of the element is visible
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

export default useBasicScrollAnimation;
