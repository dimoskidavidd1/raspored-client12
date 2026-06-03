import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import SuperAdmin from './pages/SuperAdmin';
import api from './api';
import './i18n';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('dark') === 'true');
  const [classes, setClasses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedClass, setSelectedClass] = useState(() => {
    const v = localStorage.getItem('selectedClass');
    return v ? Number(v) : null;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (selectedClass) localStorage.setItem('selectedClass', selectedClass);
  }, [selectedClass]);

  const reload = async () => {
    const [cls, sch] = await Promise.all([
      api.get('/classes'),
      api.get('/schedule/all')
    ]);
    setClasses(cls.data);
    setSchedule(sch.data);
    // Auto-select first class if none selected
    if (!selectedClass && cls.data.length > 0) setSelectedClass(cls.data[0].id);
  };

  useEffect(() => {
    api.post('/superadmin/views').catch(() => {});
    reload();
  }, []);

  const sharedProps = { classes, schedule, selectedClass, setSelectedClass };

  return (
    <AuthProvider>
      <BrowserRouter basename="/timeflow/ooumirceacevskopje">
        <div className="min-h-screen">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} {...sharedProps} />
          <Routes>
            <Route path="/" element={<Home {...sharedProps} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin {...sharedProps} reload={reload} />} />
            <Route path="/superadmin" element={<SuperAdmin />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
