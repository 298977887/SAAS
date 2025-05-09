'use client';

/**
 * 用户注册页面
 * 作者: 阿瑞
 * 功能: 提供用户注册和创建工作空间功能，支持邀请链接注册，使用毛玻璃UI效果
 * 版本: 1.3
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { useNotification } from '@/components/ui/Notification';

/**
 * 注册表单状态接口
 */
interface RegisterFormState {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  workspaceName: string;
  isSubmitting: boolean;
}

/**
 * 表单验证错误接口
 */
interface FormErrors {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  workspaceName?: string;
  general?: string;
}

/**
 * 注册页面组件
 */
export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeMode = useThemeMode();
  const notification = useNotification();
  
  // 获取邀请令牌
  const inviteToken = searchParams.get('token');
  
  // 计算当前是否是深色模式
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  /**
   * 表单状态
   */
  const [formState, setFormState] = useState<RegisterFormState>({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    isSubmitting: false
  });
  
  /**
   * 表单验证错误
   */
  const [errors, setErrors] = useState<FormErrors>({});
  
  /**
   * 邀请信息状态
   */
  const [inviteInfo, setInviteInfo] = useState<{
    isValid: boolean;
    workspaceName?: string;
    inviterName?: string;
    isLoading: boolean;
    error?: string;
  }>({
    isValid: false,
    isLoading: !!inviteToken
  });

  /**
   * 验证邀请令牌
   */
  useEffect(() => {
    if (inviteToken) {
      const verifyInviteToken = async () => {
        try {
          const response = await fetch(`/api/auth/verify-invite?token=${inviteToken}`);
          
          if (response.ok) {
            const data = await response.json();
            setInviteInfo({
              isValid: true,
              workspaceName: data.workspaceName,
              inviterName: data.inviterName,
              isLoading: false
            });
          } else {
            const errorData = await response.json();
            setInviteInfo({
              isValid: false,
              isLoading: false,
              error: errorData.error || '无效的邀请链接'
            });
            notification.error('邀请链接无效或已过期');
          }
        } catch (error) {
          console.error('验证邀请令牌失败:', error);
          setInviteInfo({
            isValid: false,
            isLoading: false,
            error: '验证邀请链接失败'
          });
          notification.error('验证邀请链接失败');
        }
      };
      
      verifyInviteToken();
    }
  }, [inviteToken, notification]);

  /**
   * 处理表单输入变化
   * @param e 输入事件
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除相应字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  /**
   * 验证表单输入
   * @returns 表单是否有效
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // 验证用户名
    if (!formState.username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (formState.username.length < 3) {
      newErrors.username = '用户名长度至少为3个字符';
    }
    
    // 验证邮箱
    if (!formState.email.trim()) {
      newErrors.email = '请输入电子邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = '请输入有效的电子邮箱';
    }
    
    // 验证手机号
    if (!formState.phone.trim()) {
      newErrors.phone = '请输入手机号码';
    } else if (!/^1\d{10}$/.test(formState.phone)) {
      newErrors.phone = '请输入有效的手机号码';
    }
    
    // 验证密码
    if (!formState.password) {
      newErrors.password = '请输入密码';
    } else if (formState.password.length < 6) {
      newErrors.password = '密码长度至少为6个字符';
    }
    
    // 验证确认密码
    if (!formState.confirmPassword) {
      newErrors.confirmPassword = '请确认密码';
    } else if (formState.confirmPassword !== formState.password) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    // 验证工作空间名称（仅在没有邀请令牌时需要）
    if (!inviteToken && !formState.workspaceName.trim()) {
      newErrors.workspaceName = '请输入工作空间名称';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   * @param e 表单提交事件
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    setErrors({});
    
    try {
      const payload = {
        username: formState.username,
        email: formState.email,
        phone: formState.phone,
        password: formState.password,
        ...(inviteToken 
          ? { inviteToken }
          : { workspaceName: formState.workspaceName })
      };
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '注册失败');
      }
      
      // 注册成功提示
      notification.success('注册成功！正在跳转到登录页面...');
      
      // 延迟后跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 1500);
      
    } catch (error: Error | unknown) {
      console.error('注册失败:', error);
      
      setErrors({
        general: error instanceof Error ? error.message : '注册失败，请稍后再试'
      });
      notification.error('注册失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      // 无论成功还是失败，都重置提交状态
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // 如果正在加载邀请信息，显示加载状态
  if (inviteToken && inviteInfo.isLoading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="text-center">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>验证邀请链接中...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // 如果有邀请令牌但无效，显示错误信息
  if (inviteToken && !inviteInfo.isValid && !inviteInfo.isLoading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-md mx-auto p-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>无效的邀请链接</h2>
          <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {inviteInfo.error || '该邀请链接可能已过期或无效。请联系邀请人获取新的邀请链接。'}
          </p>
          <Link 
            href="/login" 
            className="mt-4 inline-block px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-sm w-full mx-auto">
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {inviteToken ? '接受邀请并注册' : '注册新账号'}
          </h2>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {inviteToken && inviteInfo.workspaceName 
              ? `您被邀请加入"${inviteInfo.workspaceName}"工作空间`
              : '创建您的账号和工作空间'}
          </p>
        </div>
        
        <div className={`${isDarkMode ? 'glass-card-dark' : 'glass-card'} p-6 rounded-xl`}>
          {/* 通用错误提示 */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名 */}
            <div>
              <label htmlFor="username" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                用户名
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formState.username}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.username 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="输入您的用户名"
                />
                {errors.username && (
                  <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                    {errors.username}
                  </div>
                )}
              </div>
            </div>

            {/* 电子邮箱 */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                电子邮箱
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formState.email}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.email 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            {/* 手机号码 */}
            <div>
              <label htmlFor="phone" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                手机号码
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formState.phone}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.phone 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="13800138000"
                />
                {errors.phone && (
                  <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                    {errors.phone}
                  </div>
                )}
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                密码
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formState.password}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.password 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="********"
                />
                {errors.password && (
                  <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            {/* 确认密码 */}
            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                确认密码
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formState.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full px-3 py-2 border ${
                    errors.confirmPassword 
                      ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                      : isDarkMode 
                        ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                        : 'border-gray-300 text-gray-900 placeholder-gray-400'
                  } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="********"
                />
                {errors.confirmPassword && (
                  <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </div>

            {/* 工作空间名称（仅当没有邀请令牌时显示） */}
            {!inviteToken && (
              <div>
                <label htmlFor="workspaceName" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  工作空间名称
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="workspaceName"
                    name="workspaceName"
                    type="text"
                    required
                    value={formState.workspaceName}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border ${
                      errors.workspaceName 
                        ? 'border-red-300 dark:border-red-700 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-600' 
                        : isDarkMode 
                          ? 'border-gray-700 bg-gray-800/40 text-white placeholder-gray-400'
                          : 'border-gray-300 text-gray-900 placeholder-gray-400'
                    } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="您的团队或公司名称"
                  />
                  {errors.workspaceName && (
                    <div className={`mt-1 text-xs text-red-600 dark:text-red-400`}>
                      {errors.workspaceName}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 显示邀请的工作空间信息（如果有） */}
            {inviteToken && inviteInfo.isValid && (
              <div className={`p-4 rounded-md ${isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  您将加入工作空间: <span className="font-semibold">{inviteInfo.workspaceName}</span>
                </p>
                {inviteInfo.inviterName && (
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    邀请人: {inviteInfo.inviterName}
                  </p>
                )}
              </div>
            )}
            
            {/* 提交按钮 */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={formState.isSubmitting}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${
                  formState.isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {formState.isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    处理中...
                  </>
                ) : (
                  inviteToken ? '接受邀请并注册' : '注册'
                )}
              </button>
            </div>
            
            {/* 登录链接 */}
            <div className="text-center mt-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                已有账号？{' '}
                <Link href="/login" className={`font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
                  去登录
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
