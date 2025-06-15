import Navbar from '../components/Navbar';
import ChatbotContainer from '../components/chatbot/ChatbotContainer';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {children}
      </main>
      <ChatbotContainer />
    </div>
  );
};

export default MainLayout; 