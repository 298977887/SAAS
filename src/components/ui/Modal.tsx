/**
 * @作者: 阿瑞
 * @功能: 毛玻璃效果模态框组件
 * @版本: 1.0.2
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

/**
 * 模态框尺寸类型定义
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * 模态框位置类型定义
 */
export type ModalPosition = 'center' | 'top' | 'right' | 'bottom' | 'left';

/**
 * 模态框属性接口
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  position?: ModalPosition;
  isGlass?: boolean;
  glassLevel?: 'light' | 'medium' | 'heavy';
  closeOnOutsideClick?: boolean;
  showCloseButton?: boolean;
  preventScroll?: boolean;
  className?: string;
  overlayClassName?: string;
  transitionDuration?: number;
  closeIconClass?: string;
}

/**
 * 毛玻璃效果模态框组件
 * 支持不同尺寸、位置和动画效果
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  position = 'center',
  isGlass = true,
  glassLevel = 'medium',
  closeOnOutsideClick = true,
  showCloseButton = true,
  preventScroll = true,
  className = '',
  overlayClassName = '',
  transitionDuration = 300, // 默认增加到300ms提供更流畅的动画效果
  closeIconClass = '',
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // 尺寸样式映射
  const sizeStyles = {
    sm: position === 'center' ? 'max-w-sm w-full' : 'w-full max-w-xs',
    md: position === 'center' ? 'max-w-md w-full' : 'w-full max-w-sm',
    lg: position === 'center' ? 'max-w-lg w-full' : 'w-full max-w-md',
    xl: position === 'center' ? 'max-w-2xl w-full' : 'w-full max-w-lg',
    full: position === 'center' ? 'max-w-5xl w-full' : 'w-full',
  };
  
  // 位置样式映射
  const positionStyles = {
    center: 'flex items-center justify-center p-4',
    top: 'flex items-start justify-center p-4',
    right: 'flex items-center justify-end',
    bottom: 'flex items-end justify-center',
    left: 'flex items-center justify-start',
  };
  
  // 非居中模式的特定样式
  const directionStyles = {
    center: '',
    top: 'rounded-t-none',
    right: 'h-full rounded-l-none',
    bottom: 'rounded-b-none',
    left: 'h-full rounded-r-none',
  };
  
  // 毛玻璃效果
  const glassStyles = {
    light: 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm',
    medium: 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md',
    heavy: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl',
  };
  
  const glassEffect = isGlass ? glassStyles[glassLevel] : 'bg-white dark:bg-slate-900';
  
  // 动画样式
  const transitionStyles = {
    enter: {
      center: 'opacity-0 scale-95',
      top: 'opacity-0 -translate-y-full',
      right: 'opacity-0 translate-x-full',
      bottom: 'opacity-0 translate-y-full',
      left: 'opacity-0 -translate-x-full',
    },
    enterActive: {
      center: 'opacity-100 scale-100',
      top: 'opacity-100 translate-y-0',
      right: 'opacity-100 translate-x-0',
      bottom: 'opacity-100 translate-y-0',
      left: 'opacity-100 translate-x-0',
    },
    exit: {
      center: 'opacity-0 scale-95',
      top: 'opacity-0 -translate-y-full',
      right: 'opacity-0 translate-x-full',
      bottom: 'opacity-0 translate-y-full',
      left: 'opacity-0 -translate-x-full',
    }
  };
  
  // 处理滚动锁定
  useEffect(() => {
    if (!preventScroll) return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, preventScroll]);
  
  // 处理关闭动画和逻辑
  const handleClose = () => {
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, transitionDuration);
  };
  
  // 处理点击外部关闭
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOutsideClick) return;
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose();
    }
  };
  
  // 处理ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape' && !isClosing) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isClosing]);

  // 处理打开动画状态
  useEffect(() => {
    if (isOpen && !isClosing) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 50);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isOpen, isClosing]);

  // 防止客户端渲染不匹配
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // 客户端检查
  if (!isMounted || typeof window === 'undefined') return null;
  
  // 在模态框关闭且没有处于关闭动画状态时不渲染内容
  if (!isOpen && !isClosing) return null;
  
  return createPortal(
    <div 
      className={`fixed inset-0 z-50 ${positionStyles[position]} overflow-auto`}
      onClick={handleOutsideClick}
      style={{
        transition: `opacity ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        opacity: isClosing ? 0 : 1,
      }}
    >
      {/* 背景遮罩 */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm ${overlayClassName}`}
        style={{
          transition: `opacity ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          opacity: isClosing ? 0 : (isAnimating ? 0 : 1),
        }}
      />
      
      {/* 模态框 */}
      <div
        ref={modalRef}
        className={`
          ${sizeStyles[size]}
          ${glassEffect}
          ${directionStyles[position]}
          rounded-lg shadow-xl
          z-50
          ${className}
          transform transition-all
          ${isClosing 
            ? transitionStyles.exit[position] 
            : (isAnimating ? transitionStyles.enter[position] : transitionStyles.enterActive[position])
          }
        `}
        style={{
          transition: `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          transformOrigin: 'center',
        }}
      >
        {/* 模态框头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-gray-700/30">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors ${closeIconClass}`}
                onClick={handleClose}
                aria-label="关闭"
              >
                <Icon icon="lucide:x" className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* 模态框内容 */}
        <div className="px-6 py-4">
          {children}
        </div>
        
        {/* 模态框页脚 */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 dark:border-gray-700/30">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal; 