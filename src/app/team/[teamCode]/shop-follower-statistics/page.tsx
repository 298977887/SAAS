/**
 * 店铺粉丝统计页面
 * 作者: 阿瑞
 * 功能: 展示店铺粉丝增长统计和趋势分析
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAccessToken } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useNotification } from '@/components/ui/Notification';
import { MdStorefront, MdOutlineInsights } from 'react-icons/md';

/**
 * 店铺数据接口
 */
interface Shop {
  id: number;
  wechat: string;
  nickname: string;
  status: number;
}

/**
 * 统计数据接口
 */
interface StatisticsData {
  shop_id: number;
  shop_name: string;
  dates: string[];
  total_counts: number[];
  daily_increases: number[];
}

/**
 * 汇总数据接口
 */
interface SummaryData {
  shop_id: number;
  shop_name: string;
  avg_increase: number;
  total_increase: number;
  start_count: number;
  end_count: number;
  growth_rate: number;
}

/**
 * 店铺粉丝统计页面组件
 */
export default function ShopFollowerStatisticsPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const notification = useNotification();
  const isDarkMode = themeMode === ThemeMode.Dark;

  // 数据状态
  const [shops, setShops] = useState<Shop[]>([]);
  const [statisticsData, setStatisticsData] = useState<StatisticsData[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataFetched, setIsDataFetched] = useState(false);

  // 筛选状态
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'custom'>('30days');

  /**
   * 获取店铺列表 - 仅依赖基本参数
   */
  const fetchShops = useCallback(async () => {
    if (!teamCode || !accessToken) return;

    try {
      const response = await fetch(`/api/team/${teamCode}/shops`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('获取店铺列表失败');
      }

      const data = await response.json();
      setShops(data.shops || []);
      
      // 默认选择所有店铺
      if (data.shops && data.shops.length > 0) {
        const allShopIds = data.shops.map((shop: Shop) => shop.id);
        // 如果店铺数量超过5个，则默认只选择前5个，否则全选
        const defaultSelected = allShopIds.length > 5 ? allShopIds.slice(0, 5) : allShopIds;
        setSelectedShopIds(defaultSelected);
      }
    } catch (error) {
      console.error('获取店铺列表失败:', error);
      notification.error('获取店铺列表失败', { title: '数据加载错误' });
    }
  }, [teamCode, accessToken, notification]);

  /**
   * 获取统计数据
   */
  const fetchStatisticsData = useCallback(async () => {
    if (!teamCode || !accessToken || selectedShopIds.length === 0) return;
    
    if (isDataFetched) return; // 防止重复请求
    
    setIsLoading(true);
    setIsDataFetched(true);

    try {
      // 构建查询参数
      const queryParams = new URLSearchParams();
      
      selectedShopIds.forEach(id => {
        queryParams.append('shopIds', id.toString());
      });
      
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(`/api/team/${teamCode}/shop-follower-growth/statistics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }

      const data = await response.json();
      setStatisticsData(data.statistics || []);
      
      // 处理汇总数据
      processStatisticsData(data.statistics || []);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      notification.error('获取统计数据失败', { title: '数据加载错误' });
    } finally {
      setIsLoading(false);
    }
  }, [teamCode, accessToken, selectedShopIds, startDate, endDate, notification, isDataFetched]);

  /**
   * 处理统计数据生成汇总信息
   */
  const processStatisticsData = (data: StatisticsData[]) => {
    const summary: SummaryData[] = data.map(shop => {
      const validIncreases = shop.daily_increases.filter(val => !isNaN(val));
      const sum = validIncreases.reduce((acc, val) => acc + val, 0);
      const startCount = shop.total_counts[0] || 0;
      const endCount = shop.total_counts[shop.total_counts.length - 1] || 0;
      
      return {
        shop_id: shop.shop_id,
        shop_name: shop.shop_name,
        avg_increase: validIncreases.length > 0 ? sum / validIncreases.length : 0,
        total_increase: sum,
        start_count: startCount,
        end_count: endCount,
        growth_rate: startCount > 0 ? ((endCount - startCount) / startCount) * 100 : 0
      };
    });
    
    // 按平均日增长排序
    summary.sort((a, b) => b.avg_increase - a.avg_increase);
    setSummaryData(summary);
  };

  /**
   * 初始化时间范围
   */
  const initializeTimeRange = useCallback(() => {
    const now = new Date();
    let start = new Date();
    
    if (timeRange === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (timeRange === '90days') {
      start.setDate(now.getDate() - 90);
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, [timeRange]);

  /**
   * 初始化页面 - 只执行一次
   */
  useEffect(() => {
    let isMounted = true;
    
    if (accessToken && teamCode) {
      fetchShops().then(() => {
        if (isMounted) {
          initializeTimeRange();
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  /**
   * 时间范围变化后重置数据获取状态
   */
  useEffect(() => {
    setIsDataFetched(false);
  }, [startDate, endDate, selectedShopIds]);

  /**
   * 处理查询按钮点击
   */
  const handleSearch = () => {
    setIsDataFetched(false);
    fetchStatisticsData();
  };

  /**
   * 处理时间范围变化
   */
  const handleTimeRangeChange = (range: '7days' | '30days' | '90days' | 'custom') => {
    setTimeRange(range);
    
    if (range !== 'custom') {
      const now = new Date();
      let start = new Date();
      
      if (range === '7days') {
        start.setDate(now.getDate() - 7);
      } else if (range === '30days') {
        start.setDate(now.getDate() - 30);
      } else if (range === '90days') {
        start.setDate(now.getDate() - 90);
      }
      
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  /**
   * 处理店铺选择变化
   */
  const handleShopSelection = (shopId: number) => {
    setSelectedShopIds(prev => {
      if (prev.includes(shopId)) {
        return prev.filter(id => id !== shopId);
      } else {
        return [...prev, shopId];
      }
    });
  };

  /**
   * 处理全选/取消全选
   */
  const handleSelectAllShops = () => {
    if (selectedShopIds.length === shops.length) {
      setSelectedShopIds([]);
    } else {
      setSelectedShopIds(shops.map(shop => shop.id));
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          店铺粉丝增长统计
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          分析和比较各店铺粉丝增长趋势
        </p>
      </div>

      {/* 筛选控件 */}
      <Card 
        glassEffect={isDarkMode ? 'medium' : 'light'} 
        className="mb-6"
      >
        <div className="space-y-4">
          <div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              时间范围
            </h3>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant={timeRange === '7days' ? 'primary' : 'secondary'} 
                buttonStyle={timeRange === '7days' ? 'solid' : 'outline'} 
                onClick={() => handleTimeRangeChange('7days')}
              >
                近7天
              </Button>
              <Button 
                size="sm" 
                variant={timeRange === '30days' ? 'primary' : 'secondary'} 
                buttonStyle={timeRange === '30days' ? 'solid' : 'outline'} 
                onClick={() => handleTimeRangeChange('30days')}
              >
                近30天
              </Button>
              <Button 
                size="sm" 
                variant={timeRange === '90days' ? 'primary' : 'secondary'} 
                buttonStyle={timeRange === '90days' ? 'solid' : 'outline'} 
                onClick={() => handleTimeRangeChange('90days')}
              >
                近90天
              </Button>
              <Button 
                size="sm" 
                variant={timeRange === 'custom' ? 'primary' : 'secondary'} 
                buttonStyle={timeRange === 'custom' ? 'solid' : 'outline'} 
                onClick={() => handleTimeRangeChange('custom')}
              >
                自定义
              </Button>
            </div>
          </div>

          {timeRange === 'custom' && (
            <div className="flex flex-wrap gap-4">
              <div className="w-full md:w-48">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  开始日期
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                />
              </div>
              <div className="w-full md:w-48">
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  结束日期
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                />
              </div>
            </div>
          )}

          <div>
            <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              店铺选择
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button 
                size="sm" 
                variant="secondary" 
                buttonStyle="outline" 
                onClick={handleSelectAllShops}
              >
                {selectedShopIds.length === shops.length ? '取消全选' : '全选'}
              </Button>
              {shops.map(shop => (
                <Button
                  key={shop.id}
                  size="sm"
                  variant={selectedShopIds.includes(shop.id) ? 'primary' : 'secondary'}
                  buttonStyle={selectedShopIds.includes(shop.id) ? 'solid' : 'outline'}
                  onClick={() => handleShopSelection(shop.id)}
                >
                  {shop.nickname || shop.wechat || `店铺ID: ${shop.id}`}
                </Button>
              ))}
            </div>
          </div>

          {selectedShopIds.length === 0 && (
            <div className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              请至少选择一个店铺进行数据分析
            </div>
          )}
          
          <div className="flex justify-end pt-2">
            <Button 
              variant="primary" 
              onClick={handleSearch} 
              disabled={selectedShopIds.length === 0 || !startDate || !endDate}
            >
              查询数据
            </Button>
          </div>
        </div>
      </Card>

      {/* 数据展示 */}
      {isLoading ? (
        <Card 
          glassEffect={isDarkMode ? 'medium' : 'light'} 
          className="min-h-64 flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>加载统计数据...</p>
          </div>
        </Card>
      ) : statisticsData.length === 0 ? (
        <Card 
          glassEffect={isDarkMode ? 'medium' : 'light'} 
          className="min-h-64 flex items-center justify-center"
        >
          <div className="text-center">
            <MdOutlineInsights className={`text-5xl mb-3 mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>暂无数据</p>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-2`}>
              选择店铺和时间范围后查看统计数据
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 汇总数据表格 */}
          <Card 
            glassEffect={isDarkMode ? 'medium' : 'light'} 
            className="mb-6"
          >
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              店铺粉丝增长汇总
            </h3>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      店铺
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      初始粉丝数
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      当前粉丝数
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      总增长量
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      平均日增长
                    </th>
                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                      增长率
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {summaryData.map((shop) => (
                    <tr key={shop.shop_id}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <div className="flex items-center">
                          <MdStorefront className={`mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                          {shop.shop_name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {shop.start_count.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        {shop.end_count.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        shop.total_increase > 0 
                          ? 'text-green-500' 
                          : shop.total_increase < 0 
                            ? 'text-red-500' 
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {shop.total_increase > 0 ? '+' : ''}{shop.total_increase.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        shop.avg_increase > 0 
                          ? 'text-green-500' 
                          : shop.avg_increase < 0 
                            ? 'text-red-500' 
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {shop.avg_increase > 0 ? '+' : ''}{shop.avg_increase.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        shop.growth_rate > 0 
                          ? 'text-green-500' 
                          : shop.growth_rate < 0 
                            ? 'text-red-500' 
                            : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {shop.growth_rate > 0 ? '+' : ''}{shop.growth_rate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 数据明细 */}
          <Card 
            glassEffect={isDarkMode ? 'medium' : 'light'} 
            className="mb-6"
          >
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              店铺粉丝每日增长明细
            </h3>
            <div className="space-y-8">
              {statisticsData.map(shopData => (
                <div key={shopData.shop_id} className="space-y-4">
                  <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
                    <MdStorefront className="mr-2" />
                    {shopData.shop_name}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      <thead className={isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}>
                        <tr>
                          <th scope="col" className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            日期
                          </th>
                          <th scope="col" className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            粉丝总数
                          </th>
                          <th scope="col" className={`px-4 py-2 text-left text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                            日增长
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {shopData.dates.map((date, index) => (
                          <tr key={date}>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {date}
                            </td>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {shopData.total_counts[index].toLocaleString()}
                            </td>
                            <td className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                              shopData.daily_increases[index] > 0 
                                ? 'text-green-500' 
                                : shopData.daily_increases[index] < 0 
                                  ? 'text-red-500' 
                                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {shopData.daily_increases[index] > 0 ? '+' : ''}{shopData.daily_increases[index].toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 