/**
 * 日期工具函数
 * 作者: 阿瑞
 * 功能: 提供日期处理相关的工具函数
 * 版本: 1.2.0
 */

import { DateColumn } from '../types';

/**
 * 生成日期背景色
 * @param index 日期索引
 * @returns 背景色十六进制代码
 */
export const generateBackgroundColor = (index: number): string => {
  const colors = ['#E6F7FF', '#FFFBE6', '#E6F7FF', '#E6FFFB', '#F0F5FF'];
  return colors[index % colors.length];
};

/**
 * 生成当月的日期列
 * @param selectedMonth 选中的月份(YYYY-MM格式)
 * @returns 当月所有日期的数组
 */
export const generateDatesForMonth = (selectedMonth: string): DateColumn[] => {
  const [year, month] = selectedMonth.split('-');
  // 获取月份天数
  const daysInMonth = new Date(Date.UTC(parseInt(year), parseInt(month), 0)).getDate();
  const dates: DateColumn[] = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    // 使用ISO日期格式，确保日期字符串的一致性
    const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    dates.push({
      date,
      formatted: `${month}-${day.toString().padStart(2, '0')}`,
      backgroundColor: generateBackgroundColor((day - 1) % 5)
    });
  }
  
  return dates;
};

/**
 * 获取月份的开始和结束日期
 * @param selectedMonth 选中的月份(YYYY-MM格式)
 * @returns 包含开始和结束日期的对象
 */
export const getMonthDateRange = (selectedMonth: string): { startDate: string; endDate: string } => {
  const [year, month] = selectedMonth.split('-');
  // 构建标准格式的日期字符串
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  
  // 获取月份的最后一天
  const lastDay = new Date(Date.UTC(parseInt(year), parseInt(month), 0)).getDate();
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  
  return { startDate, endDate };
}; 