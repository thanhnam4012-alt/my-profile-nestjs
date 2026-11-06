import { APP_TIMEZONE } from '../containts/user-streak.constants';

/** Trả về ngày dạng 'YYYY-MM-DD' theo giờ Việt Nam */
export function getVnDateString(date: Date = new Date()): string {
  // Locale 'en-CA' định dạng sẵn theo kiểu YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Cộng/trừ số ngày cho chuỗi 'YYYY-MM-DD' */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Số ngày trong tháng, month dạng 'YYYY-MM' */
export function getDaysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  // Ngày 0 của tháng sau = ngày cuối của tháng này
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
}

/**
 * Trả về thứ trong tuần dạng index (0 = Thứ 2, ..., 6 = Chủ Nhật)
 */
export function getWeekdayIndex(dateStr: string): number {
  const [year, mon, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, mon - 1, day));
  const dayOfWeek = d.getUTCDay(); // 0: CN, 1: T2, ..., 6: T7
  return (dayOfWeek + 6) % 7;
}

/**
 * Tính chuỗi hiện tại và chuỗi dài nhất.
 * sortedDates: danh sách ngày đã điểm danh, sắp xếp tăng dần, không trùng.
 */
export function computeStreakStats(sortedDates: string[], today: string) {
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;

  for (const date of sortedDates) {
    // Nếu ngày này liền sau ngày trước thì nối chuỗi, ngược lại bắt đầu chuỗi mới
    run = prev !== null && addDays(prev, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = date;
  }

  // Chuỗi cuối cùng chỉ còn "sống" nếu kết thúc ở hôm nay hoặc hôm qua
  const yesterday = addDays(today, -1);
  const currentStreak = prev !== null && prev >= yesterday ? run : 0;

  return { currentStreak, longestStreak };
}

/** Tìm ngày bắt đầu và kết thúc của chuỗi liên tiếp chứa targetDate */
export function findChainRange(sortedDates: string[], targetDate: string) {
  const dateSet = new Set(sortedDates);

  let start = targetDate;
  while (dateSet.has(addDays(start, -1))) {
    start = addDays(start, -1);
  }

  let end = targetDate;
  while (dateSet.has(addDays(end, 1))) {
    end = addDays(end, 1);
  }

  return { start, end };
}
