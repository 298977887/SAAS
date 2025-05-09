/**
 * 团队管理布局
 * 作者: 阿瑞
 * 功能: 提供团队管理页面的基础布局，包括侧边栏和主内容区域
 * 版本: 1.0.0
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { TeamProvider, useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { useIsAuthenticated } from '@/store/userStore';
import { MdPeople, MdCategory, MdBrush, MdLocalShipping, MdInventory, MdStorefront, MdPayment, MdReceiptLong, MdOutlineSupportAgent, MdLocalOffer, MdDashboard, MdSwapHoriz } from 'react-icons/md';

/**
 * 侧边栏菜单项类型
 */
interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * 侧边栏组件
 */
const Sidebar: React.FC = () => {
  const { currentTeam } = useTeam();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname(); // 使用usePathname替代window.location.pathname
  const teamCode = params?.teamCode as string;
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;

  // 如果没有团队Code，不渲染侧边栏
  if (!teamCode) return null;

  // 菜单项配置
  const getMenuItems = (): MenuItem[] => [
    { name: '概览仪表盘', path: `/team/${teamCode}`, icon: <MdDashboard className="text-xl" /> },
    { name: '品牌管理', path: `/team/${teamCode}/brands`, icon: <MdBrush className="text-xl" /> },
    { name: '品类管理', path: `/team/${teamCode}/categories`, icon: <MdCategory className="text-xl" /> },
    { name: '供应商管理', path: `/team/${teamCode}/suppliers`, icon: <MdLocalShipping className="text-xl" /> },
    { name: '产品管理', path: `/team/${teamCode}/products`, icon: <MdInventory className="text-xl" /> },
    { name: '店铺管理', path: `/team/${teamCode}/shops`, icon: <MdStorefront className="text-xl" /> },
    { name: '支付平台', path: `/team/${teamCode}/payment-platforms`, icon: <MdPayment className="text-xl" /> },
    { name: '客户管理', path: `/team/${teamCode}/customers`, icon: <MdPeople className="text-xl" /> },
    { name: '创建销售记录', path: `/team/${teamCode}/sales`, icon: <MdReceiptLong className="text-xl" /> },
    { name: '销售列表', path: `/team/${teamCode}/sales-records`, icon: <MdReceiptLong className="text-xl" /> },
    { name: '售后管理', path: `/team/${teamCode}/after-sales`, icon: <MdOutlineSupportAgent className="text-xl" /> },
    { name: '物流管理', path: `/team/${teamCode}/logistics`, icon: <MdLocalOffer className="text-xl" /> },
  ];

  const menuItems = getMenuItems();

  /**
   * 切换到工作空间
   */
  const handleSwitchWorkspace = () => {
    router.push('/workspace');
  };

  /**
   * 判断菜单项是否处于活动状态
   */
  const isActive = (itemPath: string) => {
    // 精确匹配路径
    if (pathname === itemPath) return true;

    // 对于首页（仪表盘）特殊处理
    if (itemPath === `/team/${teamCode}` && pathname === `/team/${teamCode}`) return true;

    // 子页面匹配（处理子路由）
    return itemPath !== `/team/${teamCode}` && pathname?.startsWith(itemPath);
  };

  /**
   * 处理菜单项点击
   */
  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <aside className={`w-60 h-screen overflow-y-auto fixed left-0 top-0 z-10 ${isDarkMode ? 'glass-card-dark' : 'glass-card'} border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h1 className={`text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentTeam?.name || '加载中...'}
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>团队管理系统</p>
      </div>

      <nav className="mt-5 px-3">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => handleMenuClick(item.path)}
                className={`
                  w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200
                  ${isActive(item.path)
                    ? `${isDarkMode
                      ? 'bg-white/10 text-white border-l-4 border-blue-500'
                      : 'bg-blue-100 text-blue-700 shadow-md border-l-4 border-blue-500 font-medium'
                    }`
                    : `${isDarkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                `}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="absolute bottom-5 left-0 right-0 px-5 space-y-3">
        <div className={`p-4 rounded-xl text-sm ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
          <div className="font-medium mb-1">团队编码:</div>
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-500'} truncate`}>
            {currentTeam?.teamCode || '-'}
          </div>
        </div>

        {/* 切换团队按钮 */}
        <button
          onClick={handleSwitchWorkspace}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-center transition-colors ${isDarkMode
            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
            : 'bg-blue-500/90 text-white hover:bg-blue-600'
            }`}
        >
          <MdSwapHoriz className="mr-2 text-xl" />
          切换团队
        </button>
      </div>
    </aside>
  );
};

/**
 * 团队管理内容包装器组件
 */
const TeamLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { currentTeam, isLoading, error } = useTeam();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;

  useEffect(() => {
    // 未认证用户重定向到登录页
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>正在验证登录状态...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>加载团队信息...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>加载失败</h2>
          <p className={`mb-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => router.push('/workspace')}
            className="btn-primary"
          >
            返回工作空间
          </button>
        </div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>未选择团队</h2>
          <p className={`mb-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>请从工作空间选择一个团队进行管理</p>
          <button
            onClick={() => router.push('/workspace')}
            className="btn-primary"
          >
            返回工作空间
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <Sidebar />

      {/* 主内容区域 */}
      <main className={`h-screen overflow-y-auto ml-64 flex-1 pl-2 ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`} >
        <div className="px-6 mt-6">
          {children}
        </div>
      </main>

    </div>
  );
};

/**
 * 团队管理布局组件
 */
export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeamProvider>
      <TeamLayoutContent>
        {children}
      </TeamLayoutContent>
    </TeamProvider>
  );
} 