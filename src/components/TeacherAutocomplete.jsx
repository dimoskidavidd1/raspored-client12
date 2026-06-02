import { useState, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';

export default function TeacherAutocomplete({ teachers, value, onChange, placeholder, searchKey }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Keep input in sync if parent resets it
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fuse = new Fuse(teachers, {
    keys: ['teacher', 'subject'],
    threshold: 0.4,
    includeScore: true
  });

  const handleInput = (val) => {
    setQuery(val);
    onChange({ [searchKey]: val }); // partial update while typing
    if (val.trim().length < 1) { setResults([]); setOpen(false); return; }
    const hits = fuse.search(val).slice(0, 8).map(r => r.item);
    setResults(hits);
    setOpen(hits.length > 0);
  };

  const select = (item) => {
    setQuery(item[searchKey]);
    setOpen(false);
    // Fill all three fields at once
    onChange({ teacher: item.teacher, subject: item.subject, classroom: item.classroom });
  };

  return (
    <div className="relative" ref={ref}>
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => query.trim() && results.length && setOpen(true)}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {results.map((item, i) => (
            <li
              key={i}
              onMouseDown={() => select(item)}
              className="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <p className="font-semibold text-sm">{item.teacher}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.subject}
                {item.classroom && <span className="ml-2 text-blue-500">🚪 {item.classroom}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
