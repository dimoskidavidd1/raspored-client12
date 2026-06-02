// Convert "HH:MM" to total minutes since midnight
export const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

// JS getDay(): 0=Sun,1=Mon,...,6=Sat → our day_of_week: 1=Mon,...,5=Fri
export const todayDow = () => {
  const d = new Date().getDay();
  return d === 0 ? 7 : d; // 7 = Sunday (no classes)
};

export const getCurrentAndNext = (entries) => {
  const now = nowMinutes();
  let current = null;
  let next = null;

  for (const e of entries) {
    const start = toMinutes(e.start_time);
    const end = toMinutes(e.end_time);
    if (now >= start && now < end) { current = e; continue; }
    if (now < start) {
      if (!next || start < toMinutes(next.start_time)) next = e;
    }
  }
  return { current, next };
};

export const minutesUntil = (timeStr) => {
  const t = toMinutes(timeStr);
  return Math.max(0, t - nowMinutes());
};

export const minutesLeft = (timeStr) => {
  const t = toMinutes(timeStr);
  return Math.max(0, t - nowMinutes());
};

export const formatDuration = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
};

export const formatTime = (t) => t || '';
