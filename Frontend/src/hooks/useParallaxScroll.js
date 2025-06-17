import { useEffect, useRef } from 'react';

/**
 * Custom hook for parallax scroll animations
 * This hook creates animations that are directly tied to the scroll position
 */
const useParallaxScroll = () => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far the section is from the center of the viewport
      // normalized to a value between -1 and 1
      // -1: section is fully below the viewport
      // 0: section is centered in the viewport
      // 1: section is fully above the viewport
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = (viewportCenter - sectionCenter) / (windowHeight / 2);
      
      // Only animate when the section is visible or partially visible
      if (rect.bottom > 0 && rect.top < windowHeight) {
        // Find all elements with parallax classes
        const leftElements = section.querySelectorAll('.parallax-left');
        const rightElements = section.querySelectorAll('.parallax-right');
        const topElements = section.querySelectorAll('.parallax-top');
        const bottomElements = section.querySelectorAll('.parallax-bottom');
        const fadeElements = section.querySelectorAll('.parallax-fade');
        
        // Calculate the progress value (0 to 1) based on section visibility
        // 0: just entered viewport from bottom
        // 1: fully visible and centered
        const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
        
        // Apply transformations based on scroll position
        leftElements.forEach(element => {
          const translateX = -100 + (progress * 100);
          element.style.transform = `translateX(${translateX}px)`;
          element.style.opacity = progress;
        });
        
        rightElements.forEach(element => {
          const translateX = 100 - (progress * 100);
          element.style.transform = `translateX(${translateX}px)`;
          element.style.opacity = progress;
        });
        
        topElements.forEach(element => {
          const translateY = -100 + (progress * 100);
          element.style.transform = `translateY(${translateY}px)`;
          element.style.opacity = progress;
        });
        
        bottomElements.forEach(element => {
          const translateY = 100 - (progress * 100);
          element.style.transform = `translateY(${translateY}px)`;
          element.style.opacity = progress;
        });
        
        fadeElements.forEach(element => {
          element.style.opacity = progress;
        });
      }
    };
    
    // Initial calculation
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return sectionRef;
};

export default useParallaxScroll; 