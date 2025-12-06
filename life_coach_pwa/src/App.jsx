import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import IntakePage from './pages/IntakePage';
import DashboardPage from './pages/DashboardPage';
import GardenPage from './pages/GardenPage';
import GuruIntakePage from './pages/GuruIntakePage';

// Main App Component with Routing
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<IntakePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/garden" element={<GardenPage />} />
        <Route path="/intake/:guruId" element={<GuruIntakePage />} />
      </Routes>
    </Router>
  )
}
