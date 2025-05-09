/**
 * 客户模态框组件
 * 作者: 阿瑞
 * 功能: 提供客户信息的添加和编辑界面，支持地址解析
 * 版本: 1.2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { useAccessToken } from '@/store/userStore';
import { ThemeMode } from '@/types/enum';
import { Customer, CustomerGender, CustomerAddress } from '@/models/team/types/customer';
import { formatDate } from '@/utils/date.utils';
import Modal from '@/components/ui/Modal';

// 定义解析地址API返回的数据结构
interface ParseLocationResponse {
  province: string | null;
  city: string | null;
  county: string | null;
  detail: string | null;
  full_location: string | null;
  orig_location: string | null;
  town: string | null;
  village: string | null;
}

interface CombinedResponse {
  name: string | null;
  phone: string | null;
  address: ParseLocationResponse | null;
  error?: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

/**
 * 客户模态框组件
 */
export default function CustomerModal({ isOpen, onClose, customer, onSuccess }: CustomerModalProps) {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;

  const isEditing = !!customer;

  // 表单状态
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    gender: undefined,
    phone: '',
    wechat: '',
    address: { detail: '' },
    birthday: '',
    followDate: '',
    balance: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsingAddress, setIsParsingAddress] = useState(false);
  const [parsedMessage, setParsedMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  /**
   * 初始化编辑表单数据
   */
  useEffect(() => {
    if (customer) {
      setFormData({
        id: customer.id,
        name: customer.name,
        gender: customer.gender,
        phone: customer.phone,
        wechat: customer.wechat || '',
        address: customer.address || { detail: '' },
        // 格式化日期为YYYY-MM-DD格式
        birthday: customer.birthday ? formatDate(customer.birthday, 'YYYY-MM-DD') : '',
        followDate: customer.followDate ? formatDate(customer.followDate, 'YYYY-MM-DD') : '',
        balance: customer.balance || 0
      });
    } else {
      // 重置表单
      setFormData({
        name: '',
        gender: undefined,
        phone: '',
        wechat: '',
        address: { detail: '' },
        birthday: '',
        followDate: '',
        balance: 0
      });
    }

    setError(null);
    setParsedMessage(null);
  }, [customer, isOpen]);

  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 特殊处理地址字段
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          detail: value
        }
      }));
      return;
    }

    // 处理数字类型字段
    if (name === 'balance') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 解析地址文本，提取姓名、电话和地址信息
   */
  const handleAddressParse = async () => {
    // 获取当前地址文本
    const addressText = formData.address?.detail || '';

    if (!addressText.trim()) {
      setParsedMessage({
        type: 'error',
        text: '请输入地址信息后再进行解析'
      });
      return;
    }

    setIsParsingAddress(true);
    setParsedMessage(null);

    try {
      // 使用 fetch 发送请求到App Router格式的API端点
      const response = await fetch('/api/tools/parseAddress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: addressText }),
      });

      const data: CombinedResponse = await response.json();

      if (!response.ok) {
        setParsedMessage({
          type: 'error',
          text: data.error || '解析失败'
        });
        return;
      }

      // 检查解析结果，提示用户手动填写未解析到的字段
      const missingFields = [];
      if (!data.address?.city) {
        missingFields.push('城市');
      }
      if (!data.address?.county) {
        missingFields.push('区县');
      }

      if (missingFields.length > 0) {
        setParsedMessage({
          type: 'warning',
          text: `未能自动解析 ${missingFields.join('、')}，请手动填写`
        });
      } else {
        setParsedMessage({
          type: 'success',
          text: '地址解析完成'
        });
      }

      // 自动填充表单字段
      const newAddress: CustomerAddress = {
        province: data.address?.province || undefined,
        city: data.address?.city || undefined,
        district: data.address?.county || undefined,
        detail: data.address?.detail || '',
      };

      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name || '',
        phone: data.phone || prev.phone || '',
        address: newAddress
      }));

    } catch (error) {
      console.error('地址解析失败', error);
      setParsedMessage({
        type: 'error',
        text: '地址解析失败，请稍后重试'
      });
    } finally {
      setIsParsingAddress(false);
    }
  };

  /**
   * 表单提交处理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTeam) {
      setError('未获取到团队信息');
      return;
    }

    // 表单验证
    if (!formData.name || !formData.phone) {
      setError('请填写客户姓名和电话');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const apiUrl = isEditing
        ? `/api/team/${teamCode}/customers/${formData.id}`
        : `/api/team/${teamCode}/customers`;

      const method = isEditing ? 'PUT' : 'POST';

      // 准备请求数据
      const requestData = {
        ...formData,
        // 如果地址只有detail且为空，则设为null
        address: formData.address &&
          (!formData.address.detail && !formData.address.province &&
            !formData.address.city && !formData.address.district)
          ? null
          : formData.address
      };

      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '操作失败');
      }

      // 操作成功
      onSuccess();
      onClose();
    } catch (err) {
      console.error('客户操作失败:', err);
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 模态框尾部按钮
  const modalFooter = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onClose}
        className={`px-4 py-2 rounded-lg ${isDarkMode
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        disabled={isSubmitting}
      >
        取消
      </button>
      <button
        type="submit"
        form="customerForm"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isSubmitting}
      >
        {isSubmitting ? '提交中...' : (isEditing ? '保存' : '添加')}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑客户' : '添加客户'}
      footer={modalFooter}
      size="xl"
      isGlass={true}
      glassLevel={isDarkMode ? 'heavy' : 'medium'}
      closeOnOutsideClick={false}
    >
      <>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {parsedMessage && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${parsedMessage.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : parsedMessage.type === 'warning'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}>
            {parsedMessage.text}
          </div>
        )}

        <form id="customerForm" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* 姓名 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
            </div>

            {/* 电话 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                required
              />
            </div>

            {/* 性别 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                性别
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">未知</option>
                <option value={CustomerGender.MALE}>男</option>
                <option value={CustomerGender.FEMALE}>女</option>
              </select>
            </div>

            {/* 微信号 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                微信号
              </label>
              <input
                type="text"
                name="wechat"
                value={formData.wechat || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* 生日 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                生日
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* 加粉日期 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                加粉日期
              </label>
              <input
                type="date"
                name="followDate"
                value={formData.followDate || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            {/* 账户余额 */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                账户余额
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance || 0}
                onChange={handleChange}
                step="0.01"
                className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* 地址区域 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                详细地址
              </label>
              <button
                type="button"
                onClick={handleAddressParse}
                disabled={isParsingAddress}
                className={`text-sm px-3 py-1 rounded ${isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              >
                {isParsingAddress ? '解析中...' : '智能解析'}
              </button>
            </div>

            {/* 省市区显示区域 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                type="text" 
                name="province"
                value={formData.address?.province || ''}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    province: e.target.value
                  }
                }))}
                placeholder="省份"
                className={`px-3 py-2 rounded-lg text-sm ${isDarkMode
                  ? 'bg-gray-800/40 border-gray-700 text-gray-300'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
                } border`}
              />
              <input
                type="text"
                name="city" 
                value={formData.address?.city || ''}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    city: e.target.value
                  }
                }))}
                placeholder="城市"
                className={`px-3 py-2 rounded-lg text-sm ${isDarkMode
                  ? 'bg-gray-800/40 border-gray-700 text-gray-300'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
                } border`}
              />
              <input
                type="text"
                name="district"
                value={formData.address?.district || ''}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    district: e.target.value
                  }
                }))}
                placeholder="区县"
                className={`px-3 py-2 rounded-lg text-sm ${isDarkMode
                  ? 'bg-gray-800/40 border-gray-700 text-gray-300'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
                } border`}
              />
            </div>

            <textarea
              name="address"
              value={formData.address?.detail || ''}
              onChange={handleChange}
              rows={3}
              placeholder="输入客户完整地址，可包含姓名和电话，系统将智能识别"
              className={`w-full px-3 py-2 rounded-lg ${isDarkMode
                  ? 'bg-gray-800/60 border-gray-700 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            ></textarea>
            <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              提示：可输入包含姓名、电话的完整地址，点击"智能解析"自动识别
            </p>
          </div>
        </form>
      </>
    </Modal>
  );
}
