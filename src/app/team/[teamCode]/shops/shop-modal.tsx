/**
 * 店铺模态框组件
 * 作者: 阿瑞
 * 功能: 提供店铺信息的添加和编辑界面
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccessToken } from '@/store/userStore';
import { Shop, ShopStatus } from '@/models/team/types/shop';
import Modal from '@/components/ui/Modal';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop | null;
  onSuccess: () => void;
}

/**
 * 店铺模态框组件
 */
export default function ShopModal({ isOpen, onClose, shop, onSuccess }: ShopModalProps) {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  
  const isEditing = !!shop;
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Shop>>({
    unionid: '',
    openid: '',
    accountNo: '',
    wechat: '',
    avatar: '',
    nickname: '',
    phone: '',
    status: ShopStatus.NORMAL,
    remark: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 初始化编辑表单数据
   */
  useEffect(() => {
    if (shop) {
      setFormData({
        id: shop.id,
        unionid: shop.unionid || '',
        openid: shop.openid || '',
        accountNo: shop.accountNo || '',
        wechat: shop.wechat || '',
        avatar: shop.avatar || '',
        nickname: shop.nickname || '',
        phone: shop.phone || '',
        status: shop.status,
        remark: shop.remark || ''
      });
    } else {
      // 重置表单
      setFormData({
        unionid: '',
        openid: '',
        accountNo: '',
        wechat: '',
        avatar: '',
        nickname: '',
        phone: '',
        status: ShopStatus.NORMAL,
        remark: ''
      });
    }
    
    setError(null);
  }, [shop, isOpen]);
  
  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // 处理状态字段
    if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 必填项验证
    if (!formData.nickname && !formData.wechat) {
      setError('店铺名称或微信号至少需要填写一项');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditing && shop) {
        // 更新店铺
        response = await fetch(`/api/team/${teamCode}/shops/${shop.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        // 创建店铺
        response = await fetch(`/api/team/${teamCode}/shops`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        });
      }
      
      // 处理响应
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '操作失败');
      }
      
      // 成功处理
      onSuccess();
      onClose();
    } catch (err) {
      console.error('提交店铺数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑店铺' : '添加店铺'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 店铺名称 */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              店铺名称
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="店铺名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {/* 微信号 */}
          <div>
            <label htmlFor="wechat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              微信号
            </label>
            <input
              type="text"
              id="wechat"
              name="wechat"
              value={formData.wechat}
              onChange={handleChange}
              placeholder="微信号"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {/* 手机号 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              手机号
            </label>
            <input
              type="text"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="手机号码"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {/* 账号编号 */}
          <div>
            <label htmlFor="accountNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              账号编号
            </label>
            <input
              type="text"
              id="accountNo"
              name="accountNo"
              value={formData.accountNo}
              onChange={handleChange}
              placeholder="账号编号"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        {/* 高级信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 头像URL */}
          <div>
            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              头像URL
            </label>
            <input
              type="text"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="头像图片链接"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {/* 店铺状态 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value={ShopStatus.NORMAL}>正常</option>
              <option value={ShopStatus.DISABLED}>停用</option>
              <option value={ShopStatus.BANNED}>封禁</option>
              <option value={ShopStatus.PENDING}>待解封</option>
              <option value={ShopStatus.BACKUP}>备用</option>
              <option value={ShopStatus.OTHER}>其他</option>
            </select>
          </div>
          
          {/* unionid */}
          <div>
            <label htmlFor="unionid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              UnionID
            </label>
            <input
              type="text"
              id="unionid"
              name="unionid"
              value={formData.unionid}
              onChange={handleChange}
              placeholder="微信UnionID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          {/* openid */}
          <div>
            <label htmlFor="openid" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              OpenID
            </label>
            <input
              type="text"
              id="openid"
              name="openid"
              value={formData.openid}
              onChange={handleChange}
              placeholder="微信OpenID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        {/* 店铺备注 */}
        <div>
          <label htmlFor="remark" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            备注
          </label>
          <textarea
            id="remark"
            name="remark"
            value={formData.remark}
            onChange={handleChange}
            rows={3}
            placeholder="店铺相关备注信息"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        {/* 表单按钮 */}
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            ) : (
              isEditing ? '保存' : '创建'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
} 