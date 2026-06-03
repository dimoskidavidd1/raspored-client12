import { useTranslation } from 'react-i18next';
import { toMinutes, todayDow } from '../timeUtils';

const DAYS = [1, 2, 3, 4, 5];
const DAY_KEYS = ['day1', 'day2', 'day3', 'day4', 'day5'];

export default function WeeklyView({ schedule, selectedClass, classes }) {
  const { t } = useTranslation();
  const cls = classes.find(c => c.id === selectedClass);
  const dow = todayDow();

  if (!selectedClass) return (
    <div className="card p-8 text-center text-gray-400">
      <p className="text-4xl mb-3">📅</p>
      <p>{t('selectClass')}</p>
    </div>
  );

  const byDay = {};
  DAYS.forEach(d => {
    byDay[d] = schedule
      .filter(s => Number(s.class_id) === Number(selectedClass) && s.day_of_week === d)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
  });

  return (
    <div>
      <h2 className="font-bold text-xl mb-4">{cls ? `${cls.grade}${cls.section}` : ''} — {t('weekly')}</h2>
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-5 gap-3">
        {DAYS.map((d, i) => (
          <div key={d} className={`card p-3 ${d === dow ? 'ring-2 ring-blue-500' : ''}`}>
            <h3 className={`font-semibold text-sm mb-3 text-center ${d === dow ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>
              {t(DAY_KEYS[i])}
            </h3>
            <div className="space-y-2">
              {byDay[d].length === 0 ? (
                <p className="text-xs text-gray-400 text-center">—</p>
              ) : byDay[d].map(e => (
                <div key={e.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-xs">
                  <p className="font-mono text-gray-400">{e.start_time}–{e.end_time}</p>
                  <p className="font-semibold mt-0.5">{e.subject}</p>
                  <p className="text-gray-500 dark:text-gray-400">{e.teacher}</p>
                  <p className="text-gray-400">🚪 {e.classroom}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile accordion */}
      <div className="md:hidden space-y-3">
        {DAYS.map((d, i) => (
          <div key={d} className={`card overflow-hidden ${d === dow ? 'ring-2 ring-blue-500' : ''}`}>
            <div className={`px-4 py-2 font-semibold text-sm ${d === dow ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
              {t(DAY_KEYS[i])}
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {byDay[d].length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">—</p>
              ) : byDay[d].map(e => (
                <div key={e.id} className="px-4 py-3 flex gap-3 items-start">
                  <span className="font-mono text-xs text-gray-400 min-w-[80px]">{e.start_time}–{e.end_time}</span>
                  <div>
                    <p className="font-semibold text-sm">{e.subject}</p>
                    <p className="text-xs text-gray-500">{e.teacher} · 🚪 {e.classroom}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
