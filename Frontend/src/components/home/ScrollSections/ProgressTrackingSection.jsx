import React, { useEffect, useRef } from 'react';

const ProgressTrackingSection = ({ colors }) => {
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
    <section ref={sectionRef} className="py-16 overflow-hidden h-full flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-center">
          {/* Content */}
          <div className="order-2 lg:order-1 lg:pr-8">
            <div>
              <h2 className="animate-on-scroll fade-left text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8" style={{ color: colors.text }}>
                Track Your <span style={{ color: colors.tertiary || colors.secondary }}>Progress</span> & Growth
              </h2>
              <p className="animate-on-scroll fade-left delay-100 text-xl lg:text-2xl mb-10" style={{ color: colors.textMuted }}>
                Monitor your learning journey with detailed progress tracking and resource management.
              </p>
              <ul className="space-y-6">
                {[
                  'Visualize your learning progress',
                  'Celebrate milestones with achievements',
                  'Track completed resources',
                  'Resume learning from where you left off'
                ].map((item, index) => (
                  <li key={index} className={`animate-on-scroll fade-left delay-${(index + 2) * 100} flex items-start`}>
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke={colors.tertiary || colors.secondary}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-lg lg:text-xl" style={{ color: colors.text }}>{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Image/Illustration */}
          <div className="order-1 lg:order-2 mt-16 lg:mt-0">
            <div className="animate-on-scroll fade-right relative">
              <div className="rounded-lg overflow-hidden shadow-xl transform hover:scale-[1.02] transition-all duration-500" style={{ 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`
              }}>
                <div className="p-1" style={{ 
                  background: `linear-gradient(to right, ${colors.tertiary || colors.secondary}, ${colors.secondary}DD)` 
                }}>
                  <div className="h-10 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-sm font-medium text-white">Progress Dashboard</div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-8">
                    <div className="animate-on-scroll fade-right delay-100">
                      <div className="mb-2 flex justify-between items-center">
                        <h4 className="font-medium" style={{ color: colors.text }}>React Fundamentals</h4>
                        <span className="text-sm font-medium" style={{ color: colors.tertiary || colors.secondary }}>85%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: '85%',
                          backgroundColor: colors.tertiary || colors.secondary
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-right delay-200">
                      <div className="mb-2 flex justify-between items-center">
                        <h4 className="font-medium" style={{ color: colors.text }}>State Management</h4>
                        <span className="text-sm font-medium" style={{ color: colors.tertiary || colors.secondary }}>62%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: '62%',
                          backgroundColor: colors.tertiary || colors.secondary
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-right delay-300">
                      <div className="mb-2 flex justify-between items-center">
                        <h4 className="font-medium" style={{ color: colors.text }}>Routing & Navigation</h4>
                        <span className="text-sm font-medium" style={{ color: colors.tertiary || colors.secondary }}>43%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: '43%',
                          backgroundColor: colors.tertiary || colors.secondary
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-right delay-400">
                      <div className="mb-2 flex justify-between items-center">
                        <h4 className="font-medium" style={{ color: colors.text }}>API Integration</h4>
                        <span className="text-sm font-medium" style={{ color: colors.tertiary || colors.secondary }}>28%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: '28%',
                          backgroundColor: colors.tertiary || colors.secondary
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-right delay-500">
                      <div className="mb-2 flex justify-between items-center">
                        <h4 className="font-medium" style={{ color: colors.text }}>Testing</h4>
                        <span className="text-sm font-medium" style={{ color: colors.tertiary || colors.secondary }}>10%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ 
                          width: '10%',
                          backgroundColor: colors.tertiary || colors.secondary
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.secondary}20 0%, ${colors.secondary}05 50%, transparent 70%)`,
                filter: 'blur(25px)',
                zIndex: -1
              }}></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.tertiary || colors.secondary}20 0%, ${colors.tertiary || colors.secondary}05 50%, transparent 70%)`,
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

export default ProgressTrackingSection;