import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentAndNext, minutesLeft, minutesUntil, formatDuration, todayDow, toMinutes } from '../timeUtils';

const DAY_KEYS = ['', 'day1', 'day2', 'day3', 'day4', 'day5'];

export default function TodayView({ schedule, selectedClass, classes }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const dow = todayDow();
  const cls = classes.find(c => c.id === selectedClass);

  const entries = schedule
    .filter(s => s.class_id === selectedClass && s.day_of_week === dow)
    .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

  const { current, next } = getCurrentAndNext(entries);

  if (!selectedClass) return (
    <div className="card p-8 text-center text-gray-400 dark:text-gray-500">
      <p className="text-4xl mb-3">📚</p>
      <p>{t('selectClass')}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl">{cls ? `${cls.grade}${cls.section}` : ''}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t(DAY_KEYS[dow] || 'today')}</p>
        </div>
        {current && (
          <div className="text-right">
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
              🟢 {t('endsIn', { time: formatDuration(minutesLeft(current.end_time)) })}
            </span>
          </div>
        )}
        {!current && next && (
          <div className="text-right">
            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
              🟡 {t('startsIn', { time: formatDuration(minutesUntil(next.start_time)) })}
            </span>
          </div>
        )}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="card p-6 text-center text-gray-400">{t('noData')}</div>
      ) : (
        <div className="space-y-2">
          {entries.map(e => {
            const isCurrent = current?.id === e.id;
            const isNext = next?.id === e.id;
            return (
              <div key={e.id} className={`card p-4 flex items-center gap-4 ${isCurrent ? 'class-current' : isNext ? 'class-next' : ''}`}>
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-mono font-semibold">{e.start_time}</p>
                  <p className="text-xs text-gray-400">–</p>
                  <p className="text-sm font-mono">{e.end_time}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{e.subject}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">👤 {e.teacher}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">🚪 {e.classroom}</span>
                  {isCurrent && <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{t('currentClass')}</p>}
                  {isNext && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('nextClass')}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
