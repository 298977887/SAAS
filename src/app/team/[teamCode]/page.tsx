/**
 * 团队仪表盘页面
 * 作者: 阿瑞
 * 功能: 显示团队数据概览和统计信息
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { useAccessToken } from '@/store/userStore';
import { MdPeople, MdStorefront, MdInventory, MdTrendingUp, MdLocalShipping, MdInfo } from 'react-icons/md';

/**
 * 统计卡片组件
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  loading?: boolean;
  isDarkMode?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, loading, isDarkMode }) => (
  <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-5 flex flex-col`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        {title}
      </h3>
      <div className={`p-3 rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-accent-blue/10'}`}>
        {icon}
      </div>
    </div>
    {loading ? (
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
    ) : (
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    )}
  </div>
);

/**
 * 团队仪表盘页面组件
 */
export default function TeamDashboard() {
  const { teamCode } = useParams();
  const { currentTeam } = useTeam();
  const themeMode = useThemeMode();
  const accessToken = useAccessToken();
  const isDarkMode = themeMode === ThemeMode.Dark;

  const [stats, setStats] = useState({
    customers: 0,
    shops: 0,
    products: 0,
    orders: 0,
    suppliers: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  // 模拟获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      if (!teamCode || !accessToken || !currentTeam) return;

      setIsLoading(true);

      try {
        // 这里应该是实际API调用，暂时模拟数据
        // const response = await fetch(`/api/team/${teamCode}/stats`, {
        //   headers: { Authorization: `Bearer ${accessToken}` }
        // });
        // const data = await response.json();

        // 模拟延迟和数据
        await new Promise(resolve => setTimeout(resolve, 1200));

        // 模拟数据
        setStats({
          customers: 128,
          shops: 5,
          products: 76,
          orders: 243,
          suppliers: 12
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [teamCode, accessToken, currentTeam]);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {currentTeam?.name || ''} 团队仪表盘
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          查看团队整体运营状态和关键指标
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="客户总数"
          value={stats.customers}
          icon={<MdPeople className="text-accent-blue text-xl" />}
          trend={8.2}
          loading={isLoading}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="店铺数量"
          value={stats.shops}
          icon={<MdStorefront className="text-accent-purple text-xl" />}
          loading={isLoading}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="产品数量"
          value={stats.products}
          icon={<MdInventory className="text-accent-teal text-xl" />}
          trend={4.5}
          loading={isLoading}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="订单总数"
          value={stats.orders}
          icon={<MdTrendingUp className="text-accent-orange text-xl" />}
          trend={12.3}
          loading={isLoading}
          isDarkMode={isDarkMode}
        />
        <StatCard
          title="供应商数量"
          value={stats.suppliers}
          icon={<MdLocalShipping className="text-accent-pink text-xl" />}
          loading={isLoading}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* 系统消息和提示 */}
      <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-6 mb-8`}>
        <div className="flex items-start">
          <div className="p-3 rounded-full bg-blue-500/10 mr-4">
            <MdInfo className="text-xl text-blue-500" />
          </div>
          <div>
            <h3 className={`font-medium text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              开始使用管理系统
            </h3>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              欢迎使用团队管理系统，您可以从左侧导航菜单访问各个功能模块，管理客户、产品、订单等数据。
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <button className="btn-secondary py-2 px-4">查看使用指南</button>
              <button className="btn-primary py-2 px-4">导入数据</button>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-6`}>
        <h2 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>最近活动</h2>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="ml-3 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center`}>
              <div className="p-2 rounded-full bg-green-500/10 mr-3">
                <MdPeople className="text-lg text-green-500" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>新增客户 "张小姐" (1317620****)</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>10分钟前</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center`}>
              <div className="p-2 rounded-full bg-blue-500/10 mr-3">
                <MdInventory className="text-lg text-blue-500" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>新增产品 "高端美白套装"</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>30分钟前</p>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} flex items-center`}>
              <div className="p-2 rounded-full bg-purple-500/10 mr-3">
                <MdTrendingUp className="text-lg text-purple-500" />
              </div>
              <div>
                <p className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>新订单 #2023112 已生成</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>2小时前</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 