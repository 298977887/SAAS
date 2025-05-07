/**
 * 添加成员模态框
 * 作者: 阿瑞
 * 功能: 创建新用户并添加到当前工作空间
 * 版本: 1.2
 */

'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { ThemeMode } from '@/types/enum';
import { useNotification } from '@/components/ui/Notification';
import { Icon } from '@iconify/react';
import { SystemRoleType } from '@/models/system/types';

/**
 * 添加成员模态框属性
 */
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  accessToken: string;
  refreshMembers: () => void;
  themeMode: ThemeMode;
}

/**
 * 添加成员模态框组件
 */
const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  accessToken,
  refreshMembers,
  themeMode
}) => {
  const isDarkMode = themeMode === ThemeMode.Dark;
  const notification = useNotification();
  
  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role_type: SystemRoleType.USER,
    role_name: '普通用户',
    is_custom_role: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'role_type') {
      // 处理角色类型变更
      const roleType = value as SystemRoleType;
      let roleName = '普通用户';
      
      // 根据角色类型设置对应的显示名称
      switch (roleType) {
        case SystemRoleType.ADMIN:
          roleName = '管理员';
          break;
        case SystemRoleType.BOSS:
          roleName = '老板';
          break;
        case SystemRoleType.FINANCE:
          roleName = '财务';
          break;
        case SystemRoleType.OPERATION:
          roleName = '运营';
          break;
        case SystemRoleType.CUSTOMER:
          roleName = '客服';
          break;
        default:
          roleName = '普通用户';
      }
      
      setFormData(prev => ({ 
        ...prev, 
        role_type: roleType,
        role_name: roleName 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 当密码变化时，评估密码强度
    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
    
    setError('');
  };
  
  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      username: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      role_type: SystemRoleType.USER,
      role_name: '普通用户',
      is_custom_role: false
    });
    setError('');
    setPasswordStrength(0);
    setFocusedField(null);
  };
  
  /**
   * 关闭模态框
   */
  const handleModalClose = () => {
    resetForm();
    onClose();
  };
  
  /**
   * 设置输入框焦点状态
   */
  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };
  
  /**
   * 清除输入框焦点状态
   */
  const handleBlur = () => {
    setFocusedField(null);
  };
  
  /**
   * 计算密码强度
   */
  const evaluatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // 复杂度检查
    if (/[A-Z]/.test(password)) strength += 1; // 大写字母
    if (/[a-z]/.test(password)) strength += 1; // 小写字母
    if (/[0-9]/.test(password)) strength += 1; // 数字
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // 特殊字符
    
    // 归一化到0-100
    const normalizedStrength = Math.min(Math.floor(strength * 100 / 6), 100);
    setPasswordStrength(normalizedStrength);
  };
  
  /**
   * 获取密码强度颜色
   */
  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  /**
   * 获取密码强度文本
   */
  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return '弱';
    if (passwordStrength < 70) return '中';
    return '强';
  };
  
  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 验证表单
    if (!formData.username) {
      setError('用户名不能为空');
      return;
    }
    
    if (!formData.phone) {
      setError('电话号码不能为空');
      return;
    }
    
    if (!formData.email) {
      setError('邮箱不能为空');
      return;
    }
    
    if (!formData.password) {
      setError('密码不能为空');
      return;
    }
    
    if (passwordStrength < 30) {
      setError('密码强度太低，请设置更复杂的密码');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 发送请求
      const response = await fetch('/api/workspace/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          createNewUser: true,
          role_type: formData.role_type,
          role_name: formData.role_name,
          is_custom_role: formData.is_custom_role,
          workspaceId
        })
      });
      
      // 处理响应
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '添加成员失败');
      }
      
      // 成功提示
      notification.success('成员创建并添加成功');
      
      // 关闭模态框并刷新列表
      resetForm();
      onClose();
      refreshMembers();
      
    } catch (error: any) {
      console.error('添加成员失败:', error);
      setError(error.message || '添加成员过程中发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 创建动画效果
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // 自动聚焦第一个字段
        const usernameInput = document.getElementById('username');
        if (usernameInput) usernameInput.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return () => {}; // 添加返回值以修复"并非所有代码路径都返回值"的问题
  }, [isOpen]);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="flex items-center space-x-2">
          <Icon icon="lucide:user-plus" className="w-5 h-5 text-blue-500" />
          <span>添加工作空间成员</span>
        </div>
      }
      size="md"
      position="center"
      glassLevel={isDarkMode ? 'heavy' : 'medium'}
    >
      <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 text-sm`}>
        <p>创建新用户并添加到当前工作空间，标有<span className="text-red-500">*</span>的字段为必填项。</p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6 animate-pulse">
          <div className="flex">
            <Icon icon="lucide:alert-circle" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="transition-all duration-300">
        <div className="space-y-5">
          <div className={`transition-all duration-200 ${focusedField === 'username' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="username" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              用户名<span className="text-red-500 ml-0.5">*</span>
              <Icon icon="lucide:user" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onFocus={() => handleFocus('username')}
              onBlur={handleBlur}
              placeholder="请输入用户名"
              fullWidth
              leftIcon={<Icon icon="lucide:at-sign" className="w-4 h-4 text-gray-400" />}
            />
          </div>
          
          <div className={`transition-all duration-200 ${focusedField === 'phone' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="phone" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              电话号码<span className="text-red-500 ml-0.5">*</span>
              <Icon icon="lucide:phone" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => handleFocus('phone')}
              onBlur={handleBlur}
              placeholder="请输入电话号码"
              fullWidth
              leftIcon={<Icon icon="lucide:phone" className="w-4 h-4 text-gray-400" />}
            />
          </div>
          
          <div className={`transition-all duration-200 ${focusedField === 'email' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              邮箱<span className="text-red-500 ml-0.5">*</span>
              <Icon icon="lucide:mail" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              placeholder="请输入邮箱地址"
              fullWidth
              leftIcon={<Icon icon="lucide:mail" className="w-4 h-4 text-gray-400" />}
            />
          </div>
          
          <div className={`transition-all duration-200 ${focusedField === 'password' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              密码<span className="text-red-500 ml-0.5">*</span>
              <Icon icon="lucide:lock" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={handleBlur}
              placeholder="请设置密码"
              fullWidth
              leftIcon={<Icon icon="lucide:lock" className="w-4 h-4 text-gray-400" />}
            />
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    密码强度: <span className={passwordStrength < 30 ? 'text-red-500' : passwordStrength < 70 ? 'text-yellow-500' : 'text-green-500'}>
                      {getPasswordStrengthText()}
                    </span>
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {passwordStrength}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPasswordStrengthColor()} transition-all duration-300 ease-in-out`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span className={passwordStrength >= 16 ? 'text-green-500' : ''}>8+ 字符</span>
                  <span className={passwordStrength >= 50 ? 'text-green-500' : ''}>大小写+数字</span>
                  <span className={passwordStrength >= 70 ? 'text-green-500' : ''}>特殊字符</span>
                </div>
              </div>
            )}
          </div>
          
          <div className={`transition-all duration-200 ${focusedField === 'confirmPassword' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              确认密码<span className="text-red-500 ml-0.5">*</span>
              <Icon icon="lucide:check-circle" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onFocus={() => handleFocus('confirmPassword')}
              onBlur={handleBlur}
              placeholder="请再次输入密码"
              fullWidth
              leftIcon={<Icon icon="lucide:lock" className="w-4 h-4 text-gray-400" />}
              error={formData.confirmPassword && formData.password !== formData.confirmPassword ? '两次密码不一致' : ''}
              rightIcon={
                formData.confirmPassword && formData.password === formData.confirmPassword ? 
                <Icon icon="lucide:check" className="w-4 h-4 text-green-500" /> : 
                null
              }
            />
          </div>
          
          <div className={`transition-all duration-200 ${focusedField === 'role_type' ? 'transform -translate-y-1' : ''}`}>
            <label htmlFor="role_type" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center`}>
              角色
              <Icon icon="lucide:shield" className="w-4 h-4 ml-1 text-gray-400" />
            </label>
            <div className="relative">
              <select
                id="role_type"
                name="role_type"
                value={formData.role_type}
                onChange={handleChange}
                onFocus={() => handleFocus('role_type')}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 pl-9 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode
                    ? 'bg-gray-800/40 text-white border-gray-700'
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
              >
                <option value={SystemRoleType.USER}>普通用户</option>
                <option value={SystemRoleType.ADMIN}>管理员</option>
                <option value={SystemRoleType.BOSS}>老板</option>
                <option value={SystemRoleType.FINANCE}>财务</option>
                <option value={SystemRoleType.OPERATION}>运营</option>
                <option value={SystemRoleType.CUSTOMER}>客服</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon icon="lucide:users" className="w-4 h-4 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              选择合适的角色分配给新成员，不同角色拥有不同的操作权限
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <Button 
            variant="secondary" 
            onClick={handleModalClose}
            disabled={isSubmitting}
            icon={<Icon icon="lucide:x" className="w-4 h-4" />}
          >
            取消
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            isLoading={isSubmitting}
            icon={!isSubmitting ? <Icon icon="lucide:user-plus" className="w-4 h-4" /> : undefined}
          >
            {isSubmitting ? '添加中...' : '添加成员'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal; 