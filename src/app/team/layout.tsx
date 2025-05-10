/**
 * 团队管理布局
 * 作者: 阿瑞
 * 功能: 提供团队管理页面的基础布局，包括侧边栏和主内容区域
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { TeamProvider, useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { 
  MdPeople, MdCategory, MdBrush, MdLocalShipping, MdInventory, 
  MdStorefront, MdPayment, MdReceiptLong, MdOutlineSupportAgent, 
  MdLocalOffer, MdDashboard, MdSwapHoriz, MdExpandMore, MdExpandLess,
  MdShoppingCart, MdStore, MdAttachMoney, MdSell
} from 'react-icons/md';

/**
 * 二级菜单项类型
 */
interface SubMenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * 主菜单项类型
 */
interface MenuItem {
  name: string;
  path?: string; // 可选，如果是分组则没有路径
  icon: React.ReactNode;
  subMenuItems?: SubMenuItem[]; // 子菜单项，如果存在则为分组
}

/**
 * 侧边栏组件
 */
const Sidebar: React.FC = () => {
  const { currentTeam } = useTeam();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const teamCode = params?.teamCode as string;
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 如果没有团队Code，不渲染侧边栏
  if (!teamCode) return null;

  // 菜单项配置
  const getMenuItems = useMemo((): MenuItem[] => [
    { 
      name: '概览仪表盘', 
      path: `/team/${teamCode}`, 
      icon: <MdDashboard className="text-xl" /> 
    },
    { 
      name: '产品工作台', 
      icon: <MdShoppingCart className="text-xl" />,
      subMenuItems: [
        { name: '品牌管理', path: `/team/${teamCode}/brands`, icon: <MdBrush className="text-xl" /> },
        { name: '品类管理', path: `/team/${teamCode}/categories`, icon: <MdCategory className="text-xl" /> },
        { name: '供应商管理', path: `/team/${teamCode}/suppliers`, icon: <MdLocalShipping className="text-xl" /> },
        { name: '产品管理', path: `/team/${teamCode}/products`, icon: <MdInventory className="text-xl" /> },
      ]
    },
    { 
      name: '店铺工作台', 
      icon: <MdStore className="text-xl" />,
      subMenuItems: [
        { name: '店铺管理', path: `/team/${teamCode}/shops`, icon: <MdStorefront className="text-xl" /> },
        { name: '客户管理', path: `/team/${teamCode}/customers`, icon: <MdPeople className="text-xl" /> },
        { name: '店铺粉丝增长', path: `/team/${teamCode}/shop-follower-growth`, icon: <MdPeople className="text-xl" /> },
        { name: '店铺引流消费', path: `/team/${teamCode}/shop-traffic-expenses`, icon: <MdLocalOffer className="text-xl" /> },
      ]
    },
    { 
      name: '财务工作台', 
      icon: <MdAttachMoney className="text-xl" />,
      subMenuItems: [
        { name: '支付平台管理', path: `/team/${teamCode}/payment-platforms`, icon: <MdPayment className="text-xl" /> },
      ]
    },
    { 
      name: '销售工作台', 
      icon: <MdSell className="text-xl" />,
      subMenuItems: [
        { name: '销售登记', path: `/team/${teamCode}/sales`, icon: <MdReceiptLong className="text-xl" /> },
        { name: '销售列表', path: `/team/${teamCode}/sales-records`, icon: <MdReceiptLong className="text-xl" /> },
        { name: '售后列表', path: `/team/${teamCode}/after-sales`, icon: <MdOutlineSupportAgent className="text-xl" /> },
      ]
    },
    { 
      name: '物流管理', 
      path: `/team/${teamCode}/logistics`, 
      icon: <MdLocalOffer className="text-xl" /> 
    },
  ], [teamCode]);

  /**
   * 判断菜单项是否处于活动状态
   */
  const isActive = (itemPath: string) => {
    // 精确匹配路径
    if (pathname === itemPath) return true;

    // 对于首页（仪表盘）特殊处理
    if (itemPath === `/team/${teamCode}` && pathname === `/team/${teamCode}`) return true;

    // 子页面匹配（处理子路由），但防止路径前缀冲突
    // 对于具有相似前缀的菜单项，需要确保完全匹配或子路径匹配
    if (itemPath !== `/team/${teamCode}` && pathname?.startsWith(itemPath)) {
      // 确保匹配的是完整路径段，避免像/sales和/sales-records这样的前缀干扰
      const nextChar = pathname.charAt(itemPath.length);
      // 如果下一个字符是/或为空，则视为匹配（子路由）
      // 否则可能是另一个以相同前缀开始的路由（如sales-records）
      return nextChar === '/' || nextChar === '';
    }

    return false;
  };

  /**
   * 检查某个菜单组是否包含活动菜单项
   */
  const groupHasActiveItem = (subItems: SubMenuItem[]) => {
    return subItems.some(item => isActive(item.path));
  };

  // 计算初始菜单展开状态，只有包含当前活动页面的菜单展开
  const getInitialExpandedState = () => {
    const initialState: Record<string, boolean> = {};
    
    // 默认所有菜单组折叠
    getMenuItems.forEach(item => {
      if (item.subMenuItems) {
        initialState[item.name] = false;
      }
    });
    
    // 只展开包含当前活动页面的菜单组
    getMenuItems.forEach(item => {
      if (item.subMenuItems && item.subMenuItems.some(subItem => isActive(subItem.path))) {
        initialState[item.name] = true;
      }
    });
    
    return initialState;
  };

  // 初始化展开状态
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    getInitialExpandedState()
  );
  
  // 当路径变化时自动更新展开状态
  useEffect(() => {
    setExpandedGroups(getInitialExpandedState());
  }, [pathname]);

  /**
   * 切换到工作空间
   */
  const handleSwitchWorkspace = () => {
    router.push('/workspace');
  };

  /**
   * 切换菜单组的展开/折叠状态
   */
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  /**
   * 处理菜单项点击
   */
  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  const menuItems = getMenuItems;

  return (
    <aside className={`w-64 h-screen overflow-y-auto fixed left-0 top-0 z-10 ${isDarkMode ? 'glass-card-dark' : 'glass-card'} border-r ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h1 className={`text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentTeam?.name || '加载中...'}
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>团队管理系统</p>
      </div>

      <nav className="mt-5 px-3">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              {/* 单菜单项 */}
              {!item.subMenuItems && item.path && (
                <button
                  onClick={() => handleMenuClick(item.path!)}
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
              )}

              {/* 菜单组 */}
              {item.subMenuItems && (
                <>
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200
                      ${groupHasActiveItem(item.subMenuItems) 
                        ? `${isDarkMode 
                          ? 'bg-white/5 text-white font-medium' 
                          : 'bg-gray-100 text-gray-800 font-medium'}`
                        : `${isDarkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-100'}`}
                    `}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </div>
                    <span>
                      {expandedGroups[item.name] ? <MdExpandLess /> : <MdExpandMore />}
                    </span>
                  </button>

                  {/* 子菜单 */}
                  {expandedGroups[item.name] && (
                    <ul className="mt-1 ml-7 space-y-1">
                      {item.subMenuItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <button
                            onClick={() => handleMenuClick(subItem.path)}
                            className={`
                              w-full flex items-center px-4 py-2.5 text-sm rounded-lg transition-all duration-200
                              ${isActive(subItem.path)
                                ? `${isDarkMode
                                  ? 'bg-white/10 text-white border-l-4 border-blue-500'
                                  : 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-500 font-medium'
                                }`
                                : `${isDarkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'}`}
                            `}
                          >
                            <span className="mr-3 text-lg opacity-75">{subItem.icon}</span>
                            {subItem.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
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
  const { currentTeam, isLoading, error } = useTeam();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;

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