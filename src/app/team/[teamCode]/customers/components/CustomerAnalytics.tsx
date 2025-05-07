/**
 * 客户分析组件
 * 作者: 阿瑞
 * 功能: 分析客户数据，展示性别比例、地区占比和统计数据
 * 版本: 1.0.0
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useThemeMode } from '@/store/settingStore';
import { useAccessToken } from '@/store/userStore';
import { ThemeMode } from '@/types/enum';
import { Customer, CustomerGender } from '@/models/team/types/customer';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import {
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GridComponent
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

// 注册必要的组件
echarts.use([
  PieChart,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GridComponent,
  LabelLayout,
  CanvasRenderer
]);

interface CustomerAnalyticsProps {
  className?: string;
}

/**
 * 客户数据分析组件
 */
export default function CustomerAnalytics({ className }: CustomerAnalyticsProps) {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 图表容器引用
  const genderChartRef = useRef<HTMLDivElement>(null);
  const regionChartRef = useRef<HTMLDivElement>(null);
  
  // 图表实例引用
  const [genderChart, setGenderChart] = useState<echarts.ECharts | null>(null);
  const [regionChart, setRegionChart] = useState<echarts.ECharts | null>(null);
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalCustomers: 0,
    totalBalance: 0,
    customersWithBalance: 0,
    customersWithoutBalance: 0
  });
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取客户统计数据
   */
  const fetchCustomerStatistics = async () => {
    if (!teamCode || !accessToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/team/${teamCode}/customers?pageSize=1000`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取客户数据失败');
      }
      
      const data = await response.json();
      const customers: Customer[] = data.customers || [];
      
      // 计算统计数据
      const totalCustomers = customers.length;
      
      // 确保balance是数字类型
      const totalBalance = customers.reduce((sum, customer) => {
        const balance = typeof customer.balance === 'number' ? customer.balance : parseFloat(customer.balance || '0');
        return sum + (isNaN(balance) ? 0 : balance);
      }, 0);
      
      const customersWithBalance = customers.filter(customer => {
        const balance = typeof customer.balance === 'number' ? customer.balance : parseFloat(customer.balance || '0');
        return !isNaN(balance) && balance > 0;
      }).length;
      
      const customersWithoutBalance = totalCustomers - customersWithBalance;
      
      setStatistics({
        totalCustomers,
        totalBalance,
        customersWithBalance,
        customersWithoutBalance
      });
      
      // 处理性别数据
      const genderData = processGenderData(customers);
      
      // 处理地区数据
      const regionData = processRegionData(customers);
      
      // 渲染图表
      renderGenderChart(genderData);
      renderRegionChart(regionData);
      
    } catch (err) {
      console.error('获取客户统计数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * 处理性别数据
   */
  const processGenderData = (customers: Customer[]) => {
    const maleCount = customers.filter(c => c.gender === CustomerGender.MALE).length;
    const femaleCount = customers.filter(c => c.gender === CustomerGender.FEMALE).length;
    const unknownCount = customers.filter(c => !c.gender || c.gender === undefined).length;
    
    return [
      { value: maleCount, name: '男性' },
      { value: femaleCount, name: '女性' },
      { value: unknownCount, name: '未知' }
    ];
  };
  
  /**
   * 处理地区数据
   */
  const processRegionData = (customers: Customer[]) => {
    const regionMap = new Map<string, number>();
    
    customers.forEach(customer => {
      if (!customer.address) return;
      
      let region = '';
      
      // 处理字符串形式的地址
      if (typeof customer.address === 'string') {
        try {
          const addressObj = JSON.parse(customer.address);
          region = addressObj.province || addressObj.city || '未知地区';
        } catch {
          region = '未知地区';
        }
      } else {
        // 处理对象形式的地址
        region = customer.address.province || customer.address.city || '未知地区';
      }
      
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });
    
    // 转换为ECharts需要的数据格式
    return Array.from(regionMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value) // 按数量降序排序
      .slice(0, 10); // 只取前10个地区
  };
  
  /**
   * 渲染性别比例图表
   */
  const renderGenderChart = (data: { value: number; name: string }[]) => {
    if (!genderChartRef.current) return;
    
    if (!genderChart) {
      const chart = echarts.init(genderChartRef.current);
      setGenderChart(chart);
    }
    
    const chartInstance = genderChart || echarts.init(genderChartRef.current);
    
    const option = {
      title: {
        text: '客户性别比例',
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        textStyle: {
          color: isDarkMode ? '#d1d5db' : '#4b5563'
        }
      },
      series: [
        {
          name: '性别比例',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: isDarkMode ? '#374151' : '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: isDarkMode ? '#f9fafb' : '#111827'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ],
      color: ['#3b82f6', '#ec4899', '#9ca3af']
    };
    
    chartInstance.setOption(option);
  };
  
  /**
   * 渲染地区占比图表
   */
  const renderRegionChart = (data: { value: number; name: string }[]) => {
    if (!regionChartRef.current) return;
    
    if (!regionChart) {
      const chart = echarts.init(regionChartRef.current);
      setRegionChart(chart);
    }
    
    const chartInstance = regionChart || echarts.init(regionChartRef.current);
    
    const option = {
      title: {
        text: '客户地区分布',
        left: 'center',
        textStyle: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 'bottom',
        textStyle: {
          color: isDarkMode ? '#d1d5db' : '#4b5563'
        }
      },
      series: [
        {
          name: '地区分布',
          type: 'pie',
          radius: '55%',
          center: ['50%', '50%'],
          data: data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
    
    chartInstance.setOption(option);
  };
  
  // 首次加载数据
  useEffect(() => {
    fetchCustomerStatistics();
  }, [teamCode, accessToken]);
  
  // 监听主题变化，更新图表
  useEffect(() => {
    if (genderChart && regionChart) {
      genderChart.dispose();
      regionChart.dispose();
      setGenderChart(null);
      setRegionChart(null);
      
      setTimeout(() => {
        fetchCustomerStatistics();
      }, 100);
    }
  }, [themeMode]);
  
  // 监听窗口大小变化，调整图表大小
  useEffect(() => {
    const handleResize = () => {
      genderChart?.resize();
      regionChart?.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      genderChart?.dispose();
      regionChart?.dispose();
    };
  }, [genderChart, regionChart]);
  
  // 格式化数字为货币格式
  const formatCurrency = (value: number): string => {
    return value.toFixed(2);
  };
  
  return (
    <div className={`${className || ''} ${isDarkMode ? 'glass-card-dark' : 'glass-card'} rounded-xl p-4 shadow-sm`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
        客户数据分析
      </h2>
      
      {isLoading && (
        <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          加载统计数据中...
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                客户总数
              </div>
              <div className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>
                {statistics.totalCustomers}
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                总余额
              </div>
              <div className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>
                ¥ {formatCurrency(statistics.totalBalance)}
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                有余额客户
              </div>
              <div className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                {statistics.customersWithBalance}
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800/40' : 'bg-gray-100'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                无余额客户
              </div>
              <div className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {statistics.customersWithoutBalance}
              </div>
            </div>
          </div>
          
          {/* 图表区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={genderChartRef} className="h-72 w-full"></div>
            <div ref={regionChartRef} className="h-72 w-full"></div>
          </div>
        </>
      )}
    </div>
  );
} 