/**
 * @作者: 阿瑞
 * @功能: 开关组件
 * @版本: 1.0.0
 */

import React, { useState, useEffect } from 'react';

/**
 * 开关组件属性接口
 */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  labelPosition?: 'left' | 'right';
  disabled?: boolean;
  color?: string;
  glassStyling?: boolean;
  className?: string;
}

/**
 * 开关组件
 * 支持不同尺寸、位置和自定义颜色
 */
const Switch = ({
  checked = false,
  onChange,
  size = 'md',
  label,
  labelPosition = 'right',
  disabled = false,
  color = '#2d7ff9',
  glassStyling = true,
  className = '',
}: SwitchProps) => {
  const [isChecked, setIsChecked] = useState(checked);

  // 监听外部传入的checked属性变化
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  // 尺寸样式映射
  const sizeStyles = {
    sm: {
      switch: 'w-8 h-4',
      dot: 'w-3 h-3',
      translate: 'translate-x-4',
      labelText: 'text-xs',
      labelSpacing: 'mx-1.5',
    },
    md: {
      switch: 'w-11 h-6',
      dot: 'w-5 h-5',
      translate: 'translate-x-5',
      labelText: 'text-sm',
      labelSpacing: 'mx-2',
    },
    lg: {
      switch: 'w-14 h-7',
      dot: 'w-6 h-6',
      translate: 'translate-x-7',
      labelText: 'text-base',
      labelSpacing: 'mx-2.5',
    },
  };

  // 处理开关点击事件
  const handleToggle = () => {
    if (disabled) return;
    
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onChange?.(newCheckedState);
  };

  // 玻璃效果样式
  const glassStyle = glassStyling
    ? 'backdrop-blur-md border border-white/20'
    : '';

  // 禁用状态样式
  const disabledStyle = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  return (
    <div className={`flex items-center ${className}`}>
      {/* 左侧标签 */}
      {label && labelPosition === 'left' && (
        <label
          className={`${sizeStyles[size].labelText} ${sizeStyles[size].labelSpacing} ${
            disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'
          }`}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}

      {/* 开关 */}
      <div
        className={`
          relative inline-block ${sizeStyles[size].switch} ${disabledStyle}
          ${
            isChecked
              ? `${glassStyle} bg-gradient-to-r from-[${color}]/60 to-[${color}]/80`
              : `${glassStyle} bg-gray-300/50 dark:bg-gray-700/50`
          }
          rounded-full transition-colors duration-300 ease-in-out
        `}
        style={{
          backgroundColor: isChecked ? `${color}40` : '',
          borderColor: isChecked ? `${color}30` : '',
        }}
        onClick={handleToggle}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 bg-white dark:bg-gray-100
            ${sizeStyles[size].dot} rounded-full shadow-md
            transform transition-transform duration-300 ease-in-out
            ${isChecked ? sizeStyles[size].translate : ''}
          `}
        />
      </div>

      {/* 右侧标签 */}
      {label && labelPosition === 'right' && (
        <label
          className={`${sizeStyles[size].labelText} ${sizeStyles[size].labelSpacing} ${
            disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'
          }`}
          onClick={!disabled ? handleToggle : undefined}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Switch; 