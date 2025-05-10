/**
 * 数据工具函数
 * 作者: 阿瑞
 * 功能: 提供数据处理相关的工具函数
 * 版本: 1.0.0
 */

import { ShopFollowerGrowth, Shop } from '../types';

/**
 * 计算店铺在选定月份的总增长
 * @param shopId 店铺ID
 * @param growthRecords 增长记录数组
 * @returns 月总增长数
 */
export const calculateMonthlyGrowth = (shopId: number, growthRecords: ShopFollowerGrowth[]): number => {
  const shopRecords = growthRecords.filter(r => r.shop_id === shopId);
  return shopRecords.reduce((sum, record) => sum + record.daily_increase, 0);
};

/**
 * 计算指定日期的所有店铺总增长
 * @param date 指定日期
 * @param growthRecords 增长记录数组
 * @returns 当日所有店铺的总增长数
 */
export const calculateDateTotalGrowth = (date: string, growthRecords: ShopFollowerGrowth[]): number => {
  const dateRecords = growthRecords.filter(r => r.date === date);
  return dateRecords.reduce((sum, record) => sum + record.daily_increase, 0);
};

/**
 * 获取店铺名称
 * @param shopId 店铺ID
 * @param shops 店铺数组
 * @returns 格式化的店铺名称
 */
export const getShopName = (shopId: number, shops: Shop[]): string => {
  const shop = shops.find(s => s.id === shopId);
  return shop ? (shop.nickname || shop.wechat || `店铺ID: ${shopId}`) : `店铺ID: ${shopId}`;
}; 