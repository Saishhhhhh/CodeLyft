const CtaSection = ({ colors }) => {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm relative" style={{ 
          background: `linear-gradient(to right, ${colors.primary}CC, ${colors.tertiary || colors.primary}CC)`,
        }}>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ 
            background: `radial-gradient(circle, ${colors.primary}40 0%, ${colors.primary}10 50%, transparent 70%)`,
            filter: 'blur(25px)',
            zIndex: 0
          }}></div>
          
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full" style={{ 
            background: `radial-gradient(circle, ${colors.tertiary || colors.accent}40 0%, ${colors.tertiary || colors.accent}10 50%, transparent 70%)`,
            filter: 'blur(25px)',
            zIndex: 0
          }}></div>
          
          <div className="px-6 py-8 md:py-10 md:px-10 text-center relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="sm:flex-1">
                <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Ready to start learning?
                </h2>
                <p className="mt-2 max-w-3xl text-lg text-indigo-100">
                  Create your personalized roadmap now and begin your tech journey
                </p>
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-8 sm:flex-shrink-0 flex justify-center">
                <div className="rounded-md shadow">
                  <a
                    href="#top"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative overflow-hidden rounded-full bg-white px-6 py-2 md:py-3 md:px-8 text-base md:text-lg font-medium text-indigo-700 hover:bg-indigo-50 transition-all duration-200 hover:shadow-lg flex items-center justify-center w-[200px] h-[48px]"
                    style={{
                      boxShadow: `0 4px 14px rgba(99, 102, 241, 0.4)`
                    }}
                  >
                    <div className="absolute inset-0 overflow-hidden flex items-center">
                      <div className="flex whitespace-nowrap animate-flow-text">
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                        <span className="uppercase font-black mx-4">START YOUR JOURNEY!</span>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CtaSection;
