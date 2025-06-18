import React from 'react';
import Navbar from '../../Navbar';
import HeroAnimation from '../../HeroAnimation';
import ChatbotWrapper from '../../chatbot/ChatbotWrapper';

const LoadingState = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #FFF7ED, #FFFFFF)' }}>
      <Navbar />
      <HeroAnimation />
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600 font-mukta">Loading your roadmap...</p>
          </div>
        </div>
      </div>
      <ChatbotWrapper />
    </div>
  );
};

export default LoadingState; 