/**
 * 登录页面
 * 作者: 阿瑞
 * 功能: 提供用户登录界面和功能，使用毛玻璃UI效果
 * 版本: 1.5
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserActions, useIsAuthenticated } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { useNotification } from '@/components/ui/Notification';

/**
 * 登录页面组件
 * 处理用户登录表单提交和验证
 */
export default function LoginPage() {
  // 状态管理
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 路由和用户状态操作
  const router = useRouter();
  const { setUserInfo, setUserToken } = useUserActions();
  const isAuthenticated = useIsAuthenticated();
  const themeMode = useThemeMode();
  const notification = useNotification();
  
  // 计算当前是否是深色模式
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  /**
   * 已登录用户重定向
   * 如果用户已经登录，直接跳转到工作空间页面
   */
  useEffect(() => {
    console.log('登录状态检查 isAuthenticated:', isAuthenticated);
    if (isAuthenticated) {
      console.log('用户已登录，跳转到工作空间');
      router.replace('/workspace'); // 使用replace代替push进行强制导航
    }
  }, [isAuthenticated, router]);
  
  /**
   * 表单输入变更处理
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除错误提示
    if (error) setError('');
  };
  
  /**
   * 表单提交处理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('提交登录表单，用户名:', formData.username);
    
    try {
      // 验证表单
      if (!formData.username || !formData.password) {
        throw new Error('用户名和密码不能为空');
      }
      
      // 发送登录请求
      console.log('发送登录请求...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // 处理响应
      const data = await response.json();
      console.log('登录响应状态:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败，请检查用户名和密码');
      }
      
      // 显示登录成功提示
      console.log('登录成功，获取到令牌和用户信息');
      notification.success('登录成功，正在跳转...');
      
      // 保存令牌和用户信息（顺序很重要！）
      console.log('保存令牌到状态:', data.accessToken?.substring(0, 10) + '...');
      setUserToken(data.accessToken);
      
      console.log('保存用户信息到状态:', data.user?.username);
      setUserInfo(data.user);
      
      // 短暂延迟后强制导航到工作空间
      console.log('准备跳转到工作空间页面...');
      setTimeout(() => {
        console.log('执行强制跳转');
        window.location.href = '/workspace'; // 使用原生导航，绕过任何Route拦截
      }, 500);
      
    } catch (error: Error | unknown) {
      console.error('登录失败详情:', error);
      const errorMessage = error instanceof Error ? error.message : '登录过程中发生错误';
      setError(errorMessage);
      notification.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full px-4 py-8">
      <div className="sm:mx-auto sm:w-full max-w-sm mb-6">
        <h2 className={`text-center text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          登录账户
        </h2>
        <p className={`mt-2 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          或{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            注册新账户
          </Link>
        </p>
      </div>

      <div className={`w-full max-w-sm mx-auto ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
        <div className="py-8 px-4 sm:px-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 错误提示 */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* 用户名输入 */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                用户名
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-800/40 text-white border-gray-700' : ''}`}
                />
              </div>
            </div>

            {/* 密码输入 */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                密码
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode ? 'bg-gray-800/40 text-white border-gray-700' : ''}`}
                />
              </div>
            </div>

            {/* 记住我和忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  name="remember_me"
                  type="checkbox"
                  className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded ${isDarkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                />
                <label htmlFor="remember_me" className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  记住我
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  忘记密码?
                </a>
              </div>
            </div>

            {/* 提交按钮 */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`btn-primary w-full flex justify-center py-2 px-4 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
