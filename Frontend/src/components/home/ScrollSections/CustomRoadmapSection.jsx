import React, { useEffect, useRef } from 'react';

const CustomRoadmapSection = ({ colors }) => {
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
                Create <span style={{ color: colors.quaternary || colors.primary }}>Custom</span> Roadmaps
              </h2>
              <p className="animate-on-scroll fade-right delay-100 text-xl lg:text-2xl mb-10" style={{ color: colors.textMuted }}>
                Design your own personalized learning paths for any tech stack or project with intuitive tools and AI assistance.
              </p>
              <ul className="space-y-6">
                {[
                  'Build roadmaps from scratch',
                  'Get AI chatbot assistance for suggestions',
                  'Customize topics and resources',
                  'Discover resources for your custom topics'
                ].map((item, index) => (
                  <li key={index} className={`animate-on-scroll fade-right delay-${(index + 2) * 100} flex items-start`}>
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 mr-3" fill="none" viewBox="0 0 24 24" stroke={colors.quaternary || colors.primary}>
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
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`
              }}>
                <div className="p-1" style={{ 
                  background: `linear-gradient(to right, ${colors.quaternary || colors.primary}, ${colors.tertiary || colors.accent})` 
                }}>
                  <div className="h-10 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 text-sm font-medium text-white">Custom Roadmap Builder</div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="space-y-6">
                    <div className="animate-on-scroll fade-left delay-100 flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold" style={{ 
                        backgroundColor: `${colors.quaternary || colors.primary}20`,
                        color: colors.text
                      }}>1</div>
                      <div className="flex-grow">
                        <div className="h-12 w-full rounded-md animate-pulse" style={{ backgroundColor: `${colors.quaternary || colors.primary}30` }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-left delay-200 flex items-start">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 mt-2 text-lg font-bold" style={{ 
                        backgroundColor: `${colors.quaternary || colors.primary}20`,
                        color: colors.text
                      }}>2</div>
                      <div className="flex-grow space-y-4">
                        <div className="h-10 w-full rounded-md" style={{ backgroundColor: `${colors.quaternary || colors.primary}20` }}></div>
                        <div className="h-10 w-full rounded-md" style={{ backgroundColor: `${colors.quaternary || colors.primary}20` }}></div>
                        <div className="h-10 w-3/4 rounded-md" style={{ backgroundColor: `${colors.quaternary || colors.primary}20` }}></div>
                      </div>
                    </div>
                    
                    <div className="animate-on-scroll fade-left delay-300 flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 text-lg font-bold" style={{ 
                        backgroundColor: `${colors.quaternary || colors.primary}20`,
                        color: colors.text
                      }}>3</div>
                      <div className="flex-grow">
                        <div className="h-12 w-full rounded-md flex items-center justify-center font-medium" style={{ 
                          backgroundColor: `${colors.quaternary || colors.primary}40`,
                          color: colors.quaternary || colors.primary
                        }}>
                          Generate Roadmap
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.tertiary || colors.accent}20 0%, ${colors.tertiary || colors.accent}05 50%, transparent 70%)`,
                filter: 'blur(25px)',
                zIndex: -1
              }}></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full" style={{ 
                background: `radial-gradient(circle, ${colors.quaternary || colors.primary}20 0%, ${colors.quaternary || colors.primary}05 50%, transparent 70%)`,
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

export default CustomRoadmapSection;