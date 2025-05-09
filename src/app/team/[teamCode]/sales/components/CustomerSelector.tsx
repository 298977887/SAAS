/**
 * 客户选择器组件
 * 作者: 阿瑞
 * 功能: 提供客户搜索、选择和新增功能
 * 版本: 1.2.0
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerGender } from '@/models/team/types/customer';
import { MdSearch, MdPerson, MdAdd, MdEdit, MdPhone } from 'react-icons/md';
import { FaWeixin } from 'react-icons/fa';
import Modal from '@/components/ui/Modal';
import Card from '@/components/ui/Card';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';

interface CustomerSelectorProps {
  teamCode: string;
  accessToken: string;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
}

/**
 * 客户信息卡片组件
 */
const CustomerCard = ({ customer, isDarkMode = false }: { customer: Customer; isDarkMode?: boolean }) => {
  return (
    <div className="flex items-start">
      <div className={`
        flex items-center justify-center w-10 h-10 rounded-full mr-3
        ${isDarkMode ? 'bg-blue-600/30' : 'bg-blue-100'}
        text-blue-600 dark:text-blue-400
      `}>
        <MdPerson size={20} />
      </div>
      <div>
        <div className="font-medium text-gray-800 dark:text-white flex items-center">
          {customer.name}
          {customer.gender && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              customer.gender === '男' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' 
                : 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300'
            }`}>
              {customer.gender}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
          <MdPhone className="mr-1" size={14} />
          {customer.phone}
        </div>
        {customer.wechat && (
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <FaWeixin className="mr-1" size={14} />
            {customer.wechat}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 客户选择器组件
 */
const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  teamCode,
  accessToken,
  selectedCustomer,
  onSelectCustomer
}) => {
  // 主题模式
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 客户模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    gender: undefined,
    phone: '',
    wechat: '',
    address: { detail: '' },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 引用
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  /**
   * 处理点击外部关闭下拉菜单
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  /**
   * 当关键字变化时自动搜索
   */
  useEffect(() => {
    if (searchKeyword && searchKeyword.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      
      return () => clearTimeout(timer);
    }
    return () => {}; // 添加默认返回值
  }, [searchKeyword]);
  
  /**
   * 处理搜索客户
   */
  const handleSearch = async () => {
    if (!searchKeyword.trim() || !teamCode || !accessToken) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/team/${teamCode}/customers?keyword=${encodeURIComponent(searchKeyword)}&pageSize=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.customers || []);
        setIsDropdownOpen(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索客户失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  /**
   * 处理输入框变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
    
    // 如果清空输入，则关闭下拉菜单
    if (!e.target.value.trim()) {
      setIsDropdownOpen(false);
      setSearchResults([]);
    }
  };
  
  /**
   * 处理输入框点击
   */
  const handleInputClick = () => {
    // 如果已有搜索结果，则显示下拉菜单
    if (searchResults.length > 0) {
      setIsDropdownOpen(true);
    }
  };
  
  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };
  
  /**
   * 处理选择客户
   */
  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setIsDropdownOpen(false);
    setSearchKeyword('');
    setSearchResults([]);
    
    // 移除输入框焦点
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  /**
   * 处理更换客户
   */
  const handleChangeCustomer = () => {
    if (selectedCustomer) {
      // 设置搜索关键词为当前客户电话，触发搜索
      setSearchKeyword(selectedCustomer.phone);
      // 聚焦搜索框
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  /**
   * 打开新增客户模态框
   */
  const handleOpenCreateModal = () => {
    // 重置新客户表单
    setNewCustomer({
      name: '',
      gender: undefined,
      phone: '',
      wechat: '',
      address: { detail: '' },
    });
    setError(null);
    setIsModalOpen(true);
  };

  /**
   * 处理新客户表单输入变化
   */
  const handleCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 特殊处理地址字段
    if (name === 'address') {
      setNewCustomer(prev => ({
        ...prev,
        address: {
          ...prev.address,
          detail: value
        }
      }));
      return;
    }

    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 创建新客户
   */
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!newCustomer.name || !newCustomer.phone) {
      setError('请填写客户姓名和电话');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/team/${teamCode}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newCustomer)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '创建客户失败');
      }

      // 关闭模态框
      setIsModalOpen(false);
      
      // 自动选择新创建的客户
      if (result.customer) {
        onSelectCustomer(result.customer);
      }
    } catch (err) {
      console.error('创建客户失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* 客户选择卡片 */}
      <Card 
        padding="medium"
        glassEffect={isDarkMode ? "medium" : "light"}
        className="mb-4 transition-all duration-300"
        elevation="sm"
        bordered
      >
        {selectedCustomer ? (
          <div className="flex justify-between items-start">
            <CustomerCard customer={selectedCustomer} isDarkMode={isDarkMode} />
            <button
              type="button"
              onClick={handleChangeCustomer}
              className="ml-auto p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all duration-200"
              title="更换客户"
            >
              <MdEdit size={18} />
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className={`
              w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3
              ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}
            `}>
              <MdPerson className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">请选择一位客户或创建新客户</p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className={`
                flex items-center justify-center mx-auto px-5 py-2 
                ${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} 
                text-white rounded-lg shadow-sm transition-all duration-200
                backdrop-blur-md border border-white/20
                hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
              `}
            >
              <MdAdd className="mr-1.5" size={18} />
              新增客户
            </button>
          </div>
        )}
      </Card>
      
      {/* 搜索输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchKeyword}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder="搜索客户（姓名/电话）..."
          className={`
            w-full pl-10 pr-16 py-2.5 h-11 rounded-lg
            ${isDarkMode ? 'bg-slate-800/30' : 'bg-white/30'}
            backdrop-blur-md border border-white/20 dark:border-white/10
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            text-gray-800 dark:text-white
            transition-all duration-200
          `}
        />
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchKeyword.trim()}
          className={`
            absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 
            rounded-md text-sm font-medium transition-all duration-200
            ${isSearching || !searchKeyword.trim() 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : `${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} text-white`
            }
          `}
        >
          {isSearching ? (
            <div className="flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              搜索中
            </div>
          ) : '搜索'}
        </button>
      </div>
      
      {/* 搜索结果下拉菜单 */}
      {isDropdownOpen && searchResults.length > 0 && (
        <div className={`
          absolute z-10 mt-2 w-full 
          ${isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'} 
          backdrop-blur-md shadow-lg 
          border border-white/20 dark:border-white/10 
          rounded-lg max-h-60 overflow-auto
          transition-all duration-300 animate-fadeIn
        `}>
          <ul className="py-1">
            {searchResults.map(customer => (
              <li 
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className={`
                  px-4 py-2.5 
                  ${isDarkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-50'} 
                  cursor-pointer transition-colors duration-150
                  border-b border-gray-100/10 dark:border-gray-700/50 last:border-0
                `}
              >
                <CustomerCard customer={customer} isDarkMode={isDarkMode} />
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 无搜索结果提示 */}
      {isDropdownOpen && searchKeyword && searchResults.length === 0 && !isSearching && (
        <div className={`
          absolute z-10 mt-2 w-full 
          ${isDarkMode ? 'bg-slate-800/90' : 'bg-white/90'}
          backdrop-blur-md shadow-lg 
          border border-white/20 dark:border-white/10 
          rounded-lg p-4 text-center
          transition-all duration-300 animate-fadeIn
        `}>
          <p className="text-gray-500 dark:text-gray-400 mb-3">未找到匹配的客户</p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className={`
              inline-flex items-center px-4 py-2 text-sm
              ${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} 
              text-white rounded-lg transition-all duration-200
              backdrop-blur-md border border-white/20
              hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            <MdAdd className="mr-1.5" size={16} />
            创建新客户
          </button>
        </div>
      )}

      {/* 新增客户模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="创建新客户"
        size="md"
        isGlass={true}
        glassLevel={isDarkMode ? "medium" : "light"}
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50/50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-md">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 姓名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newCustomer.name || ''}
                onChange={handleCustomerFormChange}
                required
                className={`
                  w-full px-3 py-2 rounded-lg
                  ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                  backdrop-blur-sm border border-white/20 dark:border-white/10
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-gray-800 dark:text-white
                  transition-all duration-200
                `}
              />
            </div>
            
            {/* 性别 */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                性别
              </label>
              <select
                id="gender"
                name="gender"
                value={newCustomer.gender || ''}
                onChange={handleCustomerFormChange}
                className={`
                  w-full px-3 py-2 rounded-lg
                  ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                  backdrop-blur-sm border border-white/20 dark:border-white/10
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-gray-800 dark:text-white
                  transition-all duration-200
                `}
              >
                <option value="">请选择</option>
                <option value={CustomerGender.MALE}>男</option>
                <option value={CustomerGender.FEMALE}>女</option>
              </select>
            </div>
            
            {/* 手机号 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={newCustomer.phone || ''}
                onChange={handleCustomerFormChange}
                required
                className={`
                  w-full px-3 py-2 rounded-lg
                  ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                  backdrop-blur-sm border border-white/20 dark:border-white/10
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-gray-800 dark:text-white
                  transition-all duration-200
                `}
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
                value={newCustomer.wechat || ''}
                onChange={handleCustomerFormChange}
                className={`
                  w-full px-3 py-2 rounded-lg
                  ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                  backdrop-blur-sm border border-white/20 dark:border-white/10
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  text-gray-800 dark:text-white
                  transition-all duration-200
                `}
              />
            </div>
          </div>
          
          {/* 地址 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              地址
            </label>
            <textarea
              id="address"
              name="address"
              value={newCustomer.address?.detail || ''}
              onChange={handleCustomerFormChange}
              rows={2}
              className={`
                w-full px-3 py-2 rounded-lg
                ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                backdrop-blur-sm border border-white/20 dark:border-white/10
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                text-gray-800 dark:text-white
                transition-all duration-200
                resize-none
              `}
            />
          </div>
          
          {/* 按钮组 */}
          <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`
                px-4 py-2 rounded-lg
                ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                transition-all duration-200 hover:shadow
              `}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                px-4 py-2 rounded-lg text-white
                transition-all duration-200
                ${isSubmitting
                  ? 'bg-blue-400/80 cursor-not-allowed'
                  : `${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} 
                    hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`
                }
                backdrop-blur-md border border-white/20
              `}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  提交中...
                </div>
              ) : '创建客户'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerSelector; 