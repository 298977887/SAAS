/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果头像组件
 * @版本: 1.0.0
 */

import React from 'react';
import Image from 'next/image';

/**
 * 头像尺寸类型定义
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 头像形状类型定义
 */
export type AvatarShape = 'circle' | 'square' | 'rounded';

/**
 * 状态类型定义
 */
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | 'none';

/**
 * 头像组件属性接口
 */
export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: AvatarStatus;
  statusPosition?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  className?: string;
  isGlass?: boolean;
  bordered?: boolean;
  onClick?: () => void;
}

/**
 * 毛玻璃效果头像组件
 * 支持图片头像、文字头像和在线状态指示
 */
const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  shape = 'circle',
  status = 'none',
  statusPosition = 'bottom-right',
  className = '',
  isGlass = true,
  bordered = false,
  onClick,
}: AvatarProps) => {
  // 获取名称首字母作为头像显示文本
  const getInitials = () => {
    if (!name) return '';
    
    const nameParts = name.split(' ').filter(part => part.length > 0);
    if (nameParts.length === 0) return '';
    
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };
  
  // 生成随机背景色（基于名称）
  const getColorFromName = () => {
    if (!name) return 'bg-blue-500';
    
    // 使用简单的哈希算法为名称生成一个稳定的颜色
    const colors = [
      'bg-blue-500/70',
      'bg-purple-500/70',
      'bg-green-500/70',
      'bg-red-500/70',
      'bg-amber-500/70',
      'bg-cyan-500/70',
      'bg-pink-500/70',
      'bg-indigo-500/70',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // 尺寸样式映射
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };
  
  // 形状样式映射
  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };
  
  // 状态颜色映射
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
    none: 'hidden',
  };
  
  // 状态位置映射
  const statusPositions = {
    'top-right': 'top-0 right-0 -translate-y-1/4 translate-x-1/4',
    'bottom-right': 'bottom-0 right-0 translate-y-1/4 translate-x-1/4',
    'bottom-left': 'bottom-0 left-0 translate-y-1/4 -translate-x-1/4',
    'top-left': 'top-0 left-0 -translate-y-1/4 -translate-x-1/4',
  };
  
  // 状态指示器尺寸
  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  };
  
  // 毛玻璃效果
  const glassEffect = isGlass ? 'backdrop-blur-md' : '';
  
  // 边框样式
  const borderStyle = bordered ? 'border-2 border-white/30 dark:border-gray-800/30' : '';
  
  // 点击样式
  const clickStyle = onClick ? 'cursor-pointer hover:opacity-90 active:opacity-100 active:scale-95 transition-all duration-200' : '';
  
  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${sizeStyles[size]}
        ${shapeStyles[shape]}
        ${glassEffect}
        ${borderStyle}
        ${clickStyle}
        overflow-hidden
        transition-all duration-300
        ${className}
      `}
      onClick={onClick}
    >
      {src ? (
        // 图片头像
        <Image
          src={src}
          alt={alt || name}
          fill
          sizes={`(max-width: 768px) 100vw, ${parseInt(sizeStyles[size].split('w-')[1]) * 4}px`}
          className="object-cover"
          unoptimized // 添加 unoptimized 属性以允许外部图片源
        />
      ) : (
        // 文字头像
        <div className={`flex items-center justify-center w-full h-full ${getColorFromName()} text-white font-medium`}>
          {getInitials()}
        </div>
      )}
      
      {/* 状态指示器 */}
      {status !== 'none' && (
        <span className={`
          absolute
          ${statusPositions[statusPosition]}
          ${statusSizes[size]}
          ${statusColors[status]}
          rounded-full
          border border-white dark:border-gray-800
          shadow-sm
          z-10
        `}></span>
      )}
    </div>
  );
};

export default Avatar;