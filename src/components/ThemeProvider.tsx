/**
 * @作者 阿瑞
 * @功能 主题提供组件，用于初始化和同步主题设置
 * @版本 2.0.0
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSettings, useSettingActions } from '@/store/settingStore';
import { ThemeMode, StorageEnum } from '@/types/enum';

// 常量定义
const DEFAULT_THEME = ThemeMode.Dark;
const THEME_CLASSES = {
  [ThemeMode.Dark]: 'dark-theme',
  [ThemeMode.Light]: 'light-theme',
};

/**
 * 安全获取本地存储中的主题设置
 */
const getThemeFromLocalStorage = (): ThemeMode | null => {
  try {
    const savedSettings = localStorage.getItem(StorageEnum.Settings);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings?.themeMode && Object.values(ThemeMode).includes(settings.themeMode)) {
        return settings.themeMode;
      }
    }
  } catch (error) {
    console.error('读取主题设置失败:', error);
  }
  return null;
};

/**
 * 应用主题到DOM
 */
const applyThemeToDOM = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  
  // 移除所有可能的主题类
  document.body.classList.remove(...Object.values(THEME_CLASSES));
  // 添加当前主题类
  document.body.classList.add(THEME_CLASSES[theme]);
};

/**
 * 主题初始化组件
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeMode } = useSettings();
  const { setThemeMode } = useSettingActions();
  const [isReady, setIsReady] = useState(false);

  // 同步主题状态到存储和其他标签页
  const syncTheme = useCallback((newTheme: ThemeMode) => {
    try {
      // 更新本地存储
      const currentSettings = JSON.parse(localStorage.getItem(StorageEnum.Settings) || '{}');
      const updatedSettings = { ...currentSettings, themeMode: newTheme };
      localStorage.setItem(StorageEnum.Settings, JSON.stringify(updatedSettings));
      
      // 应用主题到DOM
      applyThemeToDOM(newTheme);
    } catch (error) {
      console.error('同步主题设置失败:', error);
    }
  }, []);

  // 处理存储变化事件
  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === StorageEnum.Settings) {
      try {
        const newSettings = e.newValue ? JSON.parse(e.newValue) : null;
        if (newSettings?.themeMode && newSettings.themeMode !== themeMode) {
          setThemeMode(newSettings.themeMode);
        }
      } catch (error) {
        console.error('解析设置数据失败:', error);
      }
    }
  }, [themeMode, setThemeMode]);

  // 初始化主题
  useEffect(() => {
    // 获取初始主题
    const initialTheme = getThemeFromLocalStorage() || DEFAULT_THEME;
    
    // 如果与当前状态不同，则更新
    if (initialTheme !== themeMode) {
      setThemeMode(initialTheme);
    } else {
      // 确保DOM与当前状态同步
      applyThemeToDOM(themeMode);
    }
    
    // 设置准备状态
    setIsReady(true);
    
    // 添加存储事件监听
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [setThemeMode, handleStorageChange]);

  // 主题变化时同步到存储和DOM
  useEffect(() => {
    if (isReady) {
      syncTheme(themeMode);
    }
  }, [themeMode, isReady, syncTheme]);

  // 在准备就绪前不渲染子组件
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}