/**
 * 格式化日期
 * @param date 要格式化的日期
 * @param format 格式字符串，默认 'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | number | null | undefined, 
  format = 'YYYY-MM-DD'
): string {
  if (!date) return '';
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  // 创建一个没有时区偏移的日期
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  if (format === 'YYYY-MM-DD') {
    // 使用本地日期而不是UTC日期，防止时区影响
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  // 复杂格式，使用模式替换
  const replacements: Record<string, string> = {
    'YYYY': year.toString(),
    'MM': month.toString().padStart(2, '0'),
    'DD': day.toString().padStart(2, '0'),
    'HH': d.getHours().toString().padStart(2, '0'),
    'mm': d.getMinutes().toString().padStart(2, '0'),
    'ss': d.getSeconds().toString().padStart(2, '0')
  };

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
}

/**
 * 格式化日期时间为本地格式
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  // 使用本地日期时间格式
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 计算两个日期之间的天数差
 */
export function daysBetween(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // 计算毫秒差并转换为天数
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * 检查日期是否是今天
 */
export function isToday(date: Date | string): boolean {
  const today = new Date();
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  
  return checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear();
}

/**
 * 获取相对时间文本
 * @param date 日期
 * @returns 相对当前时间的文本描述
 */
export function getRelativeTimeText(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  // 小于1分钟
  if (diffInSeconds < 60) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  }
  
  // 小于1天
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  }
  
  // 小于30天
  if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  }
  
  // 小于1年
  if (diffInSeconds < 31536000) {
    return `${Math.floor(diffInSeconds / 2592000)}个月前`;
  }
  
  // 大于1年
  return `${Math.floor(diffInSeconds / 31536000)}年前`;
}

/**
 * 检查日期是否有效
 * @param date 要检查的日期
 * @returns 是否为有效日期
 */
export function isValidDate(date: any): boolean {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  
  return false;
}

/**
 * 获取日期范围
 * @param start 开始日期
 * @param end 结束日期
 * @returns 日期范围数组
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * 获取相对时间描述
 * @param date 日期对象或ISO日期字符串
 * @returns 相对时间描述
 */
export function getRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  
  // 毫秒转换
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  } else {
    return `${diffYear}年前`;
  }
}

/**
 * 获取两个日期之间的天数差
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 天数差
 */
export function getDaysBetween(startDate: Date | string | number, endDate: Date | string | number): number {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // 重置时间部分，只比较日期
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  // 计算天数差（一天 = 86400000毫秒）
  return Math.abs(Math.floor((endUtc - startUtc) / 86400000));
}

/**
 * 向日期添加指定的时间
 * @param date 原始日期
 * @param value 要添加的数值
 * @param unit 时间单位 (years, months, days, hours, minutes, seconds)
 * @returns 新的日期对象
 */
export function addToDate(
  date: Date | string | number, 
  value: number,
  unit: 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds'
): Date {
  const d = date instanceof Date ? new Date(date) : new Date(date);
  
  switch (unit) {
    case 'years':
      d.setFullYear(d.getFullYear() + value);
      break;
    case 'months':
      d.setMonth(d.getMonth() + value);
      break;
    case 'days':
      d.setDate(d.getDate() + value);
      break;
    case 'hours':
      d.setHours(d.getHours() + value);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + value);
      break;
    case 'seconds':
      d.setSeconds(d.getSeconds() + value);
      break;
    default:
      throw new Error(`不支持的时间单位: ${unit}`);
  }
  
  return d;
} 