/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果进度条组件
 * @版本: 1.0.1
 */

import React from 'react';

/** 
 * 进度条变体类型定义
 */
export type ProgressVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

/** 
 * 进度条尺寸类型定义
 */
export type ProgressSize = 'sm' | 'md' | 'lg';

/** 
 * 进度条形状类型定义
 */
export type ProgressShape = 'rounded' | 'square' | 'pill';

/**
 * 标签位置类型定义
 */
export type LabelPosition = 'top' | 'right' | 'bottom' | 'left' | 'inside';

/** 
 * 进度条属性接口
 */
export interface ProgressProps {
  /** 进度值，范围 0-100 */
  value: number;
  /** 最大进度值 */
  max?: number;
  /** 进度条变体 */
  variant?: ProgressVariant;
  /** 进度条尺寸 */
  size?: ProgressSize;
  /** 进度条形状 */
  shape?: ProgressShape;
  /** 是否显示进度文本 */
  showText?: boolean;
  /** 标签位置 */
  labelPosition?: LabelPosition;
  /** 是否启用玻璃效果 */
  isGlass?: boolean;
  /** 是否显示条纹效果 */
  striped?: boolean;
  /** 是否显示动画效果 */
  animated?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
  /** 自定义格式化进度文本 */
  formatText?: (value: number, max: number) => string;
  /** 渐变色起始颜色 */
  gradientFrom?: string;
  /** 渐变色结束颜色 */
  gradientTo?: string;
  /** 自定义颜色 */
  color?: string;
  /** 自定义背景颜色 */
  backgroundColor?: string;
  /** 额外标签内容 */
  label?: React.ReactNode;
}

/**
 * 毛玻璃效果进度条组件
 * 支持不同变体、尺寸和形状
 */
const Progress = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  showText = false,
  labelPosition = 'top',
  isGlass = true,
  striped = false,
  animated = false,
  className = '',
  formatText,
  gradientFrom,
  gradientTo,
  color,
  backgroundColor,
  label
}: ProgressProps) => {
  // 确保进度值在有效范围内
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;
  
  // 变体样式映射
  const variantStyles = {
    primary: 'bg-blue-500/80',
    secondary: 'bg-gray-500/60',
    success: 'bg-green-500/70',
    danger: 'bg-red-500/70',
    warning: 'bg-amber-500/70',
    info: 'bg-cyan-500/70',
  };
  
  // 渐变或自定义颜色样式
  const colorStyle = color ? { backgroundColor: color } : 
    (gradientFrom && gradientTo ? 
      { backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` } : 
      {});
  
  // 自定义背景颜色
  const backgroundColorStyle = backgroundColor ? { backgroundColor } : {};
  
  // 尺寸样式映射
  const sizeStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };
  
  // 形状样式映射
  const shapeStyles = {
    rounded: 'rounded-md',
    square: 'rounded-none',
    pill: 'rounded-full',
  };
  
  // 玻璃态效果样式
  const glassEffect = isGlass ? 'backdrop-blur-sm border border-white/10' : '';
  
  // 条纹效果
  const stripedEffect = striped ? 'bg-stripes' : '';
  
  // 动画效果
  const animationEffect = animated ? 'animate-progress' : '';
  
  // 格式化进度文本
  const displayText = formatText 
    ? formatText(normalizedValue, max) 
    : `${Math.round(percentage)}%`;

  // 内部标签样式
  const insideLabelStyles = size === 'lg' && labelPosition === 'inside' 
    ? 'flex items-center justify-center h-full text-xs font-medium text-white' 
    : '';

  return (
    <div className="w-full">
      {/* 顶部标签 */}
      {(showText || label) && labelPosition === 'top' && (
        <div className="flex justify-between items-center mb-1">
          {label && <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>}
          {showText && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {displayText}
            </div>
          )}
        </div>
      )}
      
      {/* 左侧标签 */}
      {(showText || label) && labelPosition === 'left' && (
        <div className="flex items-center gap-2 mb-1">
          {label && <div className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-20">{label}</div>}
          {showText && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-10">
              {displayText}
            </div>
          )}
        </div>
      )}
      
      {/* 进度条容器和右侧标签 */}
      <div className="flex items-center gap-3">
        <div 
          className={`
            w-full overflow-hidden bg-gray-200/30 dark:bg-gray-700/30
            ${sizeStyles[size]} ${shapeStyles[shape]} ${glassEffect}
            ${className}
          `}
          style={backgroundColorStyle}
        >
          {/* 进度条填充部分 */}
          <div 
            className={`
              ${color ? '' : variantStyles[variant]} 
              ${stripedEffect} 
              ${animationEffect}
              ${shapeStyles[shape]}
              h-full transition-all duration-300 ease-in-out
            `}
            style={{ 
              width: `${percentage}%`,
              ...colorStyle 
            }}
          >
            {/* 内部标签 */}
            {showText && labelPosition === 'inside' && (
              <div className={insideLabelStyles}>
                {percentage > 5 && displayText}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧标签 */}
        {(showText || label) && labelPosition === 'right' && (
          <div className="flex items-center">
            {showText && (
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-10">
                {displayText}
              </div>
            )}
            {label && <div className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">{label}</div>}
          </div>
        )}
      </div>
      
      {/* 底部标签 */}
      {(showText || label) && labelPosition === 'bottom' && (
        <div className="flex justify-between items-center mt-1">
          {label && <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>}
          {showText && (
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {displayText}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* 添加条纹效果的CSS样式 */
// 注意：实际使用时，需要在全局样式中添加以下类
// .bg-stripes {
//   background-image: linear-gradient(
//     45deg,
//     rgba(255, 255, 255, 0.15) 25%,
//     transparent 25%,
//     transparent 50%,
//     rgba(255, 255, 255, 0.15) 50%,
//     rgba(255, 255, 255, 0.15) 75%,
//     transparent 75%,
//     transparent
//   );
//   background-size: 1rem 1rem;
// }
// 
// @keyframes progress {
//   0% {
//     background-position: 1rem 0;
//   }
//   100% {
//     background-position: 0 0;
//   }
// }
// 
// .animate-progress {
//   animation: progress 1s linear infinite;
// }

export default Progress; 