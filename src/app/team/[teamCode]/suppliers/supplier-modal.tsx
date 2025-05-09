/**
 * 供应商模态框组件
 * 作者: 阿瑞
 * 功能: 提供供应商信息的添加和编辑界面
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccessToken } from '@/store/userStore';
import { Supplier, SupplierStatus, SupplierContact } from '@/models/team/types/supplier';
import Modal from '@/components/ui/Modal';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSuccess: () => void;
  availableLevels: string[];
  availableTypes: string[];
}

/**
 * 供应商模态框组件
 */
export default function SupplierModal({ 
  isOpen, 
  onClose, 
  supplier, 
  onSuccess,
  availableLevels,
  availableTypes
}: SupplierModalProps) {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  
  const isEditing = !!supplier;
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: '',
    order: 0,
    contact: {
      contactPerson: '',
      phone: '',
      address: ''
    },
    status: SupplierStatus.NORMAL,
    level: '',
    type: '',
    remark: ''
  });
  
  // 新选项输入状态
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 初始化编辑表单数据
   */
  useEffect(() => {
    if (supplier) {
      // 处理联系方式
      let contactObj: SupplierContact = { 
        contactPerson: '', 
        phone: '', 
        address: '' 
      };
      
      if (supplier.contact) {
        if (typeof supplier.contact === 'string') {
          try {
            contactObj = JSON.parse(supplier.contact);
          } catch (e) {
            console.error('解析联系方式JSON失败:', e);
          }
        } else {
          contactObj = supplier.contact;
        }
      }
      
      setFormData({
        id: supplier.id,
        name: supplier.name,
        order: supplier.order,
        contact: contactObj,
        status: supplier.status,
        level: supplier.level || '',
        type: supplier.type || '',
        remark: supplier.remark || ''
      });
    } else {
      // 重置表单
      setFormData({
        name: '',
        order: 0,
        contact: {
          contactPerson: '',
          phone: '',
          address: ''
        },
        status: SupplierStatus.NORMAL,
        level: '',
        type: '',
        remark: ''
      });
    }
    setError(null);
  }, [supplier, isOpen]);
  
  /**
   * 处理表单输入变化
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // 处理联系方式字段
    if (name.startsWith('contact.')) {
      const contactField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [contactField]: value
        }
      }));
      return;
    }
    
    // 处理数字类型字段
    if (name === 'order') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10)
      }));
      return;
    }
    
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
    
    // 基本验证
    if (!formData.name) {
      setError('供应商名称为必填项');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditing && supplier) {
        // 更新供应商
        response = await fetch(`/api/team/${teamCode}/suppliers/${supplier.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        // 创建供应商
        response = await fetch(`/api/team/${teamCode}/suppliers`, {
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
      console.error('提交供应商数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑供应商' : '添加供应商'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 供应商名称 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              供应商名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          
          {/* 显示顺序 */}
          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              显示顺序
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">数字越小排序越靠前</p>
          </div>
        </div>
        
        {/* 联系方式 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">联系方式</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 联系人 */}
            <div>
              <label htmlFor="contact.contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                联系人
              </label>
              <input
                type="text"
                id="contact.contactPerson"
                name="contact.contactPerson"
                value={formData.contact?.contactPerson || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            {/* 联系电话 */}
            <div>
              <label htmlFor="contact.phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                联系电话
              </label>
              <input
                type="text"
                id="contact.phone"
                name="contact.phone"
                value={formData.contact?.phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {/* 地址 */}
          <div className="mt-3">
            <label htmlFor="contact.address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              地址
            </label>
            <input
              type="text"
              id="contact.address"
              name="contact.address"
              value={formData.contact?.address || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 状态 */}
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
              <option value={SupplierStatus.NORMAL}>启用</option>
              <option value={SupplierStatus.DISABLED}>停用</option>
              <option value={SupplierStatus.EXCEPTION}>异常</option>
              <option value={SupplierStatus.BACKUP}>备用</option>
            </select>
          </div>
          
          {/* 级别 */}
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              级别
            </label>
            <div className="flex space-x-2">
              <select
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">选择级别</option>
                {availableLevels.map((level, index) => (
                  <option key={index} value={level}>{level}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const customLevel = prompt('请输入自定义级别');
                  if (customLevel && customLevel.trim()) {
                    setFormData(prev => ({ ...prev, level: customLevel.trim() }));
                  }
                }}
                className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                自定义
              </button>
            </div>
          </div>
        </div>
        
        {/* 类型 */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            类型
          </label>
          <div className="flex space-x-2">
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">选择类型</option>
              {availableTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const customType = prompt('请输入自定义类型');
                if (customType && customType.trim()) {
                  setFormData(prev => ({ ...prev, type: customType.trim() }));
                }
              }}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              自定义
            </button>
          </div>
        </div>
        
        {/* 备注 */}
        <div>
          <label htmlFor="remark" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            备注
          </label>
          <textarea
            id="remark"
            name="remark"
            value={formData.remark || ''}
            onChange={handleChange}
            rows={3}
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