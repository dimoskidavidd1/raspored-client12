import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import TeacherAutocomplete from '../components/TeacherAutocomplete';

const DAYS = [
  { v: 1, k: 'day1' }, { v: 2, k: 'day2' }, { v: 3, k: 'day3' },
  { v: 4, k: 'day4' }, { v: 5, k: 'day5' }
];

// Fixed bell schedule from school document (ПРВА СМЕНА)
const PERIODS = [
  { n: 1, start: '08:00', end: '08:40' },
  { n: 2, start: '08:45', end: '09:25' },
  { n: 3, start: '09:45', end: '10:25' },
  { n: 4, start: '10:30', end: '11:10' },
  { n: 5, start: '11:20', end: '12:00' },
  { n: 6, start: '12:05', end: '12:45' },
  { n: 7, start: '12:50', end: '13:30' },
  { n: 8, start: '13:35', end: '14:15' },
];

const emptyEntry = { class_id: '', subject: '', teacher: '', classroom: '', day_of_week: 1, start_time: '', end_time: '', period: '' };

export default function Admin({ classes, schedule, reload }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('schedule');
  const [teachers, setTeachers] = useState([]);
  const [newClass, setNewClass] = useState({ grade: 6, section: 'A' });

  useEffect(() => {
    api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {});
  }, []);
  const [entry, setEntry] = useState(emptyEntry);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterDay, setFilterDay] = useState('');

  if (!user || user.role !== 'admin') {
    navigate('/login');
    return null;
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // --- Classes ---
  const addClass = async () => {
    try {
      await api.post('/classes', newClass);
      reload();
      flash('✅ Class added');
    } catch { flash('❌ Error'); }
  };

  const deleteClass = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    await api.delete(`/classes/${id}`);
    reload();
  };

  // --- Schedule ---
  const saveEntry = async () => {
    if (!entry.class_id) return flash('❌ Select a class');
    if (!entry.subject.trim()) return flash('❌ Subject is required');
    if (!entry.teacher.trim()) return flash('❌ Teacher is required');
    if (!entry.start_time || !entry.end_time) return flash('❌ Select a period or enter times');
    const payload = {
      class_id: Number(entry.class_id),
      subject: entry.subject.trim(),
      teacher: entry.teacher.trim(),
      classroom: entry.classroom.trim() || '—',
      day_of_week: Number(entry.day_of_week),
      start_time: entry.start_time,
      end_time: entry.end_time
    };
    try {
      if (editId) {
        await api.put(`/schedule/${editId}`, payload);
      } else {
        await api.post('/schedule', payload);
      }
      setEntry(e => ({ ...emptyEntry, class_id: e.class_id, day_of_week: e.day_of_week }));
      setEditId(null);
      reload();
      flash('✅ Saved');
    } catch (err) {
      flash('❌ ' + (err.response?.data?.error || 'Error saving entry'));
    }
  };

  const startEdit = (e) => {
    setEditId(e.id);
    const matchedPeriod = PERIODS.find(p => p.start === e.start_time && p.end === e.end_time);
    setEntry({ class_id: e.class_id, subject: e.subject, teacher: e.teacher, classroom: e.classroom, day_of_week: e.day_of_week, start_time: e.start_time, end_time: e.end_time, period: matchedPeriod ? matchedPeriod.n : '' });
    setTab('schedule');
  };

  const deleteEntry = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    await api.delete(`/schedule/${id}`);
    reload();
  };

  const filteredSchedule = schedule.filter(s =>
    (!filterClass || s.class_id === Number(filterClass)) &&
    (!filterDay || s.day_of_week === Number(filterDay))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ {t('admin')}</h1>
      {msg && <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-2 text-sm">{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['schedule', 'classes'].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`btn ${tab === tb ? 'btn-primary' : 'btn-ghost'}`}>
            {tb === 'schedule' ? `📋 ${t('manageSchedule')}` : `🏫 ${t('manageClasses')}`}
          </button>
        ))}
      </div>

      {/* ── SCHEDULE TAB ── */}
      {tab === 'schedule' && (
        <div className="space-y-4">
          {/* Entry form */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold">{editId ? t('edit') : t('addEntry')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select className="input" value={entry.class_id} onChange={e => setEntry({ ...entry, class_id: e.target.value })}>
                <option value="">{t('selectClass')}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.section}</option>)}
              </select>
              <select className="input" value={entry.day_of_week} onChange={e => setEntry({ ...entry, day_of_week: Number(e.target.value) })}>
                {DAYS.map(d => <option key={d.v} value={d.v}>{t(d.k)}</option>)}
              </select>
              <select
                className="input"
                value={entry.period}
                onChange={e => {
                  const p = PERIODS.find(p => p.n === Number(e.target.value));
                  setEntry({ ...entry, period: e.target.value, start_time: p ? p.start : '', end_time: p ? p.end : '' });
                }}
              >
                <option value="">— Period # —</option>
                {PERIODS.map(p => (
                  <option key={p.n} value={p.n}>
                    {p.n}. ({p.start}–{p.end})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input className="input" placeholder={t('startTime')} value={entry.start_time} onChange={e => setEntry({ ...entry, start_time: e.target.value, period: '' })} />
                <input className="input" placeholder={t('endTime')} value={entry.end_time} onChange={e => setEntry({ ...entry, end_time: e.target.value, period: '' })} />
              </div>
              <TeacherAutocomplete
                teachers={teachers}
                value={entry.subject}
                searchKey="subject"
                placeholder={t('subject')}
                onChange={fields => setEntry(prev => ({ ...prev, ...fields }))}
              />
              <TeacherAutocomplete
                teachers={teachers}
                value={entry.teacher}
                searchKey="teacher"
                placeholder={t('teacher')}
                onChange={fields => setEntry(prev => ({ ...prev, ...fields }))}
              />
              <input className="input" placeholder={t('classroom')} value={entry.classroom} onChange={e => setEntry({ ...entry, classroom: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveEntry}>{t('save')}</button>
              {editId && <button className="btn-ghost" onClick={() => { setEditId(null); setEntry(emptyEntry); }}>{t('cancel')}</button>}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select className="input w-auto" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">{t('selectClass')}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.section}</option>)}
            </select>
            <select className="input w-auto" value={filterDay} onChange={e => setFilterDay(e.target.value)}>
              <option value="">All days</option>
              {DAYS.map(d => <option key={d.v} value={d.v}>{t(d.k)}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['selectClass', 'day1', 'period', 'startTime', 'endTime', 'subject', 'teacher', 'classroom', ''].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      {h ? t(h) : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredSchedule.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 font-medium">{e.grade}{e.section}</td>
                    <td className="px-3 py-2">{t(DAYS.find(d => d.v === e.day_of_week)?.k || '')}</td>
                    <td className="px-3 py-2 text-center">
                      {(() => { const p = PERIODS.find(p => p.start === e.start_time && p.end === e.end_time); return p ? <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold">#{p.n}</span> : '—'; })()}
                    </td>
                    <td className="px-3 py-2 font-mono">{e.start_time}</td>
                    <td className="px-3 py-2 font-mono">{e.end_time}</td>
                    <td className="px-3 py-2">{e.subject}</td>
                    <td className="px-3 py-2">{e.teacher}</td>
                    <td className="px-3 py-2">{e.classroom}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button className="btn-ghost text-xs px-2 py-1" onClick={() => startEdit(e)}>{t('edit')}</button>
                        <button className="btn-danger text-xs px-2 py-1" onClick={() => deleteEntry(e.id)}>{t('delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSchedule.length === 0 && <p className="text-center py-6 text-gray-400">{t('noData')}</p>}
          </div>
        </div>
      )}

      {/* ── CLASSES TAB ── */}
      {tab === 'classes' && (
        <div className="space-y-4">
          <div className="card p-4 flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-sm mb-1">{t('grade')}</label>
              <select className="input w-24" value={newClass.grade} onChange={e => setNewClass({ ...newClass, grade: Number(e.target.value) })}>
                {[6, 7, 8, 9].map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">{t('section')}</label>
              <input className="input w-24" value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value.toUpperCase() })} maxLength={2} />
            </div>
            <button className="btn-primary" onClick={addClass}>{t('addClass')}</button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-2 text-left">{t('grade')}</th>
                  <th className="px-4 py-2 text-left">{t('section')}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {classes.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.grade}</td>
                    <td className="px-4 py-2">{c.section}</td>
                    <td className="px-4 py-2">
                      <button className="btn-danger text-xs px-2 py-1" onClick={() => deleteClass(c.id)}>{t('delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
