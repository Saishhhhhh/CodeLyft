import React, { useEffect, useRef } from 'react';

const YoutubeResourcesSection = ({ colors }) => {
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
          <div className="order-1 lg:order-2 lg:pl-8">
            <div>
              <h2 className="animate-on-scroll fade-right text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8" style={{ color: colors.text }}>
                Get the <span style={{ color: colors.accent }}>Best Free</span> YouTube Resources
              </h2>
              <p className="animate-on-scroll fade-right delay-100 text-xl lg:text-2xl mb-10" style={{ color: colors.textMuted }}>
                We curate high-quality YouTube content and organize them into a structured learning sequence that matches your roadmap.
              </p>
              <ul className="space-y-6">
                {[
                  'Algorithm-selected quality content from YouTube',
                  'Organized in the optimal learning sequence',
                  'Filtered for your experience level',
                  'Regularly updated with the latest content'
                ].map((item, index) => (
                  <li key={index} className={`animate-on-scroll fade-right delay-${(index + 2) * 100} flex items-start`}>
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke={colors.accent}>
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
          <div className="order-2 lg:order-1 mt-16 lg:mt-0">
            <div className="animate-on-scroll fade-left relative">
              <div className="rounded-lg overflow-hidden shadow-xl transform hover:scale-[1.02] transition-all duration-500" style={{ 
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`
              }}>
                <div className="p-1" style={{ backgroundColor: colors.accent }}>
                  <div className="h-10 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-sm font-medium text-white">YouTube Curator</div>
                  </div>
                </div>
                <div className="p-8">
                  {/* Video Cards */}
                  <div className="space-y-6">
                    {[1, 2, 3].map((item) => (
                      <div 
                        key={item}
                        className={`animate-on-scroll fade-left delay-${item * 100} flex items-start p-4 rounded-lg transform hover:translate-x-2 transition-all duration-300`}
                        style={{ 
                          backgroundColor: colors.cardBg,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div 
                          className="flex-shrink-0 w-20 h-16 rounded mr-4 flex items-center justify-center"
                          style={{ backgroundColor: `${colors.accent}20` }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke={colors.accent}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-lg" style={{ color: colors.text }}>
                            {item === 1 ? 'Introduction to React' : item === 2 ? 'Advanced Hooks' : 'Building a Full App'}
                          </h4>
                          <p className="text-base" style={{ color: colors.textMuted }}>
                            {item === 1 ? '12:45 • Beginner' : item === 2 ? '24:18 • Intermediate' : '48:32 • Advanced'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.primary}20 0%, ${colors.primary}05 50%, transparent 70%)`,
                filter: 'blur(25px)',
                zIndex: -1
              }}></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.accent}20 0%, ${colors.accent}05 50%, transparent 70%)`,
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

export default YoutubeResourcesSection;
