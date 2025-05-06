/**
 * 邀请注册模态框
 * 作者: 阿瑞
 * 功能: 生成邀请链接和二维码
 * 版本: 1.0
 */

'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { ThemeMode } from '@/types/enum';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * 邀请模态框属性
 */
interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  accessToken: string;
  themeMode: ThemeMode;
}

/**
 * 邀请模态框组件
 */
const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  accessToken,
  themeMode
}) => {
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 表单状态
  const [formData, setFormData] = useState({
    role: 'user',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  
  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };
  
  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      role: 'user',
    });
    setError('');
    setInviteLink('');
  };
  
  /**
   * 关闭模态框
   */
  const handleModalClose = () => {
    resetForm();
    onClose();
  };
  
  /**
   * 生成邀请链接
   */
  const handleGenerateInvite = async () => {
    setError('');
    setIsSubmitting(true);
    
    try {
      // 发送请求
      const response = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          role: formData.role,
          workspaceId
        })
      });
      
      // 处理响应
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '生成邀请链接失败');
      }
      
      // 构建邀请链接
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/register?token=${result.token}`;
      setInviteLink(inviteUrl);
      
      // 成功提示
      toast.success('邀请链接已生成');
      
    } catch (error: any) {
      console.error('生成邀请链接失败:', error);
      setError(error.message || '生成邀请链接过程中发生错误');
      toast.error(error.message || '生成邀请链接失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * 复制邀请链接
   */
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      toast.success('邀请链接已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      toast.error('复制失败');
    });
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={
        <div className="flex items-center space-x-2">
          <Icon icon="lucide:user-plus-2" className="w-5 h-5 text-blue-500" />
          <span>邀请注册</span>
        </div>
      }
      size="md"
      position="center"
      glassLevel={isDarkMode ? 'heavy' : 'medium'}
    >
      <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 text-sm`}>
        <p>生成邀请链接并分享给新成员，他们可以通过链接直接注册并加入您的工作空间。</p>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6 animate-pulse">
          <div className="flex">
            <Icon icon="lucide:alert-circle" className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="space-y-5">
        <div className="transition-all duration-200">
          <label htmlFor="role" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 flex items-center`}>
            设置被邀请人角色
            <Icon icon="lucide:shield" className="w-4 h-4 ml-1 text-gray-400" />
          </label>
          <div className="relative">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`w-full px-3 py-2 pl-9 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode
                  ? 'bg-gray-800/40 text-white border-gray-700'
                  : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="lucide:users" className="w-4 h-4 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Icon icon="lucide:chevron-down" className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            管理员可以添加/移除成员，普通用户只能查看
          </p>
        </div>
        
        {!inviteLink && (
          <div className="flex justify-center mt-6">
            <Button
              variant="primary"
              onClick={handleGenerateInvite}
              isLoading={isSubmitting}
              icon={!isSubmitting ? <Icon icon="lucide:link" className="w-4 h-4" /> : undefined}
              className="w-full"
            >
              {isSubmitting ? '生成中...' : '生成邀请链接'}
            </Button>
          </div>
        )}
        
        {inviteLink && (
          <div className="mt-6 space-y-5">
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>邀请链接</h3>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={inviteLink} 
                  readOnly 
                  className={`flex-1 p-2 text-sm border rounded-l-md ${
                    isDarkMode
                      ? 'bg-gray-800/40 text-white border-gray-700'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
                <Button
                  variant="secondary"
                  onClick={handleCopyLink}
                  icon={<Icon icon="lucide:clipboard" className="w-4 h-4" />}
                  className="rounded-l-none"
                >
                  复制
                </Button>
              </div>
              <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                此链接在7天内有效，可以直接通过浏览器访问
              </p>
            </div>
            
            <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
              <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>邀请二维码</h3>
              <div className="flex justify-center">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-white' : 'bg-white'}`}>
                  <QRCodeSVG 
                    value={inviteLink}
                    size={180}
                    level="M"
                    includeMargin={true}
                    imageSettings={{
                      src: "/images/logo-small.png",
                      height: 24,
                      width: 24,
                      excavate: true,
                    }}
                  />
                </div>
              </div>
              <p className={`mt-3 text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                扫描二维码即可在移动设备上注册
              </p>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="secondary" 
                onClick={handleModalClose}
                icon={<Icon icon="lucide:x" className="w-4 h-4" />}
              >
                关闭
              </Button>
              <Button 
                variant="primary" 
                onClick={handleGenerateInvite}
                icon={<Icon icon="lucide:refresh-cw" className="w-4 h-4" />}
              >
                重新生成
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InviteModal; 