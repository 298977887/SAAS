/**
 * 产品选择器组件
 * 作者: 阿瑞
 * 功能: 提供产品搜索和选择功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/models/team/types/product';
import { MdSearch, MdShoppingBag } from 'react-icons/md';

interface ProductSelectorProps {
  teamCode: string;
  accessToken: string;
  selectedProduct: Product | null;
  onSelectProduct: (product: Product) => void;
}

/**
 * 产品选择器组件实现
 */
const ProductSelector = ({
  teamCode,
  accessToken,
  selectedProduct,
  onSelectProduct
}: ProductSelectorProps) => {
  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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
   * 处理搜索产品
   */
  const handleSearch = async () => {
    if (!searchKeyword.trim() || !teamCode || !accessToken) return;
    
    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/team/${teamCode}/products?keyword=${encodeURIComponent(searchKeyword)}&pageSize=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.products || []);
        setIsDropdownOpen(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索产品失败:', error);
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
   * 处理选择产品
   */
  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product);
    setIsDropdownOpen(false);
    
    // 移除输入框焦点
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };
  
  /**
   * 格式化价格显示
   */
  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return "0.00";
    // 确保price是数字类型
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    // 检查是否为有效数字
    if (isNaN(numPrice)) return "0.00";
    return numPrice.toFixed(2);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* 已选择的产品显示 */}
      {selectedProduct && (
        <div className="mb-2 p-2 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-md flex items-center">
          <MdShoppingBag className="text-green-500 mr-2" size={20} />
          <div className="flex-1">
            <div className="font-medium text-gray-800 dark:text-white">
              {selectedProduct.name}
              {selectedProduct.brand?.name && (
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  ({selectedProduct.brand.name})
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-300 flex items-center justify-between">
              <span>
                {selectedProduct.code && `编码: ${selectedProduct.code}`}
                {selectedProduct.sku && !selectedProduct.code && `SKU: ${selectedProduct.sku}`}
              </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                ¥{formatPrice(selectedProduct.price)}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 搜索输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchKeyword}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={selectedProduct ? "更换产品..." : "搜索产品..."}
          className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchKeyword.trim()}
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs rounded ${
            isSearching || !searchKeyword.trim() 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isSearching ? '...' : '搜索'}
        </button>
      </div>
      
      {/* 搜索结果下拉菜单 */}
      {isDropdownOpen && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md max-h-60 overflow-auto">
          <ul>
            {searchResults.map(product => (
              <li 
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="font-medium text-gray-800 dark:text-white flex items-center justify-between">
                  <span>
                    {product.name}
                    {product.brand?.name && (
                      <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                        ({product.brand.name})
                      </span>
                    )}
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    ¥{formatPrice(product.price)}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-300 flex justify-between">
                  <span>
                    {product.code && `编码: ${product.code}`}
                    {product.sku && !product.code && `SKU: ${product.sku}`}
                  </span>
                  <span>
                    {product.stock > 0 ? `库存: ${product.stock}` : '无库存'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 无搜索结果提示 */}
      {isDropdownOpen && searchKeyword && searchResults.length === 0 && !isSearching && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-4 text-center text-gray-500 dark:text-gray-400">
          未找到匹配的产品
        </div>
      )}
    </div>
  );
}

export default ProductSelector; 