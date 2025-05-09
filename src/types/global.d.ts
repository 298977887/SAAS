/**
 * 全局类型声明文件
 * 作者: 阿瑞
 * 功能: 提供全局类型声明
 * 版本: 1.0.0
 */

// 确保TypeScript识别.tsx文件为React组件
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// 确保TypeScript能够识别所有组件文件
declare module '*.tsx' {
  import React from 'react';
  const Component: React.ComponentType<any>;
  export default Component;
} 