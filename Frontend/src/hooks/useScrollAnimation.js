import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle scroll-driven animations
 * @returns {React.RefObject} - Ref to attach to the element to be animated
 */
const useScrollAnimation = () => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Only animate when the section is visible or partially visible
      if (rect.bottom > 0 && rect.top < windowHeight) {
        // Calculate the progress value (0 to 1) based on section visibility
        // 0: just entered viewport from bottom
        // 1: fully visible and centered
        const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height / 2)));
        
        // Find all elements with animation classes
        const leftElements = section.querySelectorAll('.slide-in-left');
        const rightElements = section.querySelectorAll('.slide-in-right');
        const bottomElements = section.querySelectorAll('.slide-in-bottom');
        const topElements = section.querySelectorAll('.slide-in-top');
        const fadeElements = section.querySelectorAll('.fade-in');
        
        // Apply transformations based on scroll position
        leftElements.forEach((element, index) => {
          const delay = element.classList.contains('delay-100') ? 0.1 : 
                        element.classList.contains('delay-200') ? 0.2 :
                        element.classList.contains('delay-300') ? 0.3 :
                        element.classList.contains('delay-400') ? 0.4 :
                        element.classList.contains('delay-500') ? 0.5 : 0;
          
          const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          const translateX = -100 + (adjustedProgress * 100);
          element.style.transform = `translateX(${translateX}px)`;
          element.style.opacity = adjustedProgress;
        });
        
        rightElements.forEach((element, index) => {
          const delay = element.classList.contains('delay-100') ? 0.1 : 
                        element.classList.contains('delay-200') ? 0.2 :
                        element.classList.contains('delay-300') ? 0.3 :
                        element.classList.contains('delay-400') ? 0.4 :
                        element.classList.contains('delay-500') ? 0.5 : 0;
          
          const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          const translateX = 100 - (adjustedProgress * 100);
          element.style.transform = `translateX(${translateX}px)`;
          element.style.opacity = adjustedProgress;
        });
        
        bottomElements.forEach((element, index) => {
          const delay = element.classList.contains('delay-100') ? 0.1 : 
                        element.classList.contains('delay-200') ? 0.2 :
                        element.classList.contains('delay-300') ? 0.3 :
                        element.classList.contains('delay-400') ? 0.4 :
                        element.classList.contains('delay-500') ? 0.5 : 0;
          
          const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          const translateY = 100 - (adjustedProgress * 100);
          element.style.transform = `translateY(${translateY}px)`;
          element.style.opacity = adjustedProgress;
        });
        
        topElements.forEach((element, index) => {
          const delay = element.classList.contains('delay-100') ? 0.1 : 
                        element.classList.contains('delay-200') ? 0.2 :
                        element.classList.contains('delay-300') ? 0.3 :
                        element.classList.contains('delay-400') ? 0.4 :
                        element.classList.contains('delay-500') ? 0.5 : 0;
          
          const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          const translateY = -100 + (adjustedProgress * 100);
          element.style.transform = `translateY(${translateY}px)`;
          element.style.opacity = adjustedProgress;
        });
        
        fadeElements.forEach((element, index) => {
          const delay = element.classList.contains('delay-100') ? 0.1 : 
                        element.classList.contains('delay-200') ? 0.2 :
                        element.classList.contains('delay-300') ? 0.3 :
                        element.classList.contains('delay-400') ? 0.4 :
                        element.classList.contains('delay-500') ? 0.5 : 0;
          
          const adjustedProgress = Math.max(0, Math.min(1, (progress - delay) * 1.5));
          element.style.opacity = adjustedProgress;
        });
      }
    };
    
    // Initial calculation
    handleScroll();
    
    // Add scroll event listener with throttling for performance
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', scrollListener, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);
  
  return sectionRef;
};

export default useScrollAnimation; 