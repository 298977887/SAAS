/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果卡片组件
 * @版本: 1.2.0
 */

import React from 'react';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';

/**
 * 卡片属性接口定义
 */
export interface CardProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  hoverEffect?: boolean;
  footer?: React.ReactNode;
  headerRightContent?: React.ReactNode;
  glassEffect?: 'none' | 'light' | 'medium' | 'heavy';
  padding?: 'none' | 'small' | 'medium' | 'large';
  bordered?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  onClick?: () => void;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullWidth?: boolean;
  maxWidth?: string;
}

/**
 * 毛玻璃效果卡片组件
 * 支持标题、副标题、自定义页脚和不同的毛玻璃效果级别
 */
const Card = ({
  children,
  title,
  subtitle,
  className = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  hoverEffect = true,
  footer,
  headerRightContent,
  glassEffect = 'medium',
  padding = 'medium',
  bordered = true,
  isLoading = false,
  loadingText = '加载中...',
  onClick,
  elevation = 'md',
  rounded = 'lg',
  fullWidth = true,
  maxWidth,
}: CardProps) => {
  // 使用全局主题状态
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 不同内边距的样式
  const paddingStyles = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-5',
    large: 'p-7',
  };

  // 毛玻璃效果 - 仅应用在glassEffect为none的情况
  const customGlassStyles = {
    none: '',
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-xl',
  };
    
  // 阴影样式（只在非玻璃效果或自定义时使用）
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  // 圆角样式
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-3xl',
  };
  
  // 宽度样式
  const widthStyles = fullWidth ? 'w-full' : '';
  const maxWidthStyle = maxWidth ? { maxWidth } : {};
  
  // 点击样式
  const clickableStyles = onClick ? 'cursor-pointer active:scale-[0.99]' : '';
  
  // 决定是否使用全局CSS的毛玻璃卡片样式
  const useGlobalGlassStyle = glassEffect !== 'none';
  
  // 获取主体类名
  const getCardClassName = () => {
    if (useGlobalGlassStyle) {
      return `${isDarkMode ? 'glass-card-dark' : 'glass-card'} ${!hoverEffect ? '!transform-none' : ''}`;
    } else {
      return `
        ${customGlassStyles[glassEffect]}
        ${bordered ? 'border border-white/20 dark:border-white/10' : ''}
        ${hoverEffect ? 'hover:shadow-xl hover:-translate-y-1 hover:bg-white/40 dark:hover:bg-slate-900/50' : ''}
        ${shadowStyles[elevation]}
        transition-all duration-300
      `;
    }
  };

  return (
    <div
      className={`
        ${getCardClassName()}
        ${roundedStyles[rounded]}
        ${widthStyles}
        ${clickableStyles}
        overflow-hidden
        ${className}
      `}
      onClick={onClick}
      style={maxWidthStyle}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* 卡片头部 */}
      {(title || subtitle || headerRightContent) && (
        <div className={`${padding === 'none' ? 'p-5' : paddingStyles[padding]} border-b border-white/10 flex justify-between items-start ${headerClassName}`}>
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">{title}</h3>
            ) : title}
            {typeof subtitle === 'string' ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            ) : subtitle}
          </div>
          {headerRightContent && (
            <div className="ml-4">{headerRightContent}</div>
          )}
        </div>
      )}

      {/* 卡片内容 */}
      <div className={`${paddingStyles[padding]} ${contentClassName} relative`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500/50 border-t-blue-500 rounded-full mb-3"></div>
            {loadingText && <p className="text-sm text-gray-500 dark:text-gray-400">{loadingText}</p>}
          </div>
        ) : children}
      </div>

      {/* 卡片页脚 */}
      {footer && (
        <div className={`${padding === 'none' ? 'p-5' : paddingStyles[padding]} border-t border-white/10 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 