import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TodayView from '../components/TodayView';
import WeeklyView from '../components/WeeklyView';
import SmartSearch from '../components/SmartSearch';

export default function Home({ schedule, classes, selectedClass, setSelectedClass }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('today');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <SmartSearch classes={classes} schedule={schedule} />

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('today')}
          className={`btn ${tab === 'today' ? 'btn-primary' : 'btn-ghost'}`}
        >
          📆 {t('today')}
        </button>
        <button
          onClick={() => setTab('weekly')}
          className={`btn ${tab === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
        >
          📅 {t('weekly')}
        </button>
      </div>

      {tab === 'today'
        ? <TodayView schedule={schedule} selectedClass={selectedClass} classes={classes} />
        : <WeeklyView schedule={schedule} selectedClass={selectedClass} classes={classes} />
      }
    </div>
  );
}
