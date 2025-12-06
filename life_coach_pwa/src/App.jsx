import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import IntakePage from './pages/IntakePage';
import DashboardPage from './pages/DashboardPage';
import GardenPage from './pages/GardenPage';
import WisdomPage from './pages/WisdomPage';
import GuruChatPage from './pages/GuruChatPage';

// Main App Component with Routing
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<IntakePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/garden" element={<GardenPage />} />
          <Route path="/wisdom" element={<WisdomPage />} />
          <Route path="/chat/:guruId" element={<GuruChatPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
