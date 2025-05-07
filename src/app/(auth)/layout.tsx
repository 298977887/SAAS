/**
 * 认证页面布局
 * 作者: 阿瑞
 * 功能: 提供登录和注册页面的统一布局，左侧显示应用简介，右侧显示认证界面
 * 版本: 1.1
 */

'use client';

import React from 'react';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';

/**
 * 认证布局组件
 * 提供左右分栏布局，左侧展示应用介绍，右侧展示登录/注册组件
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeMode = useThemeMode();
  
  // 计算当前是否是深色模式
  const isDarkMode = themeMode === ThemeMode.Dark;
  // 判断当前是否是注册页面

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative overflow-hidden">
      {/* 动态背景元素 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-10 w-[800px] h-[800px] bg-purple-500/8 rounded-full filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] -right-10 w-[700px] h-[700px] bg-blue-500/10 rounded-full filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute -bottom-20 left-[15%] w-[850px] h-[850px] bg-teal-400/8 rounded-full filter blur-[120px] opacity-60 animate-blob animation-delay-2000"></div>
      </div>
      
      {/* 装饰小球元素 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-4 h-4 rounded-full bg-accent-teal/60 animate-float"></div>
        <div className="absolute top-[30%] right-[15%] w-3 h-3 rounded-full bg-accent-purple/50 animate-float animation-delay-2000"></div>
        <div className="absolute bottom-[25%] left-[20%] w-4 h-4 rounded-full bg-accent-blue/50 animate-float animation-delay-4000"></div>
      </div>
      
      {/* 左侧应用简介 - 占据2/3空间 */}
      <div className="hidden md:flex md:w-2/3 relative z-10">
        <div className="flex flex-col items-center justify-center p-12 h-full w-full">
          <div className={`max-w-2xl ${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-8 rounded-xl`}>
            <div className="flex flex-col items-center mb-8">
              <div className={`h-20 w-20 rounded-2xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-teal-500/40' : 'bg-gradient-to-br from-blue-100 via-purple-100 to-teal-100'} flex items-center justify-center mb-4 rotate-3 shadow-lg`}>
                <span className={`text-3xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>私域</span>
              </div>
              <h1 className={`text-4xl font-bold text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                多租户SaaS管理系统
              </h1>
              <p className={`mt-3 text-lg text-center max-w-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                基于Next.js的现代化管理平台，助力企业高效管理团队与资源
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-blue-900/20 border border-blue-800/40' : 'bg-blue-50 border border-blue-100'}`}>
                <div className="flex items-center mb-3">
                  <div className={`h-8 w-8 rounded-lg ${isDarkMode ? 'bg-blue-700/40' : 'bg-blue-200'} flex items-center justify-center mr-3`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    多租户架构
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  支持多工作空间独立管理，为每个企业提供专属环境，数据隔离安全可靠
                </p>
              </div>
              
              <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-purple-900/20 border border-purple-800/40' : 'bg-purple-50 border border-purple-100'}`}>
                <div className="flex items-center mb-3">
                  <div className={`h-8 w-8 rounded-lg ${isDarkMode ? 'bg-purple-700/40' : 'bg-purple-200'} flex items-center justify-center mr-3`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    精细权限控制
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  基于角色的访问控制系统，确保用户只能访问其权限范围内的资源和功能
                </p>
              </div>
              
              <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-teal-900/20 border border-teal-800/40' : 'bg-teal-50 border border-teal-100'}`}>
                <div className="flex items-center mb-3">
                  <div className={`h-8 w-8 rounded-lg ${isDarkMode ? 'bg-teal-700/40' : 'bg-teal-200'} flex items-center justify-center mr-3`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-teal-300' : 'text-teal-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    现代UI设计
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  采用流行的毛玻璃设计风格，提供明亮通透的用户界面和流畅的交互体验
                </p>
              </div>
              
              <div className={`p-5 rounded-xl ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/40' : 'bg-amber-50 border border-amber-100'}`}>
                <div className="flex items-center mb-3">
                  <div className={`h-8 w-8 rounded-lg ${isDarkMode ? 'bg-amber-700/40' : 'bg-amber-200'} flex items-center justify-center mr-3`}>
                    <svg className={`h-4 w-4 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                      <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                      <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                    </svg>
                  </div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    高效数据管理
                  </h3>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  智能数据库连接池，支持自动初始化和维护，提供完整的团队和工作空间数据隔离
                </p>
              </div>
            </div>

            {/* 系统特点 */}
            <div className="mb-8">
              <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pb-2`}>系统特点</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>工作空间和团队管理</span>
                </div>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>基于JWT的认证机制</span>
                </div>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>响应式设计，全设备支持</span>
                </div>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>深色/明亮主题切换</span>
                </div>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>成员邀请与注册</span>
                </div>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>基于Next.js的现代技术栈</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* 右侧登录/注册界面 - 占据1/3空间 */}
      <div className="w-full md:w-1/3 relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
} 