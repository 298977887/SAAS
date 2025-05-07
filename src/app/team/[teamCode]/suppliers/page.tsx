/**
 * 供应商管理页面
 * 作者: 阿瑞
 * 功能: 提供供应商数据的展示和管理功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { 
  MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, 
  MdFilterList, MdPhone, MdPerson, MdLocationOn 
} from 'react-icons/md';
import { Supplier, SupplierStatus } from '@/models/team/types/supplier';
import SupplierModal from './supplier-modal';

/**
 * 获取供应商状态标签和颜色
 */
const getStatusInfo = (status: SupplierStatus) => {
  switch (status) {
    case SupplierStatus.ENABLED:
      return { label: '启用', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
    case SupplierStatus.DISABLED:
      return { label: '停用', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    case SupplierStatus.ABNORMAL:
      return { label: '异常', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
    case SupplierStatus.STANDBY:
      return { label: '备用', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
    default:
      return { label: '未知', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
  }
};

/**
 * 供应商管理页面组件
 */
export default function SuppliersPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  
  // 供应商数据状态
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 可用的筛选选项
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  
  /**
   * 获取供应商列表数据
   */
  const fetchSuppliers = useCallback(async () => {
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
      if (selectedStatus) queryParams.append('status', selectedStatus);
      if (selectedLevel) queryParams.append('level', selectedLevel);
      if (selectedType) queryParams.append('type', selectedType);
      
      const response = await fetch(`/api/team/${teamCode}/suppliers?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取供应商列表失败');
      }
      
      const data = await response.json();
      setSuppliers(data.suppliers || []);
      setTotalSuppliers(data.total || 0);
      
      // 更新可用的筛选选项
      if (data.filters) {
        if (data.filters.levels) setAvailableLevels(data.filters.levels);
        if (data.filters.types) setAvailableTypes(data.filters.types);
      }
    } catch (err) {
      console.error('获取供应商列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword, selectedStatus, selectedLevel, selectedType]);
  
  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchSuppliers();
    }
  }, [accessToken, teamCode, fetchSuppliers]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchSuppliers();
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedStatus('');
    setSelectedLevel('');
    setSelectedType('');
    setCurrentPage(1);
    fetchSuppliers();
  };
  
  /**
   * 处理添加供应商按钮点击
   */
  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };
  
  /**
   * 处理编辑供应商
   */
  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };
  
  /**
   * 处理删除供应商确认
   */
  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteConfirm(true);
  };
  
  /**
   * 执行删除供应商操作
   */
  const confirmDelete = async () => {
    if (!supplierToDelete || !teamCode) return;
    
    try {
      const response = await fetch(`/api/team/${teamCode}/suppliers/${supplierToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除供应商失败');
      }
      
      // 移除已删除的供应商
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
      setTotalSuppliers(prev => prev - 1);
      setShowDeleteConfirm(false);
      setSupplierToDelete(null);
    } catch (err) {
      console.error('删除供应商失败:', err);
    }
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalSuppliers / pageSize);
  
  /**
   * 格式化联系方式显示
   */
  const formatContact = (contact: any) => {
    if (!contact) return { phone: '-', contactPerson: '-', address: '-' };
    
    try {
      // 如果是字符串形式的JSON，先解析
      let contactObj = contact;
      if (typeof contact === 'string') {
        try {
          contactObj = JSON.parse(contact);
        } catch {
          return { phone: '-', contactPerson: '-', address: '-' };
        }
      }
      
      return {
        phone: contactObj.phone || '-',
        contactPerson: contactObj.contactPerson || '-',
        address: contactObj.address || '-'
      };
    } catch (error) {
      console.error('格式化联系方式出错:', error);
      return { phone: '-', contactPerson: '-', address: '-' };
    }
  };
  
  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">供应商管理</h1>
        <button
          onClick={handleAddSupplier}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <MdAdd size={20} />
          <span>添加供应商</span>
        </button>
      </div>
      
      {/* 搜索和筛选区域 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索供应商名称、联系人或电话..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              <MdFilterList size={18} />
              <span>筛选</span>
            </button>
            
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
        
        {/* 高级筛选 */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                状态
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">全部状态</option>
                <option value={SupplierStatus.ENABLED}>启用</option>
                <option value={SupplierStatus.DISABLED}>停用</option>
                <option value={SupplierStatus.ABNORMAL}>异常</option>
                <option value={SupplierStatus.STANDBY}>备用</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                级别
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">全部级别</option>
                {availableLevels.map((level, index) => (
                  <option key={index} value={level}>{level}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                类型
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">全部类型</option>
                {availableTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* 供应商列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID/排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  供应商名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  联系方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  级别/类型
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
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无供应商数据
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => {
                  const contactInfo = formatContact(supplier.contact);
                  const statusInfo = getStatusInfo(supplier.status);
                  
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">#{supplier.id}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">排序: {supplier.order}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {supplier.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MdPerson className="mr-1" size={16} />
                            <span>{contactInfo.contactPerson}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MdPhone className="mr-1" size={16} />
                            <span>{contactInfo.phone}</span>
                          </div>
                          <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                            <MdLocationOn className="mr-1 mt-0.5" size={16} />
                            <span className="truncate max-w-xs">{contactInfo.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {supplier.level ? `级别: ${supplier.level}` : '-'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {supplier.type ? `类型: ${supplier.type}` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="编辑"
                          >
                            <MdEdit size={20} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supplier)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="删除"
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
                  {Math.min(currentPage * pageSize, totalSuppliers)}
                </span>{' '}
                条，共 <span className="font-medium">{totalSuppliers}</span> 条
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
      
      {/* 供应商模态框 */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
        availableLevels={availableLevels}
        availableTypes={availableTypes}
      />
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">确认删除</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              您确定要删除供应商 "{supplierToDelete?.name}" 吗？此操作不可撤销，相关联的品类关联也将被删除。
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