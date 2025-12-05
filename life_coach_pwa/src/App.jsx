import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AstrologyProvider } from './context/AstrologyContext';
import IntakePage from './pages/IntakePage';
import DashboardPage from './pages/DashboardPage';
import GardenPage from './pages/GardenPage';
import GuruIntakePage from './pages/GuruIntakePage';

export default function App() {
  return (
    <AstrologyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IntakePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/intake/:guruId" element={<GuruIntakePage />} />
          <Route path="/garden" element={<GardenPage />} />
        </Routes>
      </BrowserRouter>
    </AstrologyProvider>
  );
}
