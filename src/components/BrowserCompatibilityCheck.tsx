/**
 * @作者 阿瑞
 * @功能 浏览器兼容性检测组件
 * @版本 1.2.0
 */

'use client';

import { useEffect, useState } from 'react';
import { detectBrowser, type BrowserInfo } from '@/lib/browserDetect';

/* 内联样式定义 - 确保跨浏览器兼容性 */
const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    backgroundColor: '#fff'
  },
  cardDark: {
    backgroundColor: '#1e293b'
  },
  icon: {
    width: '64px',
    height: '64px',
    marginBottom: '16px',
    color: '#eab308'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#111827'
  },
  titleDark: {
    color: '#ffffff'
  },
  text: {
    marginBottom: '8px',
    color: '#4b5563'
  },
  textDark: {
    color: '#d1d5db'
  },
  infoBox: {
    marginBottom: '16px',
    width: '100%'
  },
  browserName: {
    fontWeight: 'bold' as const,
    color: '#ef4444'
  },
  browserEngine: {
    fontWeight: 'bold' as const
  },
  browserList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    width: '100%',
    marginBottom: '24px'
  },
  browserItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit'
  },
  browserItemDark: {
    border: '1px solid #374151'
  },
  browserItemHover: {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  browserIcon: {
    width: '40px',
    height: '40px',
    marginBottom: '8px',
    position: 'relative' as const
  },
  browserLabel: {
    fontSize: '14px',
    fontWeight: '500' as const
  },
  button: {
    padding: '12px 16px',
    backgroundColor: '#2563eb',
    color: 'white',
    fontWeight: '500' as const,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    width: '100%'
  },
  buttonHover: {
    backgroundColor: '#1d4ed8'
  }
};

/* 浏览器兼容性检测组件 */
export default function BrowserCompatibilityCheck() {
  // 状态管理
  const [showWarning, setShowWarning] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hoveredBrowser, setHoveredBrowser] = useState<string | null>(null);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  useEffect(() => {
    // 检测浏览器
    const browser = detectBrowser();
    
    // 检测深色模式
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const htmlEl = document.documentElement;
    const isDark = prefersDark || 
                  htmlEl.classList.contains('dark') ||
                  document.body.classList.contains('dark-theme');
    setIsDarkMode(isDark);
    
    if (browser) {
      setBrowserInfo(browser);
      
      // 如果浏览器不兼容，显示警告
      if (!browser.isCompatible) {
        setShowWarning(true);
      }
    }
  }, []);

  // 如果不需要显示警告，或者在服务器端，返回 null
  if (!showWarning || !browserInfo) {
    return null;
  }

  // 浏览器列表
  const browsers = [
    {
      name: 'Google Chrome',
      url: 'https://www.google.com/chrome/',
      icon: '/Browser/Chrome.svg'
    },
    {
      name: 'Microsoft Edge',
      url: 'https://www.microsoft.com/edge',
      icon: '/Browser/Edge.svg'
    },
    {
      name: 'Firefox',
      url: 'https://www.mozilla.org/firefox/',
      icon: '/Browser/Firefox.svg'
    },
    {
      name: 'Safari',
      url: 'https://www.apple.com/safari/',
      icon: '/Browser/Safari.svg'
    }
  ];

  // 浏览器兼容性警告
  return (
    <div style={styles.overlay}>
      <div style={
        isDarkMode 
          ? {...styles.card, ...styles.cardDark} 
          : styles.card
      }>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={styles.icon}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        
        <h2 style={
          isDarkMode 
            ? {...styles.title, ...styles.titleDark} 
            : styles.title
        }>
          浏览器兼容性警告
        </h2>
        
        <div style={styles.infoBox}>
          <p style={
            isDarkMode 
              ? {...styles.text, ...styles.textDark} 
              : styles.text
          }>
            检测到您正在使用 <span style={styles.browserName}>{browserInfo.name}</span>
          </p>
          <p style={
            isDarkMode 
              ? {...styles.text, ...styles.textDark} 
              : styles.text
          }>
            渲染内核: <span style={styles.browserEngine}>{browserInfo.engine} {browserInfo.engineVersion}</span>
          </p>
          <p style={
            isDarkMode 
              ? {...styles.text, ...styles.textDark} 
              : styles.text
          }>
            该浏览器可能无法正常显示本网站的所有功能，建议更换现代浏览器。
          </p>
        </div>
        
        <p style={
          isDarkMode 
            ? {...styles.text, ...styles.textDark} 
            : styles.text
        }>
          为了获得最佳浏览体验，请使用以下现代浏览器：
        </p>
        
        <div style={styles.browserList}>
          {browsers.map((browser) => (
            <a
              key={browser.name}
              href={browser.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...styles.browserItem,
                ...(isDarkMode ? styles.browserItemDark : {}),
                ...(hoveredBrowser === browser.name ? styles.browserItemHover : {})
              }}
              onMouseEnter={() => setHoveredBrowser(browser.name)}
              onMouseLeave={() => setHoveredBrowser(null)}
            >
              <div style={styles.browserIcon}>
                {/* 使用静态SVG图标 */}
                <img
                  src={browser.icon}
                  alt={browser.name}
                  width={40}
                  height={40}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
              <span style={styles.browserLabel}>{browser.name}</span>
            </a>
          ))}
        </div>
        
        <button 
          onClick={() => setShowWarning(false)} 
          style={{
            ...styles.button,
            ...(isButtonHovered ? styles.buttonHover : {})
          }}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          我知道了，继续浏览（可能会影响体验）
        </button>
      </div>
    </div>
  );
} 