/**
 * 支付平台管理页面
 * 作者: 阿瑞
 * 功能: 提供支付平台数据的展示和管理功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdFilterList } from 'react-icons/md';
import { PaymentPlatform, PaymentPlatformStatus } from '@/models/team/types/payment-platform';
import PaymentPlatformModal from './payment-platform-modal';

/**
 * 获取支付平台状态标签
 */
const getStatusLabel = (status: PaymentPlatformStatus): string => {
  switch (status) {
    case PaymentPlatformStatus.DISABLED:
      return '停用';
    case PaymentPlatformStatus.ACTIVE:
      return '正常';
    case PaymentPlatformStatus.STANDBY:
      return '备用';
    case PaymentPlatformStatus.OTHER:
      return '其他';
    default:
      return '未知';
  }
};

/**
 * 获取支付平台状态类名
 */
const getStatusClassName = (status: PaymentPlatformStatus): string => {
  switch (status) {
    case PaymentPlatformStatus.DISABLED:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case PaymentPlatformStatus.ACTIVE:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case PaymentPlatformStatus.STANDBY:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case PaymentPlatformStatus.OTHER:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

/**
 * 支付平台管理页面组件
 */
export default function PaymentPlatformsPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  
  // 支付平台数据状态
  const [platforms, setPlatforms] = useState<PaymentPlatform[]>([]);
  const [totalPlatforms, setTotalPlatforms] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PaymentPlatform | null>(null);
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<PaymentPlatform | null>(null);
  
  /**
   * 获取支付平台列表数据
   */
  const fetchPlatforms = useCallback(async () => {
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
      if (statusFilter) queryParams.append('status', statusFilter);
      
      const response = await fetch(`/api/team/${teamCode}/payment-platforms?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取支付平台列表失败');
      }
      
      const data = await response.json();
      setPlatforms(data.paymentPlatforms || []);
      setTotalPlatforms(data.total || 0);
    } catch (err) {
      console.error('获取支付平台列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword, statusFilter]);
  
  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchPlatforms();
    }
  }, [accessToken, teamCode, fetchPlatforms]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchPlatforms();
  };
  
  /**
   * 处理状态筛选变更
   */
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // 重置到第一页
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchPlatforms();
  };
  
  /**
   * 处理添加支付平台按钮点击
   */
  const handleAddPlatform = () => {
    setSelectedPlatform(null);
    setIsModalOpen(true);
  };
  
  /**
   * 处理编辑支付平台
   */
  const handleEditPlatform = (platform: PaymentPlatform) => {
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  };
  
  /**
   * 处理删除支付平台确认
   */
  const handleDeleteClick = (platform: PaymentPlatform) => {
    setPlatformToDelete(platform);
    setShowDeleteConfirm(true);
  };
  
  /**
   * 执行删除支付平台操作
   */
  const confirmDelete = async () => {
    if (!platformToDelete || !teamCode) return;
    
    try {
      const response = await fetch(`/api/team/${teamCode}/payment-platforms/${platformToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除支付平台失败');
      }
      
      // 移除已删除的支付平台
      setPlatforms(prev => prev.filter(p => p.id !== platformToDelete.id));
      setTotalPlatforms(prev => prev - 1);
      setShowDeleteConfirm(false);
      setPlatformToDelete(null);
    } catch (err) {
      console.error('删除支付平台失败:', err);
    }
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalPlatforms / pageSize);
  
  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">支付平台管理</h1>
        <button
          onClick={handleAddPlatform}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <MdAdd size={20} />
          <span>添加支付平台</span>
        </button>
      </div>
      
      {/* 搜索和筛选区域 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索平台名称或描述..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="appearance-none w-full pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">全部状态</option>
                <option value={PaymentPlatformStatus.ACTIVE}>正常</option>
                <option value={PaymentPlatformStatus.DISABLED}>停用</option>
                <option value={PaymentPlatformStatus.STANDBY}>备用</option>
                <option value={PaymentPlatformStatus.OTHER}>其他</option>
              </select>
              <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              搜索
            </button>
            
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              <MdRefresh size={18} />
              <span>重置</span>
            </button>
          </div>
        </form>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* 支付平台列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  平台名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : platforms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无支付平台数据
                  </td>
                </tr>
              ) : (
                platforms.map((platform) => (
                  <tr key={platform.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {platform.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {platform.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {platform.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {platform.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClassName(platform.status)}`}>
                        {getStatusLabel(platform.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditPlatform(platform)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="编辑"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(platform)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="删除"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                显示第 <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> 至{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, totalPlatforms)}
                </span>{' '}
                条，共 <span className="font-medium">{totalPlatforms}</span> 条
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 ${
                  currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                } mr-3`}
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 ${
                  currentPage === totalPages
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 支付平台模态框 */}
      <PaymentPlatformModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platform={selectedPlatform}
        onSuccess={fetchPlatforms}
      />
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">确认删除</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              您确定要删除支付平台 "{platformToDelete?.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
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