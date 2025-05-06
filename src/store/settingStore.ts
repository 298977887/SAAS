/**
 * @作者 阿瑞
 * @功能 系统设置状态管理，包括主题模式等配置
 * @版本 1.3.0
 */

import { create } from 'zustand';
import { StorageEnum, ThemeMode } from '@/types/enum';

/* 本地存储操作工具函数 */
export const getItem = <T>(key: StorageEnum): T | null => {
  if (typeof window === 'undefined') return null;
  
  let value = null;
  try {
    const result = window.localStorage.getItem(key);
    if (result) {
      value = JSON.parse(result);
    }
  } catch (error) {
    console.error('获取本地存储失败:', error);
  }
  return value;
};

export const setItem = <T>(key: StorageEnum, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('保存到本地存储失败:', error);
  }
};

export const removeItem = (key: StorageEnum): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('从本地存储删除失败:', error);
  }
};

export const clearItems = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.clear();
  } catch (error) {
    console.error('清除本地存储失败:', error);
  }
};

/* 设置状态类型定义 */
type SettingsType = {
  themeMode: ThemeMode;
};

type SettingStore = {
  settings: SettingsType;
  // 使用 actions 命名空间存放所有操作方法
  actions: {
    setSettings: (settings: Partial<SettingsType>) => void;
    setThemeMode: (themeMode: ThemeMode) => void;
    toggleThemeMode: () => void;
    clearSettings: () => void;
  };
};

/* 初始化设置 */
// 尝试从 localStorage 获取设置，如果没有则使用默认的深色主题
const initialSettings = { themeMode: ThemeMode.Dark };

/**
 * 获取初始主题设置
 * 在创建 store 时调用，从本地存储读取主题设置
 */
function getInitialSettings(): SettingsType {
  if (typeof window !== 'undefined') {
    try {
      const storedSettings = getItem<SettingsType>(StorageEnum.Settings);
      if (storedSettings && storedSettings.themeMode) {
        return storedSettings;
      }
    } catch (error) {
      console.error('读取主题设置失败:', error);
    }
  }
  return initialSettings;
}

/**
 * 应用主题到DOM
 * @param themeMode 主题模式
 */
const applyThemeToDOM = (themeMode: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  
  // 强制移除所有主题相关类名，然后添加当前主题类名
  document.body.classList.remove('dark-theme', 'light-theme');
  document.body.classList.add(themeMode === ThemeMode.Dark ? 'dark-theme' : 'light-theme');
  
  // 为移动设备设置meta主题色
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      themeMode === ThemeMode.Dark ? '#0a1128' : '#f6f9fc'
    );
  }
  
  console.log('应用主题:', themeMode);
};

/* 创建设置状态管理器 */
const useSettingStore = create<SettingStore>((set, get) => ({
  // 初始化设置
  settings: getInitialSettings(),
  
  actions: {
    // 更新设置
    setSettings: (newSettings) => {
      const currentSettings = get().settings;
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      set({ settings: updatedSettings });
      setItem(StorageEnum.Settings, updatedSettings);
      
      // 检查是否包含主题设置，如果有则应用
      if (newSettings.themeMode !== undefined && 
          newSettings.themeMode !== currentSettings.themeMode) {
        applyThemeToDOM(newSettings.themeMode);
      }
    },
    
    // 设置主题模式
    setThemeMode: (themeMode) => {
      const currentSettings = get().settings;
      
      // 如果主题没有变化，则不进行操作
      if (currentSettings.themeMode === themeMode) return;
      
      const updatedSettings = { ...currentSettings, themeMode };
      
      set({ settings: updatedSettings });
      setItem(StorageEnum.Settings, updatedSettings);
      
      // 应用主题到文档
      applyThemeToDOM(themeMode);
    },
    
    // 切换主题模式
    toggleThemeMode: () => {
      const currentTheme = get().settings.themeMode;
      const newTheme = currentTheme === ThemeMode.Light ? ThemeMode.Dark : ThemeMode.Light;
      
      console.log('切换主题:', currentTheme, '->', newTheme);
      get().actions.setThemeMode(newTheme);
    },
    
    // 清除设置
    clearSettings: () => {
      const defaultSettings = { themeMode: ThemeMode.Dark };
      set({ settings: defaultSettings });
      removeItem(StorageEnum.Settings);
      applyThemeToDOM(defaultSettings.themeMode);
    },
  },
}));

/* 导出便捷的Hook */
export const useSettings = () => useSettingStore((state) => state.settings);
export const useSettingActions = () => useSettingStore((state) => state.actions);
export const useThemeMode = () => useSettingStore((state) => state.settings.themeMode);

export default useSettingStore;
