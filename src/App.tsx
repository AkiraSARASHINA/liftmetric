import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InputPage from './pages/Input';
import CalendarPage from './pages/Calendar';
import ChartsPage from './pages/Charts';
import SettingsPage from './pages/Settings';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<InputPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
