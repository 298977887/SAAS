/**
 * 产品管理页面
 * 作者: 阿瑞
 * 功能: 提供产品数据的展示和管理功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdFilterList } from 'react-icons/md';
import { Product } from '@/models/team/types/product';
import ProductModal from './product-modal';
import ProductFilters from './components/ProductFilters';

/**
 * 产品管理页面组件
 */
export default function ProductsPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  
  // 产品数据状态
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    supplierId: '',
    brandId: '',
    categoryId: '',
    level: '',
    minPrice: '',
    maxPrice: '',
    hasStock: false
  });
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  
  // 供应商、品牌、品类数据
  const [suppliers, setSuppliers] = useState<{id: number, name: string}[]>([]);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // 在组件加载时获取供应商、品牌和品类数据
  useEffect(() => {
    if (!accessToken || !teamCode) return;
    
    // 获取供应商列表
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(`/api/team/${teamCode}/suppliers?pageSize=100`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuppliers(data.suppliers.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (err) {
        console.error('获取供应商列表失败:', err);
      }
    };
    
    // 获取品牌列表
    const fetchBrands = async () => {
      try {
        const response = await fetch(`/api/team/${teamCode}/brands?pageSize=100`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setBrands(data.brands.map((b: any) => ({ id: b.id, name: b.name })));
        }
      } catch (err) {
        console.error('获取品牌列表失败:', err);
      }
    };
    
    // 获取品类列表
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/team/${teamCode}/categories?pageSize=100`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error('获取品类列表失败:', err);
      }
    };
    
    fetchSuppliers();
    fetchBrands();
    fetchCategories();
  }, [accessToken, teamCode]);
  
  /**
   * 获取产品列表数据
   */
  const fetchProducts = useCallback(async () => {
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
      
      // 添加筛选条件
      if (filters.supplierId) queryParams.append('supplierId', filters.supplierId);
      if (filters.brandId) queryParams.append('brandId', filters.brandId);
      if (filters.categoryId) queryParams.append('categoryId', filters.categoryId);
      if (filters.level) queryParams.append('level', filters.level);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.hasStock) queryParams.append('hasStock', 'true');
      
      const response = await fetch(`/api/team/${teamCode}/products?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取产品列表失败');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      
      // 获取可用的产品级别
      if (data.filters?.levels) {
        setAvailableLevels(data.filters.levels);
      }
    } catch (err) {
      console.error('获取产品列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword, filters]);
  
  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchProducts();
    }
  }, [accessToken, teamCode, fetchProducts]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchProducts();
  };
  
  /**
   * 处理筛选条件变更
   */
  const handleFilterChange = (name: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * 应用筛选条件
   */
  const applyFilters = () => {
    setCurrentPage(1); // 重置到第一页
    fetchProducts();
    setFilterOpen(false);
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setFilters({
      supplierId: '',
      brandId: '',
      categoryId: '',
      level: '',
      minPrice: '',
      maxPrice: '',
      hasStock: false
    });
    setCurrentPage(1);
    fetchProducts();
    setFilterOpen(false);
  };
  
  /**
   * 处理添加产品按钮点击
   */
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };
  
  /**
   * 处理编辑产品
   */
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  
  /**
   * 处理删除产品确认
   */
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };
  
  /**
   * 执行删除产品操作
   */
  const confirmDelete = async () => {
    if (!productToDelete || !teamCode) return;
    
    try {
      const response = await fetch(`/api/team/${teamCode}/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('删除产品失败');
      }
      
      // 移除已删除的产品
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setTotalProducts(prev => prev - 1);
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('删除产品失败:', err);
    }
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalProducts / pageSize);
  
  /**
   * 格式化价格显示
   */
  const formatPrice = (price: number | undefined | null): string => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };
  
  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <MdAdd size={20} />
          <span>添加产品</span>
        </button>
      </div>
      
      {/* 搜索和筛选区域 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="搜索产品名称、代码、SKU..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                搜索
              </button>
            </form>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1 px-4 py-2 border rounded ${
                Object.values(filters).some(val => val !== '' && val !== false)
                  ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                  : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
              }`}
            >
              <MdFilterList size={18} />
              <span>筛选</span>
              {Object.values(filters).some(val => val !== '' && val !== false) && (
                <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                  {Object.values(filters).filter(val => val !== '' && val !== false).length}
                </span>
              )}
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
        </div>
        
        {/* 筛选条件面板 */}
        {filterOpen && (
          <ProductFilters
            filters={filters}
            onChange={handleFilterChange}
            onApply={applyFilters}
            onCancel={() => setFilterOpen(false)}
            suppliers={suppliers}
            brands={brands}
            categories={categories}
            availableLevels={availableLevels}
          />
        )}
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* 产品列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  产品信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  库存
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  价格
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无产品数据
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mr-3">
                            <span className="text-gray-400 text-xs">无图</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </div>
                          {product.code && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              编码: {product.code}
                            </div>
                          )}
                          {product.sku && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {product.sku}
                            </div>
                          )}
                          {product.level && (
                            <div className="mt-1">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {product.level}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 dark:text-white flex flex-col gap-1">
                        {product.supplierName && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-14">供应商:</span>
                            <span>{product.supplierName}</span>
                          </div>
                        )}
                        {product.brandName && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-14">品牌:</span>
                            <span>{product.brandName}</span>
                          </div>
                        )}
                        {product.categoryName && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-14">品类:</span>
                            <span>{product.categoryName}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                        product.stock > 10
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : product.stock > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ¥{formatPrice(product.price)}
                      </div>
                      {product.cost?.base && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          成本: ¥{formatPrice(product.cost.base)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="编辑"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
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
                  {Math.min(currentPage * pageSize, totalProducts)}
                </span>{' '}
                条，共 <span className="font-medium">{totalProducts}</span> 条
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
      
      {/* 产品模态框 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSuccess={fetchProducts}
        suppliers={suppliers}
        brands={brands}
        categories={categories}
        availableLevels={availableLevels}
      />
      
      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">确认删除</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              您确定要删除产品 "{productToDelete?.name}" 吗？此操作不可撤销。
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