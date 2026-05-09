import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InputPage from './pages/Input';
import CalendarPage from './pages/Calendar';
import ChartsPage from './pages/Charts';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<InputPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/charts" element={<ChartsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
