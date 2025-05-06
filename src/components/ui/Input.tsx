/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果输入框组件
 * @版本: 1.0.0
 */

import React, { forwardRef } from 'react';

/**
 * 输入框属性接口
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  isGlass?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * 毛玻璃效果输入框组件
 * 支持标签、错误提示、辅助文本和图标
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  isGlass = true,
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  // 尺寸样式映射
  const sizeStyles = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  // 输入框内边距样式
  const paddingStyles = {
    sm: leftIcon ? 'pl-8 pr-3' : rightIcon ? 'pl-3 pr-8' : 'px-3',
    md: leftIcon ? 'pl-10 pr-4' : rightIcon ? 'pl-4 pr-10' : 'px-4',
    lg: leftIcon ? 'pl-12 pr-5' : rightIcon ? 'pl-5 pr-12' : 'px-5',
  };

  // 图标尺寸和位置样式
  const iconSizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconPositionStyles = {
    left: {
      sm: 'left-3',
      md: 'left-3.5',
      lg: 'left-4',
    },
    right: {
      sm: 'right-3',
      md: 'right-3.5',
      lg: 'right-4',
    },
  };

  // 毛玻璃效果样式
  const glassEffect = isGlass
    ? 'bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-white/20 dark:border-white/10'
    : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-700';

  // 禁用状态样式
  const disabledStyle = disabled 
    ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-slate-700'
    : '';

  // 错误状态样式
  const errorStyle = error 
    ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
    : 'focus:ring-blue-500';

  // 全宽样式
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle}`}>
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      {/* 输入框容器 */}
      <div className="relative">
        {/* 左侧图标 */}
        {leftIcon && (
          <div className={`absolute ${iconPositionStyles.left[size]} top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none`}>
            <div className={iconSizeStyles[size]}>{leftIcon}</div>
          </div>
        )}
        
        {/* 输入框 */}
        <input
          ref={ref}
          className={`
            ${sizeStyles[size]}
            ${paddingStyles[size]}
            ${glassEffect}
            ${disabledStyle}
            ${errorStyle}
            ${widthStyle}
            rounded-lg
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            transition-all duration-200
            ${className}
          `}
          disabled={disabled}
          {...props}
        />
        
        {/* 右侧图标 */}
        {rightIcon && (
          <div className={`absolute ${iconPositionStyles.right[size]} top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400`}>
            <div className={iconSizeStyles[size]}>{rightIcon}</div>
          </div>
        )}
      </div>
      
      {/* 错误提示或辅助文本 */}
      {(error || helperText) && (
        <div className="mt-1">
          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : helperText ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
          ) : null}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 