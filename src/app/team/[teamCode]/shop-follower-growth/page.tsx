/**
 * 店铺粉丝增长页面
 * 作者: 阿瑞
 * 功能: 提供店铺粉丝增长的记录和管理功能
 * 版本: 1.5.0
 * 
 * 更新说明:
 * v1.5.0 - 修复了时区问题导致的日期错误显示，确保数据库中2025-05-05的数据正确显示在5月5日而不是5月4日
 * v1.4.0 - 移除了自动保存功能，改为仅支持手动保存
 * v1.3.0 - 增加了数据缓存和性能优化
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAccessToken } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import Card from '@/components/ui/Card';
import { useNotification } from '@/components/ui/Notification';

// 导入拆分的组件
import TableHeader from './components/TableHeader';
import ShopDataRow from './components/ShopDataRow';
import ControlPanel from './components/ControlPanel';

// 导入类型
import { ShopFollowerGrowth, Shop, EditedData } from './types';

// 导入工具函数
import { generateDatesForMonth } from './utils/dateUtils';
import { calculateMonthlyGrowth, calculateDateTotalGrowth } from './utils/dataUtils';
import { fetchGrowthRecords, fetchShops, saveGrowthRecord } from './services/apiService';

// 最大重试次数
const MAX_RETRY_COUNT = 3;

/**
 * 店铺粉丝增长页面组件
 */
export default function ShopFollowerGrowthPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const notification = useNotification();
  const isDarkMode = themeMode === ThemeMode.Dark;

  // 使用 useRef 跟踪请求状态和数据缓存，避免闭包问题
  const isLoadingGrowthRef = useRef(false);
  const isLoadingShopsRef = useRef(false);
  const initialDataLoadedRef = useRef(false);
  const dataFetchedMonthRef = useRef<string | null>(null);
  const dataDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 数据状态
  const [growthRecords, setGrowthRecords] = useState<ShopFollowerGrowth[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editedData, setEditedData] = useState<EditedData>({});
  
  // 日期状态
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // 格式: YYYY-MM
  );

  // 保存更改状态
  const [savingData, setSavingData] = useState<boolean>(false);
  
  /**
   * 使用useMemo生成并缓存当月日期列表
   */
  const monthDates = useMemo(() => 
    generateDatesForMonth(selectedMonth), 
    [selectedMonth]
  );

  /**
   * 加载粉丝增长数据的包装函数
   */
  const loadGrowthRecords = useCallback(async (forceRefresh: boolean = false) => {
    // 检查是否已在加载中和必要条件
    if (!teamCode || !accessToken) {
      return;
    }

    // 如果没有强制刷新且正在加载中或已加载相同月份的数据，则跳过
    if (!forceRefresh && (isLoadingGrowthRef.current || dataFetchedMonthRef.current === selectedMonth)) {
      return;
    }

    // 防抖处理，取消之前的计时器
    if (dataDebounceTimerRef.current) {
      clearTimeout(dataDebounceTimerRef.current);
      dataDebounceTimerRef.current = null;
    }

    // 设置加载状态
    isLoadingGrowthRef.current = true;
    setIsLoading(true);
    
    // 使用防抖延迟300ms执行，避免频繁请求
    dataDebounceTimerRef.current = setTimeout(async () => {
      try {
        console.log(`加载${selectedMonth}月份的粉丝增长数据`); // 调试日志
        const records = await fetchGrowthRecords(teamCode, accessToken, selectedMonth);
        
        // 将API获取到的原始数据输出到控制台
        console.group('从API获取的店铺粉丝增长数据');
        console.log('月份:', selectedMonth);
        console.log('记录数量:', records.length);
        console.log('原始数据:', JSON.stringify(records, null, 2));
        
        // 添加一些数据统计
        const shopIds = [...new Set(records.map(r => r.shop_id))];
        console.log('包含的店铺ID:', shopIds);
        
        // 按日期统计数据
        const dateGroups = records.reduce((groups: Record<string, number>, record) => {
          groups[record.date] = (groups[record.date] || 0) + 1;
          return groups;
        }, {});
        console.log('每日数据分布:', dateGroups);
        
        // 特别标记5月5日的数据
        const may5thData = records.filter(r => r.date === '2025-05-05');
        if (may5thData.length > 0) {
          console.log('2025-05-05日期的数据:', may5thData);
        }
        
        console.groupEnd();
        
        setGrowthRecords(records);
        
        // 记录已加载的月份
        dataFetchedMonthRef.current = selectedMonth;
      } catch (error) {
        console.error('获取粉丝增长记录失败:', error);
        notification.error('获取粉丝增长记录失败', { title: '数据加载错误' });
      } finally {
        isLoadingGrowthRef.current = false;
        setIsLoading(false);
        dataDebounceTimerRef.current = null;
      }
    }, 300);
  }, [teamCode, accessToken, notification, selectedMonth]);

  /**
   * 加载店铺列表的包装函数
   */
  const loadShops = useCallback(async (forceRefresh: boolean = false) => {
    // 检查是否已在加载中和必要条件
    if (!teamCode || !accessToken || (!forceRefresh && isLoadingShopsRef.current)) {
      return;
    }

    isLoadingShopsRef.current = true;
    setIsLoading(true);

    try {
      const shopsList = await fetchShops(teamCode, accessToken);
      
      // 将API获取到的店铺数据输出到控制台
      console.group('从API获取的店铺数据');
      console.log('店铺数量:', shopsList.length);
      console.log('店铺列表:', JSON.stringify(shopsList, null, 2));
      console.groupEnd();
      
      setShops(shopsList);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      notification.error('获取店铺列表失败', { title: '数据加载错误' });
    } finally {
      isLoadingShopsRef.current = false;
      setIsLoading(false);
    }
  }, [teamCode, accessToken, notification]);

  /**
   * 初始加载数据 - 只在组件挂载时执行一次
   */
  useEffect(() => {
    // 仅在组件挂载且必要条件满足且未加载初始数据时执行
    if (accessToken && teamCode && !initialDataLoadedRef.current) {
      const loadInitialData = async () => {
        // 标记为已开始加载初始数据
        initialDataLoadedRef.current = true;
        
        try {
          // 按顺序执行加载任务，避免并发请求
          await loadShops(true);
          await loadGrowthRecords(true);
          
          // 在数据加载完成后，检查数据日期匹配情况
          setTimeout(() => {
            validateDateMatching();
          }, 500);
        } catch (error) {
          console.error('初始数据加载失败:', error);
          // 加载失败时重置标记，允许重试
          initialDataLoadedRef.current = false;
        }
      };
      
      loadInitialData();
    }
    
    // 清理函数
    return () => {
      // 组件卸载时清理状态和定时器
      if (dataDebounceTimerRef.current) {
        clearTimeout(dataDebounceTimerRef.current);
      }
      isLoadingGrowthRef.current = false;
      isLoadingShopsRef.current = false;
    };
  }, []); // 只在挂载时执行一次，移除依赖数组中的函数引用
  
  /**
   * 验证日期匹配情况，帮助调试
   */
  const validateDateMatching = useCallback(() => {
    if (growthRecords.length === 0) {
      console.log('没有可用的增长记录数据来验证');
      return;
    }
    
    console.group('日期匹配验证');
    console.log('所有增长记录:', growthRecords);
    console.log('月份日期生成:', monthDates);
    
    growthRecords.forEach(record => {
      const matchedDate = monthDates.find(d => d.date === record.date);
      console.log(
        `记录日期 [${record.date}] ${matchedDate ? '正确匹配' : '无法匹配'} ${
          matchedDate ? matchedDate.formatted : '无匹配日期'
        } (店铺ID: ${record.shop_id}, 值: ${record.total}/${record.deducted})`
      );
    });
    
    console.groupEnd();
  }, [growthRecords, monthDates]);

  /**
   * 月份变更时重新加载粉丝增长数据
   */
  useEffect(() => {
    // 只有在初始数据已加载后才响应月份变化
    if (accessToken && teamCode && initialDataLoadedRef.current && 
        dataFetchedMonthRef.current !== selectedMonth) {
      loadGrowthRecords(true);
    }
  }, [selectedMonth, accessToken, teamCode, loadGrowthRecords]);

  /**
   * 获取指定店铺和日期的记录数据
   */
  const getRecordData = useCallback((shopId: number, date: string) => {
    // 首先检查编辑状态中是否有数据
    if (editedData[shopId]?.[date]) {
      return editedData[shopId][date];
    }
    
    // 从记录中查找，确保日期格式匹配
    const record = growthRecords.find(r => 
      r.shop_id === shopId && r.date === date
    );
    
    if (record) {
      return {
        total: record.total,
        deducted: record.deducted
      };
    }
    
    // 默认值
    return { total: 0, deducted: 0 };
  }, [editedData, growthRecords]);

  /**
   * 处理数据输入变更
   */
  const handleDataChange = useCallback((shopId: number, date: string, field: 'total' | 'deducted', value: number) => {
    setEditedData(prev => {
      const shopData = prev[shopId] || {};
      const dateData = shopData[date] || getRecordData(shopId, date);
      
      return {
        ...prev,
        [shopId]: {
          ...shopData,
          [date]: {
            ...dateData,
            [field]: value
          }
        }
      };
    });
  }, [getRecordData]);

  /**
   * 包装计算店铺月增长的函数
   */
  const getMonthlyGrowth = useCallback((shopId: number) => {
    return calculateMonthlyGrowth(shopId, growthRecords);
  }, [growthRecords]);

  /**
   * 包装计算日期总增长的函数
   */
  const getDateTotalGrowth = useCallback((date: string) => {
    return calculateDateTotalGrowth(date, growthRecords);
  }, [growthRecords]);

  /**
   * 保存单条记录 - 支持重试机制
   */
  const saveRecord = useCallback(async (shopId: number, date: string, retryCount = 0) => {
    if (!editedData[shopId]?.[date]) return;
    
    const { total, deducted } = editedData[shopId][date];
    if (retryCount === 0) {
      setSavingData(true);
    }
    
    try {
      // 查找现有记录
      const existingRecord = growthRecords.find(r => 
        r.shop_id === shopId && r.date === date
      );
      
      // 准备记录数据
      const recordData = {
        shop_id: shopId,
        date,
        total,
        deducted,
        daily_increase: total - deducted
      };
      
      // 保存记录
      const savedRecord = await saveGrowthRecord(
        teamCode, 
        accessToken, 
        recordData, 
        existingRecord?.id
      );
      
      // 清除已保存的编辑数据
      setEditedData(prev => {
        const newData = { ...prev };
        if (newData[shopId]) {
          const shopData = { ...newData[shopId] };
          delete shopData[date];
          
          if (Object.keys(shopData).length === 0) {
            delete newData[shopId];
          } else {
            newData[shopId] = shopData;
          }
        }
        return newData;
      });
      
      // 只在初次尝试成功时显示提示
      if (retryCount === 0) {
        notification.success('数据保存成功', { title: '保存成功' });
      }
      
      if (existingRecord) {
        // 更新现有记录
        setGrowthRecords(prev => 
          prev.map(record => 
            record.id === existingRecord.id ? savedRecord : record
          )
        );
      } else {
        // 添加新记录
        setGrowthRecords(prev => [...prev, savedRecord]);
      }
      
      return savedRecord;
    } catch (error) {
      console.error(`保存记录失败 (尝试 ${retryCount + 1}/${MAX_RETRY_COUNT}):`, error);
      
      // 如果还有重试次数，则重试
      if (retryCount < MAX_RETRY_COUNT - 1) {
        console.log(`尝试重新保存记录 (${retryCount + 2}/${MAX_RETRY_COUNT})...`);
        // 递归调用自身重试，增加重试计数
        return await saveRecord(shopId, date, retryCount + 1);
      }
      
      // 只在最后一次尝试失败时显示错误提示
      if (retryCount === MAX_RETRY_COUNT - 1) {
        notification.error(
          error instanceof Error ? error.message : '保存记录失败', 
          { title: '保存失败' }
        );
      }
      
      // 重新抛出错误
      throw error;
    } finally {
      // 只在最终尝试后重置状态
      if (retryCount === 0 || retryCount === MAX_RETRY_COUNT - 1) {
        setSavingData(false);
      }
    }
  }, [editedData, growthRecords, teamCode, accessToken, notification]);

  /**
   * 保存所有编辑的数据
   */
  const saveAllEditedData = useCallback(async () => {
    setSavingData(true);
    let successCount = 0;
    let errorCount = 0;
    let recordsToSave = 0;
    
    // 计算总记录数
    for (const shopId in editedData) {
      recordsToSave += Object.keys(editedData[parseInt(shopId)]).length;
    }
    
    // 如果没有记录需要保存，则提前返回
    if (recordsToSave === 0) {
      notification.info('没有需要保存的记录', { title: '保存提示' });
      setSavingData(false);
      return;
    }

    try {
      // 批量保存时使用标准Promise.all以提高性能
      const savePromises: Promise<void>[] = [];
      
      // 构建保存任务
      for (const shopId in editedData) {
        for (const date in editedData[parseInt(shopId)]) {
          const shopIdInt = parseInt(shopId);
          savePromises.push(
            saveRecord(shopIdInt, date)
              .then(() => { successCount++; })
              .catch(() => { errorCount++; })
          );
        }
      }
      
      // 等待所有保存操作完成
      await Promise.all(savePromises);

      // 显示结果通知
      if (errorCount === 0) {
        notification.success(`成功保存${successCount}条记录`, { title: '保存成功' });
      } else {
        notification.warning(`成功:${successCount}条, 失败:${errorCount}条`, { title: '部分保存成功' });
      }

      // 保存完成后手动刷新一次数据以确保一致性
      if (successCount > 0) {
        // 清除月份缓存，强制刷新
        dataFetchedMonthRef.current = null;
        await loadGrowthRecords(true);
      }
    } catch (error) {
      console.error('批量保存失败:', error);
      notification.error('批量保存失败', { title: '保存失败' });
    } finally {
      setSavingData(false);
    }
  }, [editedData, saveRecord, notification, loadGrowthRecords]);

  /**
   * 手动刷新数据
   */
  const refreshData = useCallback(() => {
    // 清除缓存的月份，强制刷新
    dataFetchedMonthRef.current = null;
    loadGrowthRecords(true);
  }, [loadGrowthRecords]);

  /**
   * 处理月份变更
   */
  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  }, []);

  /**
   * 计算当前是否有未保存的数据
   */
  const hasUnsavedChanges = Object.keys(editedData).length > 0;

  // 渲染空状态的组件
  const renderEmptyState = () => (
    <tr>
      <td 
        colSpan={monthDates.length * 3 + 1}
        className={`px-4 py-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
      >
        暂无店铺数据，请先添加店铺
      </td>
    </tr>
  );

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <span className="ml-3">加载数据中...</span>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          店铺粉丝增长管理
        </h1>
        <div className="flex justify-between items-center">
          <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
            记录和跟踪店铺粉丝的日增长情况
          </p>
          <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            注意：数据修改后需要手动点击"保存所有更改"按钮才能保存
          </p>
        </div>
      </div>

      {/* 控制面板 */}
      <ControlPanel 
        selectedMonth={selectedMonth}
        handleMonthChange={handleMonthChange}
        refreshData={refreshData}
        hasUnsavedChanges={hasUnsavedChanges}
        saveAllEditedData={saveAllEditedData}
        isLoading={isLoading}
        isLoadingRef={isLoadingGrowthRef.current}
        savingData={savingData}
        isDarkMode={isDarkMode}
      />

      {/* 表格区域 */}
      <Card 
        glassEffect={isDarkMode ? 'medium' : 'light'} 
        className="mb-6 overflow-hidden"
      >
        {isLoading ? renderLoading() : (
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <table className={`min-w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <TableHeader 
                monthDates={monthDates}
                isDarkMode={isDarkMode}
                calculateDateTotalGrowth={getDateTotalGrowth}
              />
              
              <tbody>
                {shops.length > 0 ? shops.map((shop) => (
                  <ShopDataRow 
                    key={shop.id}
                    shop={shop}
                    monthDates={monthDates}
                    growthRecords={growthRecords}
                    editedData={editedData}
                    isDarkMode={isDarkMode}
                    calculateMonthlyGrowth={getMonthlyGrowth}
                    getRecordData={getRecordData}
                    handleDataChange={handleDataChange}
                    saveRecord={saveRecord}
                  />
                )) : renderEmptyState()}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
