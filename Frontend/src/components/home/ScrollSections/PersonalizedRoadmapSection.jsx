import React, { useEffect, useRef } from 'react';

const PersonalizedRoadmapSection = ({ colors }) => {
  const sectionRef = useRef(null);
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animatedElements = entry.target.querySelectorAll('.animate-on-scroll');
            
            animatedElements.forEach((element, index) => {
              setTimeout(() => {
                element.classList.add('animated');
              }, index * 100);
            });
            
            // Once animated, unobserve to keep elements animated
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    
    observer.observe(sectionRef.current);
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-8 md:py-16 overflow-hidden h-full flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
          {/* Content */}
          <div className="lg:pr-8">
            <div>
              <h2 className="animate-on-scroll fade-left text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 md:mb-8" style={{ color: colors.text }}>
                Generate <span style={{ color: colors.primary }}>Personalized</span> Roadmaps
              </h2>
              <p className="animate-on-scroll fade-left delay-100 text-lg lg:text-xl mb-8 md:mb-10" style={{ color: colors.textMuted }}>
                Our AI analyzes your goals and experience level to create a customized learning path that's perfect for you.
              </p>
              <ul className="space-y-4 md:space-y-6">
                {[
                  'Tailored to your specific learning goals',
                  'Adjusts to your experience level',
                  'Step-by-step progression',
                  'Focuses on practical skills'
                ].map((item, index) => (
                  <li key={index} className={`animate-on-scroll fade-left delay-${(index + 2) * 100} flex items-start`}>
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 md:h-8 md:w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke={colors.secondary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-base md:text-lg lg:text-xl" style={{ color: colors.text }}>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Image/Illustration */}
          <div className="mt-12 lg:mt-0">
            <div className="animate-on-scroll fade-right relative">
              <div className="rounded-lg overflow-hidden shadow-xl backdrop-blur-sm transform hover:scale-[1.02] transition-all duration-500" style={{ 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`
              }}>
                <div className="p-1" style={{ 
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.tertiary || colors.primary}DD)`
                }}>
                  <div className="h-8 md:h-10 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-xs md:text-sm font-medium text-white">Roadmap Generator</div>
                  </div>
                </div>
                <div className="p-4 md:p-8">
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex items-center" style={{ color: colors.text }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-4 text-base md:text-lg font-bold" style={{ 
                        backgroundColor: `${colors.primary}20`,
                        color: colors.text
                      }}>1</div>
                      <div className="h-2 md:h-3 flex-grow rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    </div>
                    <div className="flex items-center" style={{ color: colors.text }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-4 text-base md:text-lg font-bold" style={{ 
                        backgroundColor: `${colors.primary}20`,
                        color: colors.text
                      }}>2</div>
                      <div className="h-2 md:h-3 flex-grow rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    </div>
                    <div className="flex items-center" style={{ color: colors.text }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-4 text-base md:text-lg font-bold" style={{ 
                        backgroundColor: `${colors.primary}20`,
                        color: colors.text
                      }}>3</div>
                      <div className="h-2 md:h-3 flex-grow rounded-full" style={{ backgroundColor: colors.primary }}></div>
                    </div>
                    <div className="flex items-center" style={{ color: colors.text }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-4 text-base md:text-lg font-bold" style={{ 
                        backgroundColor: `${colors.primary}20`,
                        color: colors.text
                      }}>4</div>
                      <div className="h-2 md:h-3 flex-grow rounded-full opacity-30" style={{ backgroundColor: colors.primary }}></div>
                    </div>
                    <div className="flex items-center" style={{ color: colors.text }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mr-4 text-base md:text-lg font-bold" style={{ 
                        backgroundColor: `${colors.primary}10`,
                        color: colors.text
                      }}>5</div>
                      <div className="h-2 md:h-3 flex-grow rounded-full opacity-20" style={{ backgroundColor: colors.primary }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-32 md:w-48 h-32 md:h-48 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.accent}20 0%, ${colors.accent}05 50%, transparent 70%)`,
                filter: 'blur(25px)',
                zIndex: -1
              }}></div>
              <div className="absolute -top-10 -left-10 w-32 md:w-40 h-32 md:h-40 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.primary}20 0%, ${colors.primary}05 50%, transparent 70%)`,
                filter: 'blur(25px)',
                zIndex: -1
              }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedRoadmapSection; 