/**
 * API服务层
 * 作者: 阿瑞
 * 功能: 提供与API交互的方法
 * 版本: 1.4.0
 */

import { ShopFollowerGrowth, Shop } from '../types';
import { getMonthDateRange } from '../utils/dateUtils';
import { formatDate } from '@/utils/date.utils';

// 记录缓存的数据
const recordsCache: Record<string, { data: ShopFollowerGrowth[], timestamp: number }> = {};
const shopsCache: { data: Shop[] | null, timestamp: number } = { data: null, timestamp: 0 };

// 缓存过期时间 (毫秒)
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟

/**
 * 生成缓存键
 * @param teamCode 团队代码
 * @param month 月份
 */
const generateCacheKey = (teamCode: string, month: string): string => {
  return `${teamCode}:${month}`;
};

/**
 * 获取粉丝增长记录
 * @param teamCode 团队代码
 * @param accessToken 访问令牌
 * @param selectedMonth 选中的月份
 * @returns 增长记录数组
 */
export const fetchGrowthRecords = async (
  teamCode: string, 
  accessToken: string, 
  selectedMonth: string
): Promise<ShopFollowerGrowth[]> => {
  const cacheKey = generateCacheKey(teamCode, selectedMonth);
  const currentTime = Date.now();
  
  // 检查缓存是否有效
  if (
    recordsCache[cacheKey] && 
    recordsCache[cacheKey].data.length > 0 && 
    currentTime - recordsCache[cacheKey].timestamp < CACHE_EXPIRY
  ) {
    console.log(`使用缓存的${selectedMonth}月份粉丝数据`);
    return recordsCache[cacheKey].data;
  }

  // 构建查询参数
  const queryParams = new URLSearchParams();
  
  // 获取选定月份的日期范围
  const { startDate, endDate } = getMonthDateRange(selectedMonth);
  
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);

  console.log(`请求API获取${selectedMonth}月份粉丝数据`);
  const response = await fetch(`/api/team/${teamCode}/shop-follower-growth?${queryParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    // 添加缓存控制，避免浏览器缓存导致的问题
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('获取粉丝增长记录失败');
  }

  const data = await response.json();
  const records = data.records || [];
  
  // 确保日期字段使用正确的格式，并保持原始字符串格式
  const formattedRecords = records.map((record: any) => ({
    ...record,
    date: typeof record.date === 'string' ? record.date : formatDate(record.date, 'YYYY-MM-DD')
  }));
  
  // 更新缓存
  recordsCache[cacheKey] = {
    data: formattedRecords,
    timestamp: currentTime
  };
  
  return formattedRecords;
};

/**
 * 获取店铺列表
 * @param teamCode 团队代码
 * @param accessToken 访问令牌
 * @returns 店铺数组
 */
export const fetchShops = async (
  teamCode: string, 
  accessToken: string
): Promise<Shop[]> => {
  const currentTime = Date.now();
  
  // 检查缓存是否有效
  if (
    shopsCache.data && 
    shopsCache.data.length > 0 && 
    currentTime - shopsCache.timestamp < CACHE_EXPIRY
  ) {
    console.log('使用缓存的店铺数据');
    return shopsCache.data;
  }

  console.log('请求API获取店铺数据');
  const response = await fetch(`/api/team/${teamCode}/shops`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    },
    // 添加缓存控制，避免浏览器缓存导致的问题
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('获取店铺列表失败');
  }

  const data = await response.json();
  const shops = data.shops || [];
  
  // 更新缓存
  shopsCache.data = shops;
  shopsCache.timestamp = currentTime;
  
  return shops;
};

/**
 * 保存粉丝增长记录
 * @param teamCode 团队代码
 * @param accessToken 访问令牌
 * @param record 记录数据
 * @param existingRecordId 现有记录ID (用于更新)
 * @returns 保存后的记录
 */
export const saveGrowthRecord = async (
  teamCode: string,
  accessToken: string,
  record: {
    shop_id: number;
    date: string;
    total: number;
    deducted: number;
    daily_increase: number;
  },
  existingRecordId?: number
): Promise<ShopFollowerGrowth> => {
  const url = existingRecordId 
    ? `/api/team/${teamCode}/shop-follower-growth/${existingRecordId}`
    : `/api/team/${teamCode}/shop-follower-growth`;

  const method = existingRecordId ? 'PUT' : 'POST';

  try {
    // 保持原始日期格式，确保不会因时区问题改变日期
    const formattedRecord = {
      ...record,
      // 如果日期已经是YYYY-MM-DD格式，直接使用
      date: typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date)
        ? record.date
        : formatDate(record.date, 'YYYY-MM-DD')
    };
    
    // 调试日志
    console.log(`保存记录 - 店铺ID: ${formattedRecord.shop_id}, 日期: ${formattedRecord.date}, 方法: ${method}`);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(formattedRecord)
    });

    if (!response.ok) {
      // 尝试获取响应中的详细错误信息
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = errorData.message || errorData.error || '';
      } catch (e) {
        // 如果无法解析响应JSON，则使用HTTP状态文本
        errorDetail = response.statusText;
      }
      
      throw new Error(`保存记录失败 (${response.status}): ${errorDetail}`);
    }

    const data = await response.json();
    
    // 检查API响应中是否包含record字段
    if (!data.record) {
      console.warn('API响应中缺少record字段，使用本地构建的记录替代');
      
      // 如果API响应中没有record，使用本地构建的记录作为替代
      const localRecord: ShopFollowerGrowth = {
        id: existingRecordId || Date.now(), // 使用现有ID或生成临时ID
        shop_id: formattedRecord.shop_id,
        date: formattedRecord.date,
        total: formattedRecord.total,
        deducted: formattedRecord.deducted,
        daily_increase: formattedRecord.daily_increase,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 更新记录后清除相关月份的缓存
      const month = formattedRecord.date.substring(0, 7); // 格式: YYYY-MM
      const cacheKey = generateCacheKey(teamCode, month);
      
      if (recordsCache[cacheKey]) {
        delete recordsCache[cacheKey];
      }
      
      return localRecord;
    }
    
    // 确保返回的记录日期格式正确
    const savedRecord = {
      ...data.record,
      date: typeof data.record.date === 'string' 
        ? data.record.date 
        : formatDate(data.record.date, 'YYYY-MM-DD')
    };
    
    // 更新记录后清除相关月份的缓存
    const month = formattedRecord.date.substring(0, 7); // 格式: YYYY-MM
    const cacheKey = generateCacheKey(teamCode, month);
    
    if (recordsCache[cacheKey]) {
      delete recordsCache[cacheKey];
    }
    
    return savedRecord;
  } catch (error) {
    console.error('保存记录错误:', error);
    // 重新抛出错误以便上层处理
    throw error;
  }
}; 