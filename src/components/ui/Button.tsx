/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果按钮组件
 * @版本: 1.1.0
 */

import React from 'react';

/** 
 * 按钮变体类型定义
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

/** 
 * 按钮尺寸类型定义
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 按钮形状类型定义
 */
export type ButtonShape = 'rounded' | 'square' | 'pill' | 'circle';

/**
 * 按钮风格类型定义
 */
export type ButtonStyle = 'solid' | 'outline' | 'ghost' | 'link';

/** 
 * 按钮属性接口
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  buttonStyle?: ButtonStyle;
  isLoading?: boolean;
  isGlass?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  active?: boolean;
  elevated?: boolean;
  animation?: boolean;
}

/**
 * 玻璃态按钮组件
 * 支持不同变体、尺寸和加载状态
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  buttonStyle = 'solid',
  isLoading = false,
  isGlass = true,
  loadingText,
  icon,
  iconPosition = 'left',
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  active = false,
  elevated = false,
  animation = true,
  ...props
}: ButtonProps) => {
  // 变体基础颜色
  const variantBaseColors = {
    primary: 'blue',
    secondary: 'gray',
    success: 'green',
    danger: 'red',
    warning: 'amber',
    info: 'cyan',
  };
  
  // 实际的变体样式根据按钮风格生成
  const getVariantStyles = () => {
    const baseColor = variantBaseColors[variant];
    
    // 根据风格选择不同的样式
    switch (buttonStyle) {
      case 'outline':
        return `border-2 border-${baseColor}-500 text-${baseColor}-600 dark:text-${baseColor}-400 hover:bg-${baseColor}-500/10`;
      case 'ghost':
        return `text-${baseColor}-600 dark:text-${baseColor}-400 hover:bg-${baseColor}-500/10`;
      case 'link':
        return `text-${baseColor}-600 dark:text-${baseColor}-400 hover:underline`;
      case 'solid':
      default:
        return `bg-${baseColor}-500/80 hover:bg-${baseColor}-600/80 text-white`;
    }
  };
  
  // 动态生成的变体样式
  const variantStyles = getVariantStyles();

  // 尺寸样式映射
  const sizeStyles = {
    xs: 'text-xs px-2 py-1 h-6',
    sm: 'text-xs px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-6 py-2.5 h-12',
    xl: 'text-lg px-8 py-3 h-14',
  };
  
  // 圆形按钮尺寸调整
  const circleSizeStyles = {
    xs: 'w-6 h-6 p-0',
    sm: 'w-8 h-8 p-0',
    md: 'w-10 h-10 p-0',
    lg: 'w-12 h-12 p-0',
    xl: 'w-14 h-14 p-0',
  };

  // 形状样式映射
  const shapeStyles = {
    rounded: 'rounded-lg',
    square: 'rounded-none',
    pill: 'rounded-full',
    circle: 'rounded-full',
  };

  // 玻璃态效果样式，只应用于solid风格
  const glassEffect = (isGlass && buttonStyle === 'solid') 
    ? 'backdrop-blur-md border border-white/20' 
    : '';
  
  // 阴影样式
  const shadowStyle = elevated 
    ? 'shadow-md hover:shadow-lg' 
    : (buttonStyle === 'solid' ? 'shadow' : '');
  
  // 全宽样式
  const widthStyle = fullWidth ? 'w-full' : '';

  // 禁用状态样式
  const disabledStyle = disabled 
    ? 'opacity-60 cursor-not-allowed pointer-events-none' 
    : '';
    
  // 激活状态样式
  const activeStyle = active && !disabled 
    ? 'bg-opacity-90 dark:bg-opacity-90 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-opacity-50' 
    : '';
    
  // 动画样式
  const animationStyle = animation && !disabled && !isLoading
    ? 'hover:scale-[1.02] active:scale-[0.98]'
    : '';
    
  // 圆形按钮专用样式
  const circleStyles = shape === 'circle' ? circleSizeStyles[size] : '';

  return (
    <button
      className={`
        ${variantStyles}
        ${shape === 'circle' ? circleStyles : sizeStyles[size]}
        ${glassEffect}
        ${shadowStyle}
        ${widthStyle}
        ${disabledStyle}
        ${activeStyle}
        ${animationStyle}
        ${shapeStyles[shape]}
        font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${variantBaseColors[variant]}-500/50
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!isLoading && iconPosition === 'left' && icon}
      
      {/* 加载状态下可以显示加载文本，否则显示正常内容 */}
      {isLoading && loadingText ? loadingText : children}
      
      {!isLoading && (iconPosition === 'right' ? icon : rightIcon)}
    </button>
  );
};

export default Button; 