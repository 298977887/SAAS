/**
 * 品牌管理页面
 * 作者: 阿瑞
 * 功能: 提供品牌数据的展示和管理功能
 * 版本: 1.1.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdLabel, MdSortByAlpha } from 'react-icons/md';
import { Brand } from '@/models/team/types/brand';
import BrandModal from './brand-modal';

/**
 * 品牌管理页面组件
 */
export default function BrandsPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 品牌数据状态
  const [brands, setBrands] = useState<Brand[]>([]);
  const [totalBrands, setTotalBrands] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  
  /**
   * 获取品牌列表数据
   */
  const fetchBrands = useCallback(async () => {
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
      
      const response = await fetch(`/api/team/${teamCode}/brands?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取品牌列表失败');
      }
      
      const data = await response.json();
      setBrands(data.brands || []);
      setTotalBrands(data.total || 0);
    } catch (err) {
      console.error('获取品牌列表失败:', err);
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
      fetchBrands();
    }
  }, [accessToken, teamCode, fetchBrands]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchBrands();
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setCurrentPage(1);
    fetchBrands();
  };
  
  /**
   * 处理添加品牌按钮点击
   */
  const handleAddBrand = () => {
    setSelectedBrand(null);
    setIsModalOpen(true);
  };
  
  /**
   * 处理编辑品牌
   */
  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };
  
  /**
   * 处理删除品牌确认
   */
  const handleDeleteClick = (brand: Brand) => {
    setBrandToDelete(brand);
    setShowDeleteConfirm(true);
  };
  
  /**
   * 执行删除品牌操作
   */
  const confirmDelete = async () => {
    if (!brandToDelete || !teamCode) return;
    
    try {
      const response = await fetch(`/api/team/${teamCode}/brands/${brandToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除品牌失败');
      }
      
      // 移除已删除的品牌
      setBrands(prev => prev.filter(b => b.id !== brandToDelete.id));
      setTotalBrands(prev => prev - 1);
      setShowDeleteConfirm(false);
      setBrandToDelete(null);
    } catch (err) {
      console.error('删除品牌失败:', err);
    }
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalBrands / pageSize);
  
  return (
    <div className="w-full">
      {/* 页面标题区域 */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          品牌管理
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          管理和查看产品品牌资料
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
                placeholder="搜索品牌名称或描述..."
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
              onClick={handleAddBrand}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <MdAdd className="mr-1" />
              添加品牌
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
          正在加载品牌数据...
        </div>
      )}
      
      {/* 无数据提示 */}
      {!isLoading && brands.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <MdLabel className="mx-auto text-5xl mb-3 opacity-50" />
          <p className="text-lg">暂无品牌数据</p>
          <p className="mt-1 text-sm">点击"添加品牌"按钮创建新品牌</p>
        </div>
      )}
      
      {/* 品牌列表 */}
      {!isLoading && brands.length > 0 && (
        <div className={`rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    ID/排序
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    品牌名称
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    描述
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {brands.map((brand) => (
                  <tr key={brand.id} className={`${isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        #{brand.id}
                      </div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        排序: {brand.order}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                        }`}>
                          <MdSortByAlpha className={`h-6 w-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                        </div>
                        <div className="ml-4">
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {brand.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} max-w-xs truncate`}>
                        {brand.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditBrand(brand)}
                          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-blue-600 hover:text-blue-800 transition-colors`}
                          title="编辑"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(brand)}
                          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-600 hover:text-red-800 transition-colors`}
                          title="删除"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    {Math.min(currentPage * pageSize, totalBrands)}
                  </span>{' '}
                  条，共 <span className="font-medium">{totalBrands}</span> 条
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
      
      {/* 品牌模态框 */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brand={selectedBrand}
        onSuccess={fetchBrands}
      />
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>确认删除</h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              您确定要删除品牌 &quot;{brandToDelete?.name}&quot; 吗？此操作不可撤销。
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