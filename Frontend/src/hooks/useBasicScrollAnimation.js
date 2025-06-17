import { useEffect, useRef, useState } from 'react';

/**
 * Simple hook for basic scroll animations
 * Adds animation classes when elements enter the viewport
 * Removes animation classes only when scrolling up
 */
const useBasicScrollAnimation = () => {
  const sectionRef = useRef(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('down');
  
  useEffect(() => {
    // Track scroll direction
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Find all animation elements
          const animatedElements = entry.target.querySelectorAll('.animate-on-scroll');
          
          if (entry.isIntersecting) {
            // When element enters viewport - add animation class
            animatedElements.forEach((element, index) => {
              setTimeout(() => {
                element.classList.add('animated');
              }, index * 100);
            });
          } else if (scrollDirection === 'up') {
            // Only remove animation class when scrolling up and element leaves viewport
            animatedElements.forEach((element, index) => {
              // Use setTimeout to create staggered exit animation
              setTimeout(() => {
                element.classList.remove('animated');
              }, index * 100);
            });
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
  }, [scrollDirection]);
  
  return sectionRef;
};

export default useBasicScrollAnimation;
