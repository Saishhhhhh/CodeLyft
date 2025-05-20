import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import RoadmapQuestionsPage from './pages/RoadmapQuestionsPage'
import RoadmapResultPage from './pages/RoadmapResultPage'
import RoadmapTestPage from './pages/RoadmapTestPage';
import RoadmapProgressPage from './pages/RoadmapProgressPage';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<RoadmapQuestionsPage />} />
          <Route path="/roadmap" element={<RoadmapResultPage />} />
          <Route path="/test-roadmap" element={<RoadmapTestPage />} />
          <Route path="/roadmap-progress" element={<RoadmapProgressPage />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App
