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
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdFilterList, MdInventory } from 'react-icons/md';
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
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
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
   * 格式化价格显示
   */
  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return '-';
    // 确保price是数字类型
    const numericPrice = Number(price);
    if (isNaN(numericPrice)) return '-';
    return numericPrice.toFixed(2);
  };
  
  /**
   * 获取产品成本价
   */
  const getCostPrice = (product: Product): number | undefined => {
    if (!product.cost) return undefined;
    
    // 检查API返回的cost结构
    // 有些API返回 { costPrice, packagingFee, shippingFee }
    // 有些API返回 { base, packaging, shipping }
    if ('costPrice' in product.cost) {
      return product.cost.costPrice;
    } else if ((product.cost as any).base !== undefined) {
      return (product.cost as any).base;
    }
    
    return undefined;
  };
  
  /**
   * 获取销售价（即产品的主要价格）
   */
  const getSalePrice = (product: Product): number | undefined => {
    return product.price;
  };
  
  /**
   * 获取运费
   */
  const getShippingFee = (product: Product): number | undefined => {
    if (!product.cost) return undefined;
    
    // 检查API返回的cost结构
    if ('shippingFee' in product.cost) {
      return product.cost.shippingFee;
    } else if ((product.cost as any).shipping !== undefined) {
      return (product.cost as any).shipping;
    }
    
    return undefined;
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalProducts / pageSize);
  
  return (
    <div className="w-full">
      {/* 页面标题区域 */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          产品管理
        </h1>
        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          管理和查看产品数据
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
                placeholder="搜索产品名称、SKU或描述..."
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
              onClick={() => setFilterOpen(!filterOpen)}
              className={`px-3 py-2 rounded-lg flex items-center mr-2 ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } ${filterOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}`}
              title="筛选"
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
              onClick={handleAddProduct}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <MdAdd className="mr-1" />
              添加产品
            </button>
          </div>
        </div>
        
        {/* 筛选面板 */}
        {filterOpen && (
          <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <ProductFilters 
              filters={filters} 
              onChange={handleFilterChange}
              onApply={applyFilters}
              onCancel={handleClearFilters}
              suppliers={suppliers}
              brands={brands}
              categories={categories}
              availableLevels={availableLevels}
            />
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
          正在加载产品数据...
        </div>
      )}
      
      {/* 无数据提示 */}
      {!isLoading && products.length === 0 && (
        <div className={`text-center py-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <MdInventory className="mx-auto text-5xl mb-3 opacity-50" />
          <p className="text-lg">暂无产品数据</p>
          <p className="mt-1 text-sm">点击"添加产品"按钮创建新产品</p>
        </div>
      )}
      
      {/* 产品列表 */}
      {!isLoading && products.length > 0 && (
        <div className={`rounded-xl overflow-hidden shadow-sm ${isDarkMode ? 'glass-card-dark' : 'glass-card'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    产品信息
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    品牌/品类
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    价格信息
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    库存
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {products.map((product) => (
                  <tr key={product.id} className={`${isDarkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 mr-4 flex items-center justify-center">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // 图片加载失败时显示默认图标
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-gray-400 dark:text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>';
                              }}
                            />
                          ) : (
                            <span className={`text-gray-400 dark:text-gray-500`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {product.name}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            SKU: {product.sku || '-'}
                          </div>
                          {product.aliases && product.aliases.length > 0 && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              别名: {product.aliases.join(', ')}
                            </div>
                          )}
                          {product.level && (
                            <div className={`mt-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                              isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {product.level}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>品牌: {product.brand?.name || '-'}</div>
                        <div>品类: {product.categoryName || '-'}</div>
                        <div>供应商: {product.supplier?.name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div>成本价: ¥{formatPrice(getCostPrice(product))}</div>
                        <div>销售价: ¥{formatPrice(getSalePrice(product))}</div>
                        <div>运费: ¥{formatPrice(getShippingFee(product))}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {product.stock !== undefined && product.stock !== null ? (
                          <span className={product.stock > 0 
                            ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
                            : (isDarkMode ? 'text-red-400' : 'text-red-600')
                          }>
                            {product.stock}
                          </span>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-blue-600 hover:text-blue-800 transition-colors`}
                          title="编辑"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
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
                    {Math.min(currentPage * pageSize, totalProducts)}
                  </span>{' '}
                  条，共 <span className="font-medium">{totalProducts}</span> 条
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
          <div className={`p-6 rounded-lg shadow-xl max-w-md w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>确认删除</h3>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              您确定要删除产品 "{productToDelete?.name}" 吗？此操作不可撤销。
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