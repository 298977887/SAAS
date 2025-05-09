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
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { 
  MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, 
  MdFilterList, MdPhone, MdPerson, MdLocationOn, 
  MdBusiness, MdLabel
} from 'react-icons/md';
import { Supplier, SupplierStatus } from '@/models/team/types/supplier';
import SupplierModal from './supplier-modal';

/**
 * 获取供应商状态标签和颜色
 */
const getStatusInfo = (status: SupplierStatus, isDarkMode?: boolean) => {
  switch (status) {
    case SupplierStatus.NORMAL:
      return { 
        label: '启用', 
        color: isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
      };
    case SupplierStatus.DISABLED:
      return { 
        label: '停用', 
        color: isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
      };
    case SupplierStatus.EXCEPTION:
      return { 
        label: '异常', 
        color: isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
      };
    case SupplierStatus.BACKUP:
      return { 
        label: '备用', 
        color: isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
      };
    default:
      return { 
        label: '未知', 
        color: isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
      };
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
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
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
   * 格式化联系人信息
   */
  const formatContact = (contact: any) => {
    if (!contact) return { contactPerson: '-', phone: '-', address: '-' };
    
    if (typeof contact === 'string') {
      try {
        contact = JSON.parse(contact);
      } catch {
        return { contactPerson: '-', phone: '-', address: '-' };
      }
    }
    
    return {
      contactPerson: contact.contactPerson || '-',
      phone: contact.phone || '-',
      address: contact.address || '-'
    };
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalSuppliers / pageSize);
  
  return (
    <div className="w-full">
      {/* 页面标题区域 */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          供应商管理
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          管理和查看供应商资料
        </p>
      </div>
      
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
                placeholder="搜索供应商名称或联系人..."
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
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2 rounded-lg flex items-center mr-2 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${showFilters ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}`}
              title="高级筛选"
            >
              <MdFilterList className="mr-1" />
              筛选
            </button>
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
              onClick={handleAddSupplier}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <MdAdd className="mr-1" />
              添加供应商
            </button>
          </div>
        </div>
        
        {/* 高级筛选面板 */}
        {showFilters && (
          <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  状态
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={`w-full p-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">全部状态</option>
                  <option value={SupplierStatus.NORMAL.toString()}>启用</option>
                  <option value={SupplierStatus.DISABLED.toString()}>停用</option>
                  <option value={SupplierStatus.EXCEPTION.toString()}>异常</option>
                  <option value={SupplierStatus.BACKUP.toString()}>备用</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  供应商等级
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className={`w-full p-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">全部等级</option>
                  {availableLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  供应商类型
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className={`w-full p-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">全部类型</option>
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(1);
                  fetchSuppliers();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                应用筛选
              </button>
            </div>
          </div>
        )}
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
          正在加载供应商数据...
        </div>
      )}
      
      {/* 无数据提示 */}
      {!isLoading && suppliers.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <MdBusiness className="mx-auto text-5xl mb-3 opacity-50" />
          <p className="text-lg">暂无供应商数据</p>
          <p className="mt-1 text-sm">点击"添加供应商"按钮创建新供应商</p>
        </div>
      )}
      
      {/* 供应商列表 */}
      {!isLoading && suppliers.length > 0 && (
        <div className={`rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    供应商信息
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    联系方式
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    分类
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    状态
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {suppliers.map((supplier) => {
                  const contact = formatContact(supplier.contact);
                  const statusInfo = getStatusInfo(supplier.status, isDarkMode);
                  
                  return (
                    <tr key={supplier.id} className={`${isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
                          }`}>
                            <MdBusiness className={`h-6 w-6 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} />
                          </div>
                          <div className="ml-4">
                            <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {supplier.name}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ID: {supplier.id}
                            </div>
                            {supplier.order && (
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                排序: {supplier.order}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center mb-1">
                            <MdPerson className="mr-2" />
                            {contact.contactPerson}
                          </div>
                          <div className="flex items-center mb-1">
                            <MdPhone className="mr-2" />
                            {contact.phone}
                          </div>
                          <div className="flex items-center">
                            <MdLocationOn className="mr-2" />
                            {contact.address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="flex items-center mb-1">
                            <MdLabel className="mr-2" />
                            等级: {supplier.level || '-'}
                          </div>
                          <div className="flex items-center">
                            <MdLabel className="mr-2" />
                            类型: {supplier.type || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-blue-600 hover:text-blue-800 transition-colors`}
                            title="编辑"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supplier)}
                            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-600 hover:text-red-800 transition-colors`}
                            title="删除"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between border-t px-4 py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="hidden sm:block">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? `cursor-not-allowed ${isDarkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}`
                      : `${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`
                  } mr-3`}
                >
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? `cursor-not-allowed ${isDarkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}`
                      : `${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`
                  }`}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
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
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>确认删除</h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              您确定要删除供应商 "{supplierToDelete?.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition`}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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