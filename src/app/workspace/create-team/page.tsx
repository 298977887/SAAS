/**
 * 创建团队页面
 * 作者: 阿瑞
 * 功能: 提供创建团队的用户界面
 * 版本: 1.0.0
 */

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useNotification } from '@/components/ui/Notification';
import { useUserInfo, useAccessToken, useIsAuthenticated, useUserActions } from '@/store/userStore';

/**
 * 创建团队页面组件
 */
export default function CreateTeamPage() {
  // 状态管理
  const [formData, setFormData] = useState({
    teamName: '',
    teamCode: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGeneratedCode, setHasGeneratedCode] = useState(false);
  
  // 获取用户信息和令牌
  const userInfo = useUserInfo();
  const accessToken = useAccessToken();
  const isAuthenticated = useIsAuthenticated();
  const { fetchAndSetUserInfo } = useUserActions();
  const notification = useNotification();
  
  // 路由和引用
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // 检查用户是否已登录和信息是否完整
  useEffect(() => {
    if (!isAuthenticated) {
      notification.error('请先登录后再创建团队', {
        title: '访问受限'
      });
      router.push('/login');
      return;
    }
    
    // 检查用户信息是否完整
    if (!userInfo?.id || !userInfo?.workspace?.id) {
      console.log('用户信息不完整，尝试重新获取:', userInfo);
      fetchAndSetUserInfo();
    }
  }, [isAuthenticated, userInfo, router, fetchAndSetUserInfo, notification]);

  /**
   * 添加表单悬停效果
   */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!formRef.current) return;
      
      const rect = formRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 更加微妙的旋转效果
      const rotateX = (y - centerY) / 60;
      const rotateY = (centerX - x) / 60;
      
      formRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    
    const handleMouseLeave = () => {
      if (!formRef.current) return;
      formRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };
    
    const form = formRef.current;
    if (form) {
      form.addEventListener('mousemove', handleMouseMove);
      form.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      if (form) {
        form.removeEventListener('mousemove', handleMouseMove);
        form.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 只有当用户修改团队名称，且已经失去焦点生成过代码的情况下，才动态更新团队代码
    if (name === 'teamName' && hasGeneratedCode) {
      const generatedCode = generateTeamCode(value);
      setFormData(prev => ({ ...prev, teamCode: generatedCode }));
    }
  };

  /**
   * 处理团队名称失去焦点事件
   */
  const handleTeamNameBlur = () => {
    if (formData.teamName.trim().length > 0) {
      const generatedCode = generateTeamCode(formData.teamName);
      setFormData(prev => ({ ...prev, teamCode: generatedCode }));
      setHasGeneratedCode(true);
      
      // 验证生成的代码
      validateTeamCode(generatedCode);
    }
  };

  /**
   * 验证团队代码格式
   */
  const validateTeamCode = (code: string): boolean => {
    // 清除之前的错误
    setCodeError(null);
    
    // 检查团队代码格式：只能包含字母、数字和下划线，长度在3-20之间
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(code)) {
      setCodeError('团队代码只能包含字母、数字和下划线，长度在3-20之间');
      return false;
    }
    
    return true;
  };

  /**
   * 验证表单
   */
  const validateForm = () => {
    if (!formData.teamName) {
      setError('团队名称为必填项');
      return false;
    }
    
    // 验证团队代码格式
    if (!validateTeamCode(formData.teamCode)) {
      return false;
    }
    
    // 验证用户是否已登录
    if (!isAuthenticated || !accessToken) {
      setError('用户未登录，请先登录后再创建团队');
      notification.error('请先登录后再创建团队', {
        title: '访问受限'
      });
      router.push('/login');
      return false;
    }
    
    // 验证用户信息是否完整
    if (!userInfo?.id || !userInfo?.workspace?.id) {
      setError('用户信息不完整，请刷新页面后重试');
      notification.error('用户信息不完整，请刷新页面后重试', {
        title: '数据错误'
      });
      console.error('用户信息不完整:', userInfo);
      fetchAndSetUserInfo();
      return false;
    }
    
    return true;
  };

  /**
   * 根据团队名称生成团队代码
   */
  const generateTeamCode = (_name: string): string => {
    // 生成4个随机字母
    const generateRandomLetters = (length: number) => {
      const letters = 'abcdefghijklmnopqrstuvwxyz';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
      }
      return result;
    };
    
    // 生成4个随机数字
    const generateRandomNumbers = (length: number) => {
      let result = '';
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10).toString();
      }
      return result;
    };
    
    // 生成随机字母和数字
    const randomLetters = generateRandomLetters(4);
    const randomNumbers = generateRandomNumbers(4);
    
    // 生成最终的唯一代码：team_[4个随机字母]_[4个随机数字]
    return `team_${randomLetters}_${randomNumbers}`;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('创建团队，用户信息:', {
        userId: userInfo.id,
        workspaceId: userInfo.workspace?.id
      });
      
      // 尝试创建团队，最多重试3次（如果团队代码重复）
      let attempts = 0;
      let teamCreated = false;
      let currentTeamCode = formData.teamCode;
      
      while (!teamCreated && attempts < 3) {
        try {
          console.log(`尝试创建团队 (${attempts + 1}/3), 代码: ${currentTeamCode}`);
          
          const response = await fetch('/api/teams', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              teamCode: currentTeamCode,
              teamName: formData.teamName,
              // 额外发送用户ID和工作空间ID作为备份
              userId: userInfo.id,
              workspaceId: userInfo.workspace?.id
            }),
          });
          
          const data = await response.json();
          
          if (response.ok) {
            teamCreated = true;
            console.log('团队创建成功:', data);
            
            // 创建成功，显示通知
            notification.success(`团队"${formData.teamName}"创建成功`, {
              title: "创建成功"
            });
          } else if (response.status === 409 && data.error?.includes('已存在')) {
            // 团队代码重复，生成新的代码并重试
            attempts++;
            currentTeamCode = generateTeamCode(formData.teamName);
            console.log(`团队代码重复，生成新代码: ${currentTeamCode}`);
          } else if (response.status === 401) {
            console.error('认证错误:', data);
            throw new Error('用户未登录或登录已过期，请重新登录');
          } else {
            // 其他错误
            console.error('创建团队失败:', data);
            throw new Error(data.error || '创建团队失败');
          }
        } catch (error: any) {
          // 重新抛出非重复错误
          if (attempts >= 3 || !(error.message.includes('已存在'))) {
            throw error;
          }
        }
      }
      
      if (!teamCreated) {
        throw new Error('创建团队失败：多次尝试后团队代码仍然重复');
      }
      
      // 创建成功后立即初始化团队数据库
      try {
        console.log(`开始初始化团队数据库: ${currentTeamCode}`);
        
        const initResponse = await fetch(`/api/teams/${currentTeamCode}/init-database`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        const initData = await initResponse.json();
        
        if (!initResponse.ok) {
          console.error('初始化数据库失败:', initData);
          notification.warning("团队创建成功，但初始化数据库失败，请稍后重试", {
            title: "警告"
          });
        } else {
          console.log('数据库初始化成功:', initData);
          notification.success(initData.message || "团队数据库初始化成功", {
            title: "成功"
          });
        }
      } catch (initError) {
        console.error('初始化数据库错误:', initError);
        notification.warning("初始化团队数据库时发生错误，请稍后手动初始化", {
          title: "警告"
        });
      }

      // 创建成功，跳转到团队页面
      router.push('/workspace/teams');
    } catch (err: any) {
      console.error('创建团队失败:', err);
      setError(err.message);
      notification.error(err.message || "创建团队失败", {
        title: "创建失败"
      });
      
      // 如果是认证错误，跳转到登录页
      if (err.message.includes('未登录') || err.message.includes('登录已过期')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // 如果用户未登录，不渲染表单
  if (!isAuthenticated) {
    return null;
  }

  /**
   * 页面渲染
   */
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="pb-4">
          <h2 className="text-2xl font-bold text-center">创建新团队</h2>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} className="transition-transform duration-200 ease-out">
          <div className="space-y-4 p-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="teamName" className="block text-sm font-medium">团队名称</label>
              <Input
                id="teamName"
                name="teamName"
                placeholder="输入团队名称"
                value={formData.teamName}
                onChange={handleChange}
                onBlur={handleTeamNameBlur}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="teamCode" className="block text-sm font-medium">团队代码</label>
              <Input
                id="teamCode"
                name="teamCode"
                placeholder="自动生成，可手动修改"
                value={formData.teamCode}
                onChange={handleChange}
                onBlur={() => validateTeamCode(formData.teamCode)}
                required
              />
              {codeError && (
                <p className="text-xs text-red-500 mt-1">{codeError}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                团队代码用于唯一标识团队，只能包含字母、数字和下划线
              </p>
            </div>
          </div>
          
          <div className="flex justify-between p-4 border-t">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => router.back()}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? '创建中...' : '创建团队'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 