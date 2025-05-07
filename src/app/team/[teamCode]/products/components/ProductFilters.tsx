/**
 * 产品筛选组件
 * 作者: 阿瑞
 * 功能: 提供产品数据的筛选界面
 * 版本: 1.0.0
 */

'use client';

import React from 'react';

interface ProductFiltersProps {
  filters: {
    supplierId: string;
    brandId: string;
    categoryId: string;
    level: string;
    minPrice: string;
    maxPrice: string;
    hasStock: boolean;
  };
  onChange: (name: string, value: string | boolean) => void;
  onApply: () => void;
  onCancel: () => void;
  suppliers: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  availableLevels: string[];
}

/**
 * 产品筛选组件
 */
export default function ProductFilters({
  filters,
  onChange,
  onApply,
  onCancel,
  suppliers,
  brands,
  categories,
  availableLevels
}: ProductFiltersProps) {
  /**
   * 处理输入变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      onChange(name, (e.target as HTMLInputElement).checked);
    } else {
      onChange(name, value);
    }
  };
  
  return (
    <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 供应商筛选 */}
        <div>
          <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            供应商
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={filters.supplierId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">全部供应商</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* 品牌筛选 */}
        <div>
          <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            品牌
          </label>
          <select
            id="brandId"
            name="brandId"
            value={filters.brandId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">全部品牌</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* 品类筛选 */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            品类
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={filters.categoryId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">全部品类</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* 级别筛选 */}
        {availableLevels.length > 0 && (
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              产品级别
            </label>
            <select
              id="level"
              name="level"
              value={filters.level}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">全部级别</option>
              {availableLevels.map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* 价格区间筛选 */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最低价格
            </label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleInputChange}
              placeholder="最低价"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              最高价格
            </label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleInputChange}
              placeholder="最高价"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        {/* 库存筛选 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="hasStock"
            name="hasStock"
            checked={filters.hasStock}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="hasStock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            仅显示有库存产品
          </label>
        </div>
      </div>
      
      {/* 按钮 */}
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onApply}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
        >
          应用筛选
        </button>
      </div>
    </div>
  );
} 