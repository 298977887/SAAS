/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果徽章组件
 * @版本: 1.0.0
 */

import React from 'react';

/**
 * 徽章变体类型定义
 */
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

/**
 * 徽章尺寸类型定义
 */
export type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * 徽章属性接口
 */
export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  isGlass?: boolean;
  pill?: boolean;
  dot?: boolean;
  bordered?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * 毛玻璃效果徽章组件
 * 支持不同变体、尺寸和形状
 */
const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isGlass = true,
  pill = false,
  dot = false,
  bordered = false,
  className = '',
  onClick,
}: BadgeProps) => {
  // 变体样式映射
  const variantStyles = {
    primary: {
      bg: 'bg-blue-500/70',
      border: 'border-blue-500/50',
      text: 'text-white',
      dot: 'bg-blue-500',
    },
    secondary: {
      bg: 'bg-gray-500/70',
      border: 'border-gray-500/50',
      text: 'text-white',
      dot: 'bg-gray-500',
    },
    success: {
      bg: 'bg-green-500/70',
      border: 'border-green-500/50',
      text: 'text-white',
      dot: 'bg-green-500',
    },
    danger: {
      bg: 'bg-red-500/70',
      border: 'border-red-500/50',
      text: 'text-white',
      dot: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-500/70',
      border: 'border-amber-500/50',
      text: 'text-white',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-cyan-500/70',
      border: 'border-cyan-500/50',
      text: 'text-white',
      dot: 'bg-cyan-500',
    },
  };

  // 尺寸样式映射
  const sizeStyles = {
    sm: {
      padding: 'px-2 py-0.5',
      text: 'text-xs',
      icon: 'mr-1 text-xs',
      dot: 'w-1.5 h-1.5 mr-1',
    },
    md: {
      padding: 'px-2.5 py-1',
      text: 'text-sm',
      icon: 'mr-1.5 text-sm',
      dot: 'w-2 h-2 mr-1.5',
    },
    lg: {
      padding: 'px-3 py-1.5',
      text: 'text-base',
      icon: 'mr-2 text-base',
      dot: 'w-2.5 h-2.5 mr-2',
    },
  };

  // 形状样式
  const shapeStyle = pill ? 'rounded-full' : 'rounded';

  // 玻璃效果样式
  const glassEffect = isGlass ? 'backdrop-blur-md' : '';

  // 边框样式
  const borderStyle = bordered ? `border ${variantStyles[variant].border}` : '';

  // 可点击样式
  const clickableStyle = onClick
    ? 'cursor-pointer hover:opacity-90 active:opacity-100 active:scale-95'
    : '';

  return (
    <span
      className={`
        ${variantStyles[variant].bg}
        ${variantStyles[variant].text}
        ${sizeStyles[size].padding}
        ${sizeStyles[size].text}
        ${shapeStyle}
        ${glassEffect}
        ${borderStyle}
        ${clickableStyle}
        inline-flex items-center justify-center
        transition-all duration-200
        ${className}
      `}
      onClick={onClick}
    >
      {/* 显示圆点 */}
      {dot && (
        <span
          className={`
            ${variantStyles[variant].dot}
            ${sizeStyles[size].dot}
            rounded-full
          `}
        />
      )}
      
      {/* 显示图标 */}
      {icon && (
        <span className={`${sizeStyles[size].icon} flex items-center`}>
          {icon}
        </span>
      )}
      
      {/* 内容 */}
      {children}
    </span>
  );
};

export default Badge; 