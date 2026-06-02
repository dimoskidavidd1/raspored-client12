import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { smartSearch } from '../searchEngine';

export default function SmartSearch({ classes, schedule }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    const res = smartSearch(q, classes, schedule, t);
    setResult(res);
  };

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">🤖 {t('search')}</h3>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn-primary" onClick={() => handleSearch()}>→</button>
      </div>

      {result && (
        <div className="space-y-2 pt-1">
          {result.error && <p className="text-red-500 text-sm">{result.error}</p>}
          {result.info && <p className="text-gray-500 text-sm">{result.info}</p>}

          {/* Current/Next results */}
          {result.results?.map((r, i) => (
            <div key={i} className={`rounded-lg p-3 text-sm ${r.type === 'current' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold uppercase ${r.type === 'current' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {r.type === 'current' ? '🟢' : '🟡'} {r.label} — {r.class}
                </span>
                <span className="text-xs text-gray-400">{r.countdown}</span>
              </div>
              <p className="font-semibold">{r.subject}</p>
              <p className="text-gray-500 dark:text-gray-400">👤 {r.teacher} · 🚪 {r.classroom}</p>
            </div>
          ))}

          {/* Day schedule list (e.g. "what does 7V have on monday") */}
          {result.type === 'list' && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                📅 {result.title}
              </div>
              {result.entries.map((e, i) => (
                <div key={i} className="px-3 py-2 flex gap-3 items-start border-t border-gray-100 dark:border-gray-700 first:border-0 text-sm">
                  <span className="font-mono text-xs text-gray-400 min-w-[80px] pt-0.5">{e.start_time}–{e.end_time}</span>
                  <div>
                    <p className="font-semibold">{e.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">👤 {e.teacher} · 🚪 {e.classroom}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Period query (e.g. "what class is at period 5") */}
          {result.type === 'period' && (
            <div className="rounded-lg border border-blue-200 dark:border-blue-700 overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                🔔 {result.title}
              </div>
              {result.entries.map((e, i) => (
                <div key={i} className="px-3 py-2 flex gap-3 items-start border-t border-blue-100 dark:border-blue-800 first:border-0 text-sm">
                  <span className="font-bold text-blue-700 dark:text-blue-300 min-w-[40px]">{e.grade}{e.section}</span>
                  <div>
                    <p className="font-semibold">{e.subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">👤 {e.teacher} · 🚪 {e.classroom}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
