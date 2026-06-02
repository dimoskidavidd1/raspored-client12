import Fuse from 'fuse.js';
import { getCurrentAndNext, nowMinutes, toMinutes, formatDuration } from './timeUtils';

const SECTION_MAP = { 'а': 'A', 'б': 'B', 'в': 'V', 'г': 'G', 'д': 'D', 'е': 'E', 'a': 'A', 'b': 'B', 'v': 'V', 'g': 'G', 'd': 'D', 'e': 'E' };

const DAY_WORDS = {
  monday: 1, mon: 1, понеделник: 1, пон: 1,
  tuesday: 2, tue: 2, вторник: 2, вт: 2,
  wednesday: 3, wed: 3, среда: 3, сре: 3,
  thursday: 4, thu: 4, четврток: 4, чет: 4,
  friday: 5, fri: 5, петок: 5, пет: 5,
};

const DAY_NUM_TO_KEY = { 1: 'day1', 2: 'day2', 3: 'day3', 4: 'day4', 5: 'day5' };

function normalizeInput(raw) {
  return raw.toLowerCase().replace(/\s+/g, ' ').trim();
}

function extractClass(input, classes) {
  const norm = input.toLowerCase();
  // Try "6 в", "6в", "6 v", "6v" — match digit then optional space then section letter
  const match = norm.match(/([6-9])\s*([a-zа-я])/);
  if (match) {
    const grade = parseInt(match[1]);
    const section = SECTION_MAP[match[2]] || match[2].toUpperCase();
    const cls = classes.find(c => c.grade === grade && c.section === section);
    if (cls) return cls;
  }
  // fuzzy fallback on label
  const classNames = classes.map(c => ({ label: `${c.grade}${c.section}`, ...c }));
  const fuse = new Fuse(classNames, { keys: ['label'], threshold: 0.5 });
  const results = fuse.search(norm.replace(/\s+/g, ''));
  return results[0]?.item || null;
}

function extractDay(input) {
  const norm = normalizeInput(input);
  for (const [word, num] of Object.entries(DAY_WORDS)) {
    if (norm.includes(word)) return num;
  }
  return null;
}

function extractPeriod(input) {
  const norm = normalizeInput(input);
  // "period 5", "5th period", "5. period", "час 5", "5 час", "5th class"
  const m = norm.match(/(?:period|час|class)\s*(\d)|(\d)\s*(?:st|nd|rd|th)?\s*(?:period|час|class)|(?:period|час)\s*#?\s*(\d)/i);
  if (m) return parseInt(m[1] || m[2] || m[3]);
  // plain number like "5" when combined with period-like words
  const plain = norm.match(/\b([1-8])\b/);
  if (plain && (norm.includes('period') || norm.includes('час') || norm.includes('class'))) return parseInt(plain[1]);
  return null;
}

function extractTime(input) {
  const m = input.match(/(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return null;
}

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

function todayDow() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

export function smartSearch(query, classes, schedule, t) {
  if (!query.trim()) return null;

  const input = normalizeInput(query);
  const cls = extractClass(input, classes);
  const day = extractDay(input);
  const period = extractPeriod(input);
  const time = extractTime(input);

  // ── Intent: "where is 7V on friday at 10:20" (class + day + time) ─────
  if (cls && day && time) {
    const label = `${cls.grade}${cls.section}`;
    const t_mins = toMinutes(time);
    const entry = schedule.find(s =>
      s.class_id === cls.id && s.day_of_week === day &&
      toMinutes(s.start_time) <= t_mins && toMinutes(s.end_time) > t_mins
    );
    if (!entry) return { info: t('searchNoClassAtTime', { class: label }) };
    return {
      results: [{
        type: 'current',
        label: `${t(DAY_NUM_TO_KEY[day])} ${time}`,
        class: label,
        subject: entry.subject,
        teacher: entry.teacher,
        classroom: entry.classroom,
        countdown: `${entry.start_time}–${entry.end_time}`
      }]
    };
  }

  // ── Intent: "what does 7V have on monday" ──────────────────────────────
  if (cls && day) {
    const label = `${cls.grade}${cls.section}`;
    const entries = schedule
      .filter(s => s.class_id === cls.id && s.day_of_week === day)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
    if (!entries.length) return { info: t('searchNoDayClass', { class: label, day: t(DAY_NUM_TO_KEY[day]) }) };
    return { type: 'list', title: `${label} — ${t(DAY_NUM_TO_KEY[day])}`, entries };
  }

  // ── Intent: "what class is at period 5" (no specific class) ───────────
  if (!cls && period) {
    const p = PERIODS.find(p => p.n === period);
    if (!p) return { error: t('searchBadPeriod', { n: period }) };
    const dow = day || todayDow();
    const entries = schedule
      .filter(s => s.day_of_week === dow && s.start_time === p.start && s.end_time === p.end)
      .sort((a, b) => {
        const ca = classes.find(c => c.id === a.class_id);
        const cb = classes.find(c => c.id === b.class_id);
        return `${ca?.grade}${ca?.section}`.localeCompare(`${cb?.grade}${cb?.section}`);
      })
      .map(s => {
        const c = classes.find(c => c.id === s.class_id);
        return { ...s, grade: c?.grade, section: c?.section };
      });
    if (!entries.length) return { info: t('searchNoPeriod', { n: period }) };
    const dayLabel = day ? t(DAY_NUM_TO_KEY[day]) : t('today');
    return { type: 'period', title: t('searchPeriodTitle', { n: period, time: `${p.start}–${p.end}`, day: dayLabel }), entries };
  }

  // ── Intent: "where is 7V at 10:30" or "7V at period 3" ────────────────
  if (cls && (time || period)) {
    const label = `${cls.grade}${cls.section}`;
    const dow = todayDow();
    let entry = null;
    if (time) {
      const t_mins = toMinutes(time);
      entry = schedule.find(s =>
        s.class_id === cls.id && s.day_of_week === dow &&
        toMinutes(s.start_time) <= t_mins && toMinutes(s.end_time) > t_mins
      );
    } else if (period) {
      const p = PERIODS.find(p => p.n === period);
      if (p) entry = schedule.find(s => s.class_id === cls.id && s.day_of_week === dow && s.start_time === p.start);
    }
    if (!entry) return { info: t('searchNoClassAtTime', { class: label }) };
    return {
      results: [{
        type: 'current',
        label: time || `${t('period')} ${period}`,
        class: label,
        subject: entry.subject,
        teacher: entry.teacher,
        classroom: entry.classroom,
        countdown: `${entry.start_time}–${entry.end_time}`
      }]
    };
  }

  // ── Intent: "what does 7V have today" / "7V now" ──────────────────────
  if (cls) {
    const label = `${cls.grade}${cls.section}`;
    const dow = todayDow();
    const todayEntries = schedule
      .filter(s => s.class_id === cls.id && s.day_of_week === dow)
      .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));

    const { current, next } = getCurrentAndNext(todayEntries);
    const results = [];

    if (current) {
      const minsLeft = toMinutes(current.end_time) - nowMinutes();
      results.push({ type: 'current', label: t('searchNow'), class: label, subject: current.subject, teacher: current.teacher, classroom: current.classroom, countdown: t('endsIn', { time: formatDuration(minsLeft) }) });
    }
    if (next) {
      const minsUntil = toMinutes(next.start_time) - nowMinutes();
      results.push({ type: 'next', label: t('searchNext'), class: label, subject: next.subject, teacher: next.teacher, classroom: next.classroom, countdown: t('startsIn', { time: formatDuration(minsUntil) }) });
    }
    if (!results.length) return { info: t('searchNoClass', { class: label }) };
    return { results };
  }

  return { error: t('searchNotFound', { query }) };
}
