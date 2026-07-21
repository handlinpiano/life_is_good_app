import { getLocalDateString } from './constants';

/**
 * Compute current / longest check-in streak from an array of { date: 'YYYY-MM-DD' }.
 */
export function calculateStreak(checkins = []) {
  const sorted = [...checkins].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (sorted.length === 0) {
    return { current: 0, longest: 0, total: 0 };
  }

  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;

  const hasRecentCheckin = sorted.some(
    (c) => c.date === today || c.date === yesterday
  );

  for (const checkin of sorted) {
    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const lastDateObj = new Date(lastDate);
      const currentDateObj = new Date(checkin.date);
      const diffDays = Math.round((lastDateObj - currentDateObj) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        tempStreak = 1;
      }
    }
    lastDate = checkin.date;
  }

  if (tempStreak > longestStreak) longestStreak = tempStreak;

  let currentStreak = 0;
  if (hasRecentCheckin) {
    lastDate = null;
    for (const checkin of sorted) {
      if (lastDate === null) {
        if (checkin.date === today || checkin.date === yesterday) {
          currentStreak = 1;
          lastDate = checkin.date;
        } else {
          break;
        }
      } else {
        const lastDateObj = new Date(lastDate);
        const currentDateObj = new Date(checkin.date);
        const diffDays = Math.round((lastDateObj - currentDateObj) / 86400000);

        if (diffDays === 1) {
          currentStreak++;
          lastDate = checkin.date;
        } else {
          break;
        }
      }
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    total: sorted.length,
  };
}
