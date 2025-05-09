/**
 * 产品模态框组件
 * 作者: 阿瑞
 * 功能: 提供产品信息的添加和编辑界面
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccessToken } from '@/store/userStore';
import { Product } from '@/models/team/types/product';
import Modal from '@/components/ui/Modal';

// 定义内部使用的成本结构接口，确保与API一致
interface ProductCostData {
  costPrice?: number;
  packagingFee?: number;
  shippingFee?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess: () => void;
  suppliers: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  availableLevels: string[];
}

/**
 * 产品模态框组件
 */
export default function ProductModal({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess,
  suppliers,
  brands,
  categories,
  availableLevels
}: ProductModalProps) {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const accessToken = useAccessToken();
  const isEditing = !!product;
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    supplierId: undefined,
    brandId: undefined,
    categoryId: undefined,
    description: '',
    code: '',
    image: '',
    sku: '',
    aliases: [],
    level: '',
    cost: { costPrice: 0, packagingFee: 0, shippingFee: 0 },
    price: 0,
    stock: 0
  });
  
  // 别名输入字段
  const [aliasInput, setAliasInput] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 初始化编辑表单数据
   */
  useEffect(() => {
    if (product) {
      // 确保cost字段使用正确的结构
      let normalizedCost: ProductCostData = { costPrice: 0, packagingFee: 0, shippingFee: 0 };
      
      if (product.cost) {
        // 处理可能存在的不同cost字段结构
        if ('costPrice' in product.cost) {
          normalizedCost = {
            costPrice: product.cost.costPrice,
            packagingFee: product.cost.packagingFee,
            shippingFee: product.cost.shippingFee
          };
        } else if ((product.cost as any).base !== undefined) {
          normalizedCost = {
            costPrice: (product.cost as any).base,
            packagingFee: (product.cost as any).packaging,
            shippingFee: (product.cost as any).shipping
          };
        }
      }
      
      setFormData({
        id: product.id,
        name: product.name,
        supplierId: product.supplierId,
        brandId: product.brandId,
        categoryId: product.categoryId,
        description: product.description || '',
        code: product.code || '',
        image: product.image || '',
        sku: product.sku || '',
        aliases: product.aliases || [],
        level: product.level || '',
        cost: normalizedCost,
        price: product.price,
        stock: product.stock
      });
    } else {
      // 重置表单
      setFormData({
        name: '',
        supplierId: undefined,
        brandId: undefined,
        categoryId: undefined,
        description: '',
        code: '',
        image: '',
        sku: '',
        aliases: [],
        level: '',
        cost: { costPrice: 0, packagingFee: 0, shippingFee: 0 },
        price: 0,
        stock: 0
      });
    }
    
    setAliasInput('');
    setError(null);
  }, [product, isOpen]);
  
  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // 处理数字类型字段
    if (name === 'price' || name === 'stock') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : type === 'number' ? parseFloat(value) : parseInt(value, 10)
      }));
      return;
    }
    
    // 处理下拉选择ID字段
    if (name === 'supplierId' || name === 'brandId' || name === 'categoryId') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseInt(value, 10) : undefined
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * 处理成本字段变更
   */
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const costField = name.split('.')[1]; // 例如 cost.costPrice -> costPrice
    
    let apiFieldName = costField;
    
    // 映射字段名称，保持与API一致
    if (costField === 'base') apiFieldName = 'costPrice';
    if (costField === 'packaging') apiFieldName = 'packagingFee';
    if (costField === 'shipping') apiFieldName = 'shippingFee';
    
    if (apiFieldName) {
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost as ProductCostData,
          [apiFieldName]: value === '' ? 0 : parseFloat(value)
        }
      }));
    }
  };
  
  /**
   * 添加产品别名
   */
  const handleAddAlias = () => {
    if (aliasInput.trim() && !formData.aliases?.includes(aliasInput.trim())) {
      setFormData(prev => ({
        ...prev,
        aliases: [...(prev.aliases || []), aliasInput.trim()]
      }));
      setAliasInput('');
    }
  };
  
  /**
   * 删除产品别名
   */
  const handleRemoveAlias = (alias: string) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases?.filter(a => a !== alias) || []
    }));
  };
  
  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 基本验证
    if (!formData.name) {
      setError('产品名称为必填项');
      return;
    }
    
    if (formData.price === undefined || formData.price < 0) {
      setError('产品价格必须大于或等于0');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditing && product) {
        // 更新产品
        response = await fetch(`/api/team/${teamCode}/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        });
      } else {
        // 创建产品
        response = await fetch(`/api/team/${teamCode}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        });
      }
      
      // 处理响应
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '操作失败');
      }
      
      // 成功处理
      onSuccess();
      onClose();
    } catch (err) {
      console.error('提交产品数据失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '编辑产品' : '添加产品'}
      size="full" 
      width="85%"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧：基本信息和其他字段 */}
          <div className="lg:col-span-3 space-y-4">
            {/* 基本信息区域 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">基本信息</h3>
              
              {/* 第一行：产品名称、SKU、产品代码 */}
              <div className="grid grid-cols-12 gap-4 mb-4">
                {/* 产品名称 - 占据更宽空间 */}
                <div className="col-span-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    产品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
                
                {/* SKU */}
                <div className="col-span-3">
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {/* 产品代码 */}
                <div className="col-span-3">
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    产品代码
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    value={formData.code || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              {/* 第二行：产品级别和产品别名 */}
              <div className="grid grid-cols-12 gap-4">
                {/* 产品级别 */}
                <div className="col-span-3">
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    产品级别
                  </label>
                  <input
                    type="text"
                    id="level"
                    name="level"
                    value={formData.level || ''}
                    onChange={handleChange}
                    list="levelOptions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="选择或输入产品级别"
                  />
                  <datalist id="levelOptions">
                    {availableLevels.map(level => (
                      <option key={level} value={level} />
                    ))}
                  </datalist>
                </div>
                
                {/* 产品别名 */}
                <div className="col-span-9">
                  <label htmlFor="aliasInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    产品别名
                  </label>
                  <div className="flex flex-col">
                    <div className="flex w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[42px] flex-wrap gap-2 items-center">
                      {formData.aliases && formData.aliases.length > 0 && (
                        <>
                          {formData.aliases.map((alias, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {alias}
                              <button
                                type="button"
                                onClick={() => handleRemoveAlias(alias)}
                                className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none dark:hover:bg-blue-800"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </>
                      )}
                      <input
                        type="text"
                        id="aliasInput"
                        value={aliasInput}
                        onChange={(e) => setAliasInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && aliasInput.trim()) {
                            e.preventDefault();
                            handleAddAlias();
                          }
                        }}
                        placeholder={formData.aliases && formData.aliases.length > 0 ? "" : "输入产品别名，按回车键添加"}
                        className="flex-1 outline-none min-w-[150px] bg-transparent"
                      />
                    </div>
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={handleAddAlias}
                        disabled={!aliasInput.trim()}
                        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        添加别名
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 关联信息 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">关联信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 供应商 */}
                <div>
                  <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    供应商
                  </label>
                  <select
                    id="supplierId"
                    name="supplierId"
                    value={formData.supplierId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 品牌 */}
                <div>
                  <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    品牌
                  </label>
                  <select
                    id="brandId"
                    name="brandId"
                    value={formData.brandId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">请选择品牌</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 品类 */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    品类
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">请选择品类</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* 价格和库存 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">价格和库存</h3>
              <div className="grid grid-cols-5 gap-4">
                {/* 售价 */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    售价 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                {/* 成本价 */}
                <div>
                  <label htmlFor="cost.costPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    成本价
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      id="cost.costPrice"
                      name="cost.costPrice"
                      value={formData.cost?.costPrice || 0}
                      onChange={handleCostChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* 包装费 */}
                <div>
                  <label htmlFor="cost.packagingFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    包装费
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      id="cost.packagingFee"
                      name="cost.packagingFee"
                      value={formData.cost?.packagingFee || 0}
                      onChange={handleCostChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* 运费 */}
                <div>
                  <label htmlFor="cost.shippingFee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    运费
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      id="cost.shippingFee"
                      name="cost.shippingFee"
                      value={formData.cost?.shippingFee || 0}
                      onChange={handleCostChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                {/* 库存 */}
                <div>
                  <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    库存数量
                  </label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* 产品描述 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                产品描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          {/* 右侧: 图片、分类和别名 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 产品图片 */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">产品图片</h3>
              <div className="mb-4">
                {formData.image ? (
                  <div className="relative w-full aspect-square mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img 
                      src={formData.image} 
                      alt="产品图片预览" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.classList.add('flex', 'items-center', 'justify-center');
                        (e.target as HTMLImageElement).parentElement!.innerHTML += '<span class="text-gray-400 dark:text-gray-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square mb-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                )}
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  图片URL
                </label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={formData.image || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="http://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 表单按钮 */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                处理中...
              </span>
            ) : (
              isEditing ? '保存' : '创建'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
} 