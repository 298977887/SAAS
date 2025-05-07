/**
 * 客户管理页面
 * 作者: 阿瑞
 * 功能: 提供客户数据的展示和管理功能
 * 版本: 1.2.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { useAccessToken } from '@/store/userStore';
import { ThemeMode } from '@/types/enum';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdPerson, MdLocationOn, MdPhone, MdCalendarMonth } from 'react-icons/md';
import { FaWeixin } from 'react-icons/fa';
import CustomerModal from './customer-modal';
import CustomerAnalytics from './components/CustomerAnalytics';
import { Customer } from '@/models/team/types/customer';
import { formatDate, isValidDate } from '@/utils';

/**
 * 客户管理页面组件
 */
export default function CustomersPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 客户数据状态
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  /**
   * 获取客户列表数据
   */
  const fetchCustomers = useCallback(async () => {
    if (!currentTeam || !teamCode) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 构建查询参数
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString()
      });
      
      if (searchKeyword) queryParams.append('keyword', searchKeyword);
      
      const response = await fetch(`/api/team/${teamCode}/customers?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取客户列表失败');
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
      setTotalCustomers(data.total || 0);
    } catch (err) {
      console.error('获取客户列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword]);
  
  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchCustomers();
    }
  }, [accessToken, teamCode, fetchCustomers]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchCustomers();
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setCurrentPage(1);
    fetchCustomers();
  };
  
  /**
   * 处理添加客户按钮点击
   */
  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };
  
  /**
   * 处理编辑客户
   */
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };
  
  /**
   * 处理删除客户确认
   */
  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirm(true);
  };
  
  /**
   * 执行删除客户操作
   */
  const confirmDelete = async () => {
    if (!customerToDelete || !teamCode) return;
    
    try {
      const response = await fetch(`/api/team/${teamCode}/customers/${customerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除客户失败');
      }
      
      // 移除已删除的客户
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete.id));
      setTotalCustomers(prev => prev - 1);
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('删除客户失败:', err);
    }
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalCustomers / pageSize);
  
  /**
   * 处理地址显示
   * 将JSON格式的地址转换为更易读的格式
   */
  const formatAddress = (address: any) => {
    if (!address) return '-';
    
    try {
      // 如果是字符串形式的JSON，先解析
      if (typeof address === 'string') {
        try {
          address = JSON.parse(address);
        } catch {
          // 如果解析失败，直接返回原字符串
          return address || '-';
        }
      }
      
      // 提取地址各部分
      if (typeof address === 'object') {
        const parts = [];
        if (address.province) parts.push(address.province);
        if (address.city) parts.push(address.city);
        if (address.district) parts.push(address.district);
        if (address.detail) parts.push(address.detail);
        
        if (parts.length > 0) {
          return parts.join(' ');
        }
      }
      
      // 兜底返回
      return address.detail || '-';
    } catch (error) {
      console.error('格式化地址出错:', error);
      return '-';
    }
  };
  
  /**
   * 检查日期是否在本月
   */
  const isCurrentMonth = (dateStr: string | null | undefined): boolean => {
    if (!dateStr || !isValidDate(dateStr)) return false;
    
    const date = new Date(dateStr);
    const now = new Date();
    
    return date.getMonth() === now.getMonth() && 
           date.getFullYear() === now.getFullYear();
  };
  
  /**
   * 检查日期是否即将到来(未来7天内)
   */
  const isUpcoming = (dateStr: string | null | undefined): boolean => {
    if (!dateStr || !isValidDate(dateStr)) return false;
    
    const date = new Date(dateStr);
    const now = new Date();
    
    // 重置年份为当前年份，只比较月和日
    date.setFullYear(now.getFullYear());
    
    // 如果日期已经过去了当前日期，设置为下一年
    if (date < now) {
      date.setFullYear(now.getFullYear() + 1);
    }
    
    // 计算日期差
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays < 7;
  };
  
  /**
   * 格式化用户友好的日期
   */
  const formatFriendlyDate = (dateStr: string | undefined | null): string => {
    if (!dateStr || !isValidDate(dateStr)) return '-';
    return formatDate(dateStr, 'YYYY-MM-DD');
  };
  
  // 格式化数字，确保数字类型安全
  const formatNumber = (value: any): string => {
    if (value === undefined || value === null) return '0.00';
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };
  
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          客户管理
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          管理和查看团队的所有客户数据
        </p>
      </div>
      
      {/* 客户数据分析组件 */}
      <CustomerAnalytics className="mb-6" />
      
      {/* 搜索区域 */}
      <div className={`mb-6 p-4 rounded-xl shadow-sm ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* 搜索表单 */}
          <form onSubmit={handleSearch} className="flex flex-1">
            <div className="relative flex-grow mr-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </div>
              <input
                type="text"
                placeholder="搜索客户姓名、电话或微信..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-800/60 border-gray-700 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <MdSearch className="mr-1" />
              搜索
            </button>
          </form>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className={`px-3 py-2 rounded-lg flex items-center ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <MdRefresh className="mr-1" />
              重置
            </button>
            <button
              type="button"
              onClick={handleAddCustomer}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <MdAdd className="mr-1" />
              添加客户
            </button>
          </div>
        </div>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
      
      {/* 加载中提示 */}
      {isLoading && (
        <div className={`flex justify-center items-center py-12 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          正在加载客户数据...
        </div>
      )}
      
      {/* 无数据提示 */}
      {!isLoading && customers.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <MdPerson className="mx-auto text-5xl mb-3 opacity-50" />
          <p className="text-lg">暂无客户数据</p>
          <p className="mt-1 text-sm">点击"添加客户"按钮创建新客户</p>
        </div>
      )}
      
      {/* 客户列表 - 表格布局 */}
      {!isLoading && customers.length > 0 && (
        <div className={`rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    客户信息
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    联系方式
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    地址
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    重要日期
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    余额
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {customers.map(customer => (
                  <tr key={customer.id} className={`${isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                    {/* 客户信息 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                        }`}>
                          <MdPerson className={`h-6 w-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        <div className="ml-4">
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {customer.name}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {customer.gender || '未设置性别'}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* 联系方式 */}
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-1">
                        <MdPhone className={`mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>
                          {customer.phone}
                        </span>
                      </div>
                      {customer.wechat && (
                        <div className="flex items-start space-x-1 mt-1">
                          <FaWeixin className={`mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {customer.wechat}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* 地址 */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs overflow-hidden">
                        <div className="flex items-start space-x-1">
                          <MdLocationOn className={`mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                            {formatAddress(customer.address)}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    {/* 重要日期 */}
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              生日：{formatFriendlyDate(customer.birthday)}
                            </span>
                            {customer.birthday && isCurrentMonth(customer.birthday) && (
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                isDarkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-700'
                              }`}>
                                本月生日
                              </span>
                            )}
                            {customer.birthday && isUpcoming(customer.birthday) && (
                              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                              }`}>
                                即将过生日
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {customer.followDate && (
                          <div className="flex items-center space-x-1">
                            <MdCalendarMonth className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              加粉：{formatFriendlyDate(customer.followDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 余额 */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex px-2.5 py-1 rounded-full text-sm ${
                        customer.balance > 0 
                          ? isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                          : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                      }`}>
                        ¥ {formatNumber(customer.balance)}
                      </div>
                    </td>
                    
                    {/* 操作按钮 */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className={`px-3 py-1 mr-2 rounded ${
                          isDarkMode 
                            ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        <MdEdit className="inline-block mr-1" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteClick(customer)}
                        className={`px-3 py-1 rounded ${
                          isDarkMode 
                            ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <MdDelete className="inline-block mr-1" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 分页控件 */}
          {totalPages > 0 && (
            <div className={`px-6 py-4 flex items-center justify-between border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                共 {totalCustomers} 位客户
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded ${
                    currentPage === 1
                      ? isDarkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // 显示当前页附近的页码
                  let pageNum = currentPage;
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  // 确保页码在有效范围内
                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded ${
                    currentPage === totalPages
                      ? isDarkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 客户模态框 */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
      
      {/* 删除确认框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className={`relative z-10 w-full max-w-md mx-auto p-6 rounded-xl ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              确认删除
            </h3>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              确定要删除客户 "{customerToDelete?.name}" 吗？此操作不可撤销。
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
