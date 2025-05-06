/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果通知提醒组件
 * @版本: 1.0.1
 */

'use client';

import React, { useState, useEffect, useCallback, forwardRef, createContext, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { Icon } from '@iconify/react';

/**
 * 通知类型定义
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * 通知位置定义
 */
export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center'
  | 'bottom-center';

/**
 * 通知动画类型定义
 */
export type NotificationAnimation = 'slide' | 'fade' | 'zoom' | 'bounce';

/**
 * 通知属性接口
 */
export interface NotificationProps {
  id?: string;
  title?: React.ReactNode;
  message: React.ReactNode;
  type?: NotificationType;
  duration?: number;
  position?: NotificationPosition;
  showIcon?: boolean;
  showClose?: boolean;
  animation?: NotificationAnimation;
  onClose?: () => void;
  autoClose?: boolean;
  className?: string;
  style?: React.CSSProperties;
  glassEffect?: boolean;
  actions?: React.ReactNode;
  bordered?: boolean;
  hasProgress?: boolean;
}

/**
 * 动画样式接口
 */
interface AnimationStyleEntry {
  enter: string | Record<NotificationPosition, string>;
  active: string | Record<NotificationPosition, string>;
}

/**
 * 通知上下文接口
 */
interface NotificationContextProps {
  notifications: Array<NotificationProps & { id: string }>;
  addNotification: (notification: NotificationProps) => string;
  removeNotification: (id: string) => void;
}

/**
 * 创建通知上下文
 */
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

/**
 * 毛玻璃效果通知提醒组件
 * 支持多种类型、位置和动画效果
 */
const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      id,
      title,
      message,
      type = 'info',
      duration = 4000,
      position = 'top-right',
      showIcon = true,
      showClose = true,
      animation = 'slide',
      onClose,
      autoClose = true,
      className = '',
      style,
      glassEffect = true,
      actions,
      bordered = true,
      hasProgress = true,
    },
    ref
  ) => {
    // 使用全局主题状态
    const themeMode = useThemeMode();
    const isDarkMode = themeMode === ThemeMode.Dark;
    
    // 控制通知显示状态
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [remainingTime, setRemainingTime] = useState(duration);
    
    /**
     * 通知类型图标映射
     */
    const typeIcons: Record<NotificationType, string> = {
      success: 'lucide:check-circle',
      error: 'lucide:x-circle',
      warning: 'lucide:alert-triangle',
      info: 'lucide:info',
    };
    
    /**
     * 通知类型颜色映射
     */
    const typeColors: Record<NotificationType, string> = {
      success: 'text-green-500 bg-green-500/20',
      error: 'text-red-500 bg-red-500/20',
      warning: 'text-amber-500 bg-amber-500/20',
      info: 'text-blue-500 bg-blue-500/20',
    };
    
    /**
     * 通知位置样式映射
     */
    const positionStyles: Record<NotificationPosition, string> = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };
    
    /**
     * 通知动画样式映射
     */
    const animationStyles: Record<NotificationAnimation, AnimationStyleEntry> = {
      slide: {
        enter: {
          'top-right': 'translate-x-full',
          'top-left': '-translate-x-full',
          'bottom-right': 'translate-x-full',
          'bottom-left': '-translate-x-full',
          'top-center': '-translate-y-full opacity-0',
          'bottom-center': 'translate-y-full opacity-0',
        },
        active: {
          'top-right': 'translate-x-0',
          'top-left': 'translate-x-0',
          'bottom-right': 'translate-x-0',
          'bottom-left': 'translate-x-0',
          'top-center': 'translate-y-0 opacity-100',
          'bottom-center': 'translate-y-0 opacity-100',
        },
      },
      fade: {
        enter: 'opacity-0',
        active: 'opacity-100',
      },
      zoom: {
        enter: 'opacity-0 scale-95',
        active: 'opacity-100 scale-100',
      },
      bounce: {
        enter: 'opacity-0 scale-95',
        active: 'opacity-100 scale-100 animate-bounce-in',
      },
    };
    
    // 处理关闭通知
    const handleClose = useCallback(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // 等待退出动画完成
    }, [onClose]);
    
    // 处理自动关闭通知
    useEffect(() => {
      if (!autoClose || isPaused) return;
      
      let startTime = Date.now();
      let timeLeft = remainingTime;
      
      const timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        timeLeft -= elapsedTime;
        startTime = Date.now();
        
        setRemainingTime(timeLeft > 0 ? timeLeft : 0);
        
        if (timeLeft <= 0) {
          clearInterval(timer);
          handleClose();
        }
      }, 100);
      
      return () => clearInterval(timer);
    }, [autoClose, handleClose, isPaused, remainingTime]);
    
    // 进度条宽度百分比
    const progressWidth = `${(remainingTime / duration) * 100}%`;
    
    // 获取毛玻璃效果类名
    const getGlassClassName = () => {
      if (!glassEffect) return '';
      return isDarkMode ? 'glass-card-dark' : 'glass-card';
    };
    
    // 获取动画类名
    const getAnimationClassName = () => {
      const currentAnimation = animationStyles[animation];
      
      if (typeof currentAnimation.enter === 'object') {
        const enterPositions = currentAnimation.enter as Record<NotificationPosition, string>;
        const activePositions = currentAnimation.active as Record<NotificationPosition, string>;
        
        const enterClass = enterPositions[position] || enterPositions['top-right'];
        const activeClass = activePositions[position] || activePositions['top-right'];
        
        return `transform transition-all duration-300 ${isVisible ? activeClass : enterClass}`;
      }
      
      return `transform transition-all duration-300 ${isVisible ? currentAnimation.active : currentAnimation.enter}`;
    };
    
    // 客户端检查
    if (typeof window === 'undefined') return null;
    
    return createPortal(
      <div
        ref={ref}
        id={id}
        className={`
          fixed z-50 ${positionStyles[position]}
          ${getAnimationClassName()}
          ${className}
        `}
        style={{
          maxWidth: '420px',
          minWidth: '320px',
          ...style,
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="alert"
      >
        <div
          className={`
            ${getGlassClassName()}
            ${bordered ? 'border border-white/20 dark:border-white/10' : ''}
            overflow-hidden
            shadow-lg
            rounded-xl
          `}
        >
          {/* 进度条 */}
          {hasProgress && autoClose && (
            <div className="h-1 w-full bg-gray-200 dark:bg-gray-800/50">
              <div
                className={`h-1 ${type === 'info' ? 'bg-blue-500' : `bg-${type}-500`}`}
                style={{ width: progressWidth, transition: 'width 100ms linear' }}
              ></div>
            </div>
          )}
          
          <div className="flex items-start p-4">
            {/* 类型图标 */}
            {showIcon && (
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${typeColors[type]} flex items-center justify-center mr-4`}>
                <Icon icon={typeIcons[type]} className="w-5 h-5" />
              </div>
            )}
            
            {/* 通知内容 */}
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {title}
                </h3>
              )}
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {message}
              </div>
              
              {/* 操作按钮 */}
              {actions && (
                <div className="mt-3 flex space-x-3">
                  {actions}
                </div>
              )}
            </div>
            
            {/* 关闭按钮 */}
            {showClose && (
              <button
                type="button"
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                onClick={handleClose}
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
  }
);

Notification.displayName = 'Notification';

/**
 * 通知提供者属性接口
 */
export interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

/**
 * 通知提供者组件
 * 管理所有通知状态并提供通知操作方法
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children,
  maxNotifications = 10
}) => {
  // 存储所有通知
  const [notifications, setNotifications] = useState<Array<NotificationProps & { id: string }>>([]);

  // 添加通知方法
  const addNotification = useCallback((notification: NotificationProps) => {
    const id = notification.id || Math.random().toString(36).substring(2, 9);
    
    setNotifications(prev => {
      // 添加新通知并移除超出最大数量的旧通知
      const newNotifications = [...prev, { ...notification, id }];
      return newNotifications.slice(-maxNotifications);
    });
    
    return id;
  }, [maxNotifications]);

  // 移除通知方法
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // 构建上下文值
  const contextValue = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification
  }), [notifications, addNotification, removeNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * 使用通知上下文的Hook
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification必须在NotificationProvider内使用');
  }
  
  return {
    // 创建不同类型的通知的方法
    success: (message: React.ReactNode, options?: Partial<NotificationProps>) => 
      context.addNotification({ message, type: 'success', ...options }),
    error: (message: React.ReactNode, options?: Partial<NotificationProps>) => 
      context.addNotification({ message, type: 'error', ...options }),
    warning: (message: React.ReactNode, options?: Partial<NotificationProps>) => 
      context.addNotification({ message, type: 'warning', ...options }),
    info: (message: React.ReactNode, options?: Partial<NotificationProps>) => 
      context.addNotification({ message, type: 'info', ...options }),
    // 移除通知
    remove: context.removeNotification,
  };
};

/**
 * 通知容器组件
 * 用于渲染多个通知
 */
export const NotificationContainer: React.FC<{ position?: NotificationPosition }> = ({ 
  position = 'top-right' 
}) => {
  const context = useContext(NotificationContext);
  
  // 如果没有上下文或不在客户端，则不渲染
  if (!context || typeof window === 'undefined') return null;
  
  // 获取当前位置的通知
  const positionNotifications = context.notifications.filter(
    notification => (notification.position || 'top-right') === position
  );
  
  // 如果没有通知，不渲染
  if (positionNotifications.length === 0) return null;

  return createPortal(
    <div className={`fixed z-50 ${position} space-y-4 p-4`}>
      {positionNotifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => context.removeNotification(notification.id)}
        />
      ))}
    </div>,
    document.body
  );
};

/**
 * 用于直接调用的通知方法
 * 注意：必须确保在NotificationProvider内使用
 */
export const notify = {
  success: (message: React.ReactNode, options?: Partial<NotificationProps>) => {
    try {
      return useNotification().success(message, options);
    } catch (e) {
      console.error('无法创建通知，确保在NotificationProvider内调用', e);
      return '';
    }
  },
  error: (message: React.ReactNode, options?: Partial<NotificationProps>) => {
    try {
      return useNotification().error(message, options);
    } catch (e) {
      console.error('无法创建通知，确保在NotificationProvider内调用', e);
      return '';
    }
  },
  warning: (message: React.ReactNode, options?: Partial<NotificationProps>) => {
    try {
      return useNotification().warning(message, options);
    } catch (e) {
      console.error('无法创建通知，确保在NotificationProvider内调用', e);
      return '';
    }
  },
  info: (message: React.ReactNode, options?: Partial<NotificationProps>) => {
    try {
      return useNotification().info(message, options);
    } catch (e) {
      console.error('无法创建通知，确保在NotificationProvider内调用', e);
      return '';
    }
  },
};

export default Notification; 