import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ darkMode, setDarkMode, classes, selectedClass, setSelectedClass }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'mk' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="sticky top-0 z-50 bg-blue-600 dark:bg-blue-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <Link to="/" className="flex items-center gap-2 mr-auto">
          <img src={`${process.env.PUBLIC_URL}/timeflow-logo.png`} alt="Timeflow Education" className="h-8 w-8 object-contain" />
          <span className="font-bold text-lg tracking-tight leading-tight">
            <span className="block text-xs font-normal opacity-80">Timeflow Education</span>
            📅 {t('appTitle')}
          </span>
        </Link>

        {/* Class selector */}
        <select
          value={selectedClass || ''}
          onChange={e => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
          className="text-gray-900 rounded-lg px-2 py-1 text-sm focus:outline-none"
        >
          <option value="">{t('selectClass')}</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.grade}{c.section}</option>
          ))}
        </select>

        {/* Language */}
        <button onClick={toggleLang} className="text-sm bg-blue-700 dark:bg-blue-900 px-3 py-1 rounded-lg hover:bg-blue-800">
          {i18n.language === 'en' ? '🇲🇰 MK' : '🇬🇧 EN'}
        </button>

        {/* Dark mode */}
        <button onClick={() => setDarkMode(!darkMode)} className="text-sm bg-blue-700 dark:bg-blue-900 px-3 py-1 rounded-lg hover:bg-blue-800">
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Auth */}
        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-lg hover:bg-yellow-400 font-medium">
                {t('admin')}
              </Link>
            )}
            {user.role === 'superadmin' && (
              <>
                <Link to="/admin" className="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded-lg hover:bg-yellow-400 font-medium">
                  {t('admin')}
                </Link>
                <Link to="/superadmin" className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-400 font-medium">
                  ⚡ Super Admin
                </Link>
              </>
            )}
            <button onClick={handleLogout} className="text-sm bg-blue-700 dark:bg-blue-900 px-3 py-1 rounded-lg hover:bg-blue-800">
              {t('logout')}
            </button>
          </>
        ) : (
          <Link to="/login" className="text-sm bg-white text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50 font-medium">
            {t('login')}
          </Link>
        )}
      </div>
    </nav>
  );
}
