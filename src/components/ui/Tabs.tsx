/**
 * @作者: 阿瑞
 * @功能: 选项卡组件
 * @版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * 选项卡变体类型定义
 */
export type TabsVariant = 'default' | 'pills' | 'underline' | 'button' | 'glass';

/**
 * 选项卡方向类型定义
 */
export type TabsOrientation = 'horizontal' | 'vertical';

/**
 * 选项卡项接口
 */
export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * 选项卡组件属性接口
 */
export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  isGlass?: boolean;
  glassLevel?: 'light' | 'medium' | 'heavy';
  onChange?: (tabId: string) => void;
  className?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  contentAnimation?: boolean;
}

/**
 * 选项卡组件
 * 支持不同变体、方向和动画效果
 */
const Tabs = ({
  items,
  defaultTab,
  variant = 'default',
  orientation = 'horizontal',
  isGlass = true,
  glassLevel = 'medium',
  onChange,
  className = '',
  tabListClassName = '',
  tabPanelClassName = '',
  activeTabClassName = '',
  inactiveTabClassName = '',
  contentAnimation = true,
}: TabsProps) => {
  // 设置活动选项卡
  const [activeTab, setActiveTab] = useState(defaultTab || (items.length > 0 ? items[0].id : ''));
  
  // 选项卡滑块指示器引用
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  
  // 变体样式映射
  const variantStyles = {
    default: {
      wrapper: '',
      tabList: 'border-b border-gray-200 dark:border-gray-700/30',
      tab: 'py-2 px-4',
      activeTab: 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400',
      inactiveTab: 'border-b-2 border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300',
      indicator: 'hidden',
    },
    pills: {
      wrapper: '',
      tabList: 'space-x-2',
      tab: 'py-2 px-4 rounded-md',
      activeTab: 'bg-blue-500/70 text-white',
      inactiveTab: 'text-gray-700 hover:bg-gray-100/80 dark:text-gray-300 dark:hover:bg-gray-800/40',
      indicator: 'hidden',
    },
    underline: {
      wrapper: 'relative',
      tabList: '',
      tab: 'py-2 px-4',
      activeTab: 'text-blue-600 dark:text-blue-400',
      inactiveTab: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300',
      indicator: 'absolute bottom-0 h-0.5 bg-blue-500 transition-all duration-300',
    },
    button: {
      wrapper: '',
      tabList: 'bg-gray-100 dark:bg-gray-800/40 p-1 rounded-lg',
      tab: 'py-2 px-4 rounded-md',
      activeTab: 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white',
      inactiveTab: 'text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300',
      indicator: 'hidden',
    },
    glass: {
      wrapper: 'relative',
      tabList: 'space-x-1',
      tab: 'py-2 px-4 rounded-md',
      activeTab: 'bg-white/20 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white',
      inactiveTab: 'text-gray-700 hover:bg-white/10 dark:text-gray-300 dark:hover:bg-white/5',
      indicator: 'hidden',
    },
  };
  
  // 方向样式
  const orientationStyles = {
    horizontal: {
      wrapper: 'flex flex-col',
      tabList: orientation === 'horizontal' ? 'flex space-x-1' : '',
      tabPanel: 'w-full',
    },
    vertical: {
      wrapper: 'flex',
      tabList: 'flex flex-col space-y-1 mr-4',
      tabPanel: 'flex-1',
    },
  };
  
  // 毛玻璃效果
  const glassStyles = {
    light: 'bg-white/20 dark:bg-slate-900/30 backdrop-blur-sm',
    medium: 'bg-white/30 dark:bg-slate-900/40 backdrop-blur-md',
    heavy: 'bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl',
  };
  
  const glassEffect = isGlass ? glassStyles[glassLevel] : '';

  // 内容动画
  const contentAnimationStyles = {
    enter: 'opacity-0 translate-y-2',
    enterActive: 'opacity-100 translate-y-0 transition-all duration-300',
  };

  // 设置选项卡引用的处理函数
  const setTabRef = (id: string) => (el: HTMLButtonElement | null) => {
    tabsRef.current[id] = el;
  };
  
  // 更新滑块指示器位置
  useEffect(() => {
    if (variant !== 'underline' || orientation !== 'horizontal') return;
    
    const activeTabElement = tabsRef.current[activeTab];
    const indicator = indicatorRef.current;
    
    if (activeTabElement && indicator) {
      indicator.style.left = `${activeTabElement.offsetLeft}px`;
      indicator.style.width = `${activeTabElement.offsetWidth}px`;
    }
  }, [activeTab, variant, orientation]);
  
  // 处理选项卡切换
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };
  
  // 获取活动内容
  const getActiveContent = () => {
    const activeItem = items.find(item => item.id === activeTab);
    return activeItem?.content;
  };
  
  return (
    <div 
      className={`
        ${orientationStyles[orientation].wrapper}
        ${className}
      `}
    >
      {/* 选项卡列表 */}
      <div 
        className={`
          ${variantStyles[variant].tabList}
          ${orientationStyles[orientation].tabList}
          ${tabListClassName}
          ${variant === 'glass' ? glassEffect : ''}
          relative
        `}
      >
        {items.map(item => (
          <button
            key={item.id}
            ref={setTabRef(item.id)}
            className={`
              ${variantStyles[variant].tab}
              ${activeTab === item.id 
                ? `${variantStyles[variant].activeTab} ${activeTabClassName}`
                : `${variantStyles[variant].inactiveTab} ${inactiveTabClassName}`
              }
              transition-all duration-200
              flex items-center font-medium
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            onClick={() => !item.disabled && handleTabChange(item.id)}
            disabled={item.disabled}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`tab-panel-${item.id}`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
        
        {/* 下划线指示器 */}
        {variant === 'underline' && orientation === 'horizontal' && (
          <div 
            ref={indicatorRef}
            className={variantStyles[variant].indicator}
          ></div>
        )}
      </div>
      
      {/* 选项卡内容 */}
      <div 
        className={`
          ${orientationStyles[orientation].tabPanel}
          ${tabPanelClassName}
          pt-4
        `}
        role="tabpanel"
        id={`tab-panel-${activeTab}`}
      >
        <div 
          className={contentAnimation ? contentAnimationStyles.enterActive : ''}
        >
          {getActiveContent()}
        </div>
      </div>
    </div>
  );
};

export default Tabs; 