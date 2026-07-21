import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import IntakePage from './pages/IntakePage';
import DashboardPage from './pages/DashboardPage';
import GardenPage from './pages/GardenPage';
import WisdomPage from './pages/WisdomPage';
import ChatPage from './pages/ChatPage';
import DevLoginPage from './pages/DevLoginPage';
import { isTestAuthRouteEnabled } from './lib/testAuth';

export default function App({ authMode = 'clerk' }) {
  return (
    <AuthProvider authMode={authMode}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          {isTestAuthRouteEnabled() && (
            <Route path="/dev-login" element={<DevLoginPage />} />
          )}

          <Route path="/birth-chart" element={
            <ProtectedRoute>
              <IntakePage />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute requireChart>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/garden" element={
            <ProtectedRoute requireChart>
              <GardenPage />
            </ProtectedRoute>
          } />
          <Route path="/wisdom" element={
            <ProtectedRoute requireChart>
              <WisdomPage />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute requireChart>
              <ChatPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
