/**
 * 销售记录创建页面
 * 作者: 阿瑞
 * 功能: 提供创建销售记录的表单界面
 * 版本: 1.3.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { useThemeMode } from '@/store/settingStore';
import { ThemeMode } from '@/types/enum';
import { formatDate } from '@/utils';
import { PaymentType } from '@/models/team/types/sales';
import { Customer } from '@/models/team/types/customer';
import { Product } from '@/models/team/types/product';
import { Shop } from '@/models/team/types/shop';
import { PaymentPlatform } from '@/models/team/types/payment-platform';
import { MdAdd, MdShoppingCart, MdLocalShipping, MdPerson } from 'react-icons/md';
import Card from '@/components/ui/Card';
import CustomerSelector from './components/CustomerSelector';
import ProductSelector from './components/ProductSelector';
import SelectedProductList from './components/SelectedProductList';

/**
 * 销售记录创建页面组件
 * 布局分为上下两部分，上部分为客户和产品选择，下部分为详细信息
 */
export default function SalesPage() {
  const params = useParams();
  const router = useRouter();
  const teamCode = params?.teamCode as string;
  useTeam();
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;

  // 表单数据状态
  const [formData, setFormData] = useState({
    customerId: 0,
    sourceId: undefined as number | undefined,
    paymentType: PaymentType.FULL_PAYMENT,
    dealDate: formatDate(new Date(), 'YYYY-MM-DD'),
    receivable: 0,
    received: 0,
    pending: 0,
    platformId: undefined as number | undefined,
    dealShopId: undefined as number | undefined,
    remark: '',
    products: [] as {
      productId: number;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }[]
  });

  // 选择器数据状态
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productPrice, setProductPrice] = useState(0);

  // 加载状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 数据列表
  const [shops, setShops] = useState<Shop[]>([]);
  const [platforms, setPlatforms] = useState<PaymentPlatform[]>([]);

  // 视图状态
  const [isPageLoading, setIsPageLoading] = useState(true);

  /**
   * 加载支付平台数据
   */
  const fetchPaymentPlatforms = useCallback(async () => {
    if (!teamCode || !accessToken) return;

    try {
      const response = await fetch(`/api/team/${teamCode}/payment-platforms`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlatforms(data.paymentPlatforms || []);
      }
    } catch (error) {
      console.error('加载支付平台失败:', error);
    }
  }, [teamCode, accessToken]);

  /**
   * 加载店铺数据
   */
  const fetchShops = useCallback(async () => {
    if (!teamCode || !accessToken) return;

    try {
      const response = await fetch(`/api/team/${teamCode}/shops`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShops(data.shops || []);
      }
    } catch (error) {
      console.error('加载店铺失败:', error);
    }
  }, [teamCode, accessToken]);

  /**
   * 初始加载数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      setIsPageLoading(true);
      Promise.all([
        fetchPaymentPlatforms(),
        fetchShops()
      ]).finally(() => {
        setIsPageLoading(false);
      });
    }
  }, [accessToken, teamCode, fetchPaymentPlatforms, fetchShops]);

  /**
   * 处理表单输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // 处理数字类型字段
    if (name === 'receivable' || name === 'received') {
      const numValue = value === '' ? 0 : parseFloat(value);

      // 更新表单数据
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: numValue
        };

        // 如果修改了应收或实收金额，自动计算待收金额
        if (name === 'receivable' || name === 'received') {
          newData.pending = Math.max(0, newData.receivable - newData.received);
        }

        return newData;
      });
      return;
    }

    // 处理支付类型
    if (name === 'paymentType') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value, 10)
      }));
      return;
    }

    // 处理其他字段
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * 处理选择客户
   */
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id
    }));
  };

  /**
   * 处理选择产品
   */
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductPrice(product.price);
    // 自动聚焦到数量输入框
    const quantityInput = document.getElementById('productQuantity');
    if (quantityInput) {
      quantityInput.focus();
    }
  };

  /**
   * 处理添加产品到列表
   */
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    if (productQuantity <= 0) {
      setError('产品数量必须大于0');
      return;
    }

    // 确保价格是有效的数字
    const numPrice = Number(productPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('产品价格必须是大于等于0的数字');
      return;
    }

    const total = numPrice * productQuantity;

    // 检查是否已存在该产品
    const existingProductIndex = formData.products.findIndex(p => p.productId === selectedProduct.id);

    if (existingProductIndex >= 0) {
      // 更新现有产品
      setFormData(prev => {
        const updatedProducts = [...prev.products];
        const existingProduct = updatedProducts[existingProductIndex];

        updatedProducts[existingProductIndex] = {
          ...existingProduct,
          quantity: existingProduct.quantity + productQuantity,
          price: numPrice, // 使用转换后的数字
          total: existingProduct.total + total
        };

        // 重新计算总金额
        const newReceivable = updatedProducts.reduce((sum, p) => sum + p.total, 0);

        return {
          ...prev,
          products: updatedProducts,
          receivable: newReceivable,
          pending: Math.max(0, newReceivable - prev.received)
        };
      });
    } else {
      // 添加新产品
      setFormData(prev => {
        const newProducts = [
          ...prev.products,
          {
            productId: selectedProduct.id,
            name: selectedProduct.name,
            price: numPrice, // 使用转换后的数字
            quantity: productQuantity,
            total
          }
        ];

        // 重新计算总金额
        const newReceivable = newProducts.reduce((sum, p) => sum + p.total, 0);

        return {
          ...prev,
          products: newProducts,
          receivable: newReceivable,
          pending: Math.max(0, newReceivable - prev.received)
        };
      });
    }

    // 重置产品选择状态
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductPrice(0);
    setError(null);
  };

  /**
   * 处理移除产品
   */
  const handleRemoveProduct = (index: number) => {
    setFormData(prev => {
      const updatedProducts = prev.products.filter((_, i) => i !== index);

      // 重新计算总金额
      const newReceivable = updatedProducts.reduce((sum, p) => sum + p.total, 0);

      return {
        ...prev,
        products: updatedProducts,
        receivable: newReceivable,
        pending: Math.max(0, newReceivable - prev.received)
      };
    });
  };

  /**
   * 表单提交处理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.customerId) {
      setError('请选择客户');
      return;
    }

    if (!formData.dealDate) {
      setError('请选择成交日期');
      return;
    }

    if (formData.products.length === 0) {
      setError('请至少添加一个产品');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 准备提交数据，确保所有数值字段都是数字类型
      const submitData = {
        customerId: Number(formData.customerId),
        sourceId: formData.sourceId ? Number(formData.sourceId) : undefined,
        paymentType: Number(formData.paymentType),
        dealDate: formData.dealDate,
        receivable: Number(formData.receivable),
        received: Number(formData.received),
        pending: Number(formData.pending),
        platformId: formData.platformId ? Number(formData.platformId) : undefined,
        dealShop: formData.dealShopId ? Number(formData.dealShopId) : undefined,
        remark: formData.remark || null,
        products: formData.products.map(p => ({
          productId: Number(p.productId),
          quantity: Number(p.quantity),
          price: Number(p.price)
        }))
      };

      // 发送请求
      const response = await fetch(`/api/team/${teamCode}/sales-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '创建销售记录失败');
      }

      // 显示成功消息
      setSuccessMessage('销售记录创建成功！');

      // 清空表单
      setFormData({
        customerId: 0,
        sourceId: undefined,
        paymentType: PaymentType.FULL_PAYMENT,
        dealDate: formatDate(new Date(), 'YYYY-MM-DD'),
        receivable: 0,
        received: 0,
        pending: 0,
        platformId: undefined,
        dealShopId: undefined,
        remark: '',
        products: []
      });

      setSelectedCustomer(null);

      // 3秒后跳转
      setTimeout(() => {
        router.push(`/team/${teamCode}/sales-records`);
      }, 3000);
    } catch (err) {
      console.error('创建销售记录失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 渲染支付类型选项
   */
  const renderPaymentTypeOptions = () => {
    return (
      <>
        <option value={PaymentType.FULL_PAYMENT}>全款</option>
        <option value={PaymentType.DEPOSIT}>定金</option>
        <option value={PaymentType.UNPAID}>未付</option>
        <option value={PaymentType.FREE}>赠送</option>
        <option value={PaymentType.OTHER}>其他</option>
      </>
    );
  };

  /**
   * 获取支付类型标签颜色
   */
  const getPaymentTypeColor = (type: PaymentType) => {
    switch (type) {
      case PaymentType.FULL_PAYMENT:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case PaymentType.DEPOSIT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case PaymentType.UNPAID:
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case PaymentType.FREE:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-10">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <MdShoppingCart className="mr-2 text-blue-500" size={24} />
          创建销售记录
        </h1>
      </div>

      {/* 加载状态显示 */}
      {isPageLoading ? (
        <Card
          glassEffect={isDarkMode ? "medium" : "light"}
          padding="large"
          className="flex justify-center items-center py-20"
          isLoading={true}
          loadingText="正在加载数据..."
        >
          <div></div>
        </Card>
      ) : (
        <>
          {/* 成功消息 */}
          {successMessage && (
            <div className={`
              mb-4 p-3 rounded-lg border-l-4 border-green-500 
              ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'} 
              text-green-700 dark:text-green-300
              animate-fadeIn
            `}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className={`
              mb-4 p-3 rounded-lg border-l-4 border-red-500 
              ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} 
              text-red-700 dark:text-red-300
              animate-fadeIn
            `}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 上部分 - 客户与产品选择，高度固定，布局紧凑 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 左侧栏 - 客户选择 */}
              <Card
                glassEffect={isDarkMode ? "medium" : "light"}
                padding="medium"
                title={
                  <div className="flex items-center">
                    <MdPerson className="mr-1.5 text-blue-500" />
                    <span>客户选择</span>
                  </div>
                }
              >
                <CustomerSelector
                  teamCode={teamCode}
                  accessToken={accessToken}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={handleSelectCustomer}
                />

                {selectedCustomer && (
                  <div className="mt-3 p-2 rounded-lg border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      已选择客户: {selectedCustomer.name}
                      {selectedCustomer.phone && <span className="ml-2 text-gray-500">({selectedCustomer.phone})</span>}
                    </div>
                  </div>
                )}
              </Card>

              {/* 右侧栏 - 产品选择与添加 */}
              <Card
                glassEffect={isDarkMode ? "medium" : "light"}
                padding="medium"
                title={
                  <div className="flex items-center">
                    <MdLocalShipping className="mr-1.5 text-blue-500" />
                    <span>产品选择</span>
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-3">
                  <ProductSelector
                    teamCode={teamCode}
                    accessToken={accessToken}
                    selectedProduct={selectedProduct}
                    onSelectProduct={handleSelectProduct}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        id="productQuantity"
                        placeholder="数量"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
                        min="1"
                        className={`
                          w-full px-3 py-2 rounded-lg
                          ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                          backdrop-blur-sm border border-white/20 dark:border-white/10
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          text-gray-800 dark:text-white
                          transition-all duration-200
                        `}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        id="productPrice"
                        placeholder="单价"
                        value={productPrice}
                        onChange={(e) => setProductPrice(parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className={`
                          w-full px-3 py-2 rounded-lg
                          ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                          backdrop-blur-sm border border-white/20 dark:border-white/10
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          text-gray-800 dark:text-white
                          transition-all duration-200
                        `}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProduct}
                    className={`
                      w-full px-4 py-2 rounded-lg text-white font-medium 
                      flex items-center justify-center
                      transition-all duration-200
                      ${selectedProduct
                        ? `${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} 
                           hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`
                        : 'bg-gray-400 cursor-not-allowed'
                      }
                      backdrop-blur-md border border-white/20
                    `}
                  >
                    <MdAdd className="mr-1.5" size={18} />
                    添加产品
                  </button>
                </div>
              </Card>
            </div>

            {/* 产品列表部分 - 仅在有产品时显示 */}
            {formData.products.length > 0 && (
              <div className="mb-4">
                <Card
                  glassEffect={isDarkMode ? "medium" : "light"}
                  padding="small"
                  title="已选产品"
                >
                  <SelectedProductList
                    products={formData.products}
                    onRemove={handleRemoveProduct}
                  />
                </Card>
              </div>
            )}

            {/* 下部分内容将在下一个编辑中完成 */}

            {/* 下部分 - 订单详细信息（紧凑单行布局） */}
            <Card
              glassEffect={isDarkMode ? "medium" : "light"}
              padding="medium"
              title="订单详细信息"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
                {/* 第一列 */}
                <div className="space-y-3">
                  {/* 店铺选择
                  <div>
                    <label htmlFor="sourceId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      店铺
                    </label>
                    <select
                      id="sourceId"
                      name="sourceId"
                      value={formData.sourceId || ''}
                      onChange={handleChange}
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                    >
                      <option value="">请选择店铺</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.nickname || shop.wechat || shop.accountNo || `店铺ID: ${shop.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                   */}

                  {/* 成交日期 */}
                  <div>
                    <label htmlFor="dealDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      成交日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="dealDate"
                      name="dealDate"
                      value={formData.dealDate}
                      onChange={handleChange}
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                      required
                    />
                  </div>
                </div>

                {/* 第二列 */}
                <div className="space-y-3">
                  {/* 收款类型 */}
                  <div>
                    <label htmlFor="paymentType" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      收款类型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="paymentType"
                      name="paymentType"
                      value={formData.paymentType}
                      onChange={handleChange}
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                      required
                    >
                      {renderPaymentTypeOptions()}
                    </select>

                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getPaymentTypeColor(formData.paymentType)}`}>
                        {formData.paymentType === PaymentType.FULL_PAYMENT && "全款"}
                        {formData.paymentType === PaymentType.DEPOSIT && "定金"}
                        {formData.paymentType === PaymentType.UNPAID && "未付"}
                        {formData.paymentType === PaymentType.FREE && "赠送"}
                        {formData.paymentType === PaymentType.OTHER && "其他"}
                      </span>
                    </div>
                  </div>

                  {/* 支付平台 */}
                  <div>
                    <label htmlFor="platformId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      支付平台
                    </label>
                    <select
                      id="platformId"
                      name="platformId"
                      value={formData.platformId || ''}
                      onChange={handleChange}
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                    >
                      <option value="">请选择支付平台</option>
                      {platforms.map(platform => (
                        <option key={platform.id} value={platform.id}>
                          {platform.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 第三列 */}
                <div className="space-y-3">
                  {/* 金额信息 */}
                  <div>
                    <label htmlFor="receivable" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      应收金额 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="receivable"
                      name="receivable"
                      value={formData.receivable}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="received" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        实收金额 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="received"
                        name="received"
                        value={formData.received}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className={`
                          w-full px-3 py-1.5 rounded-md text-sm
                          ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                          backdrop-blur-sm border border-white/20 dark:border-white/10
                          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                          text-gray-800 dark:text-white
                        `}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="pending" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        待收金额
                      </label>
                      <input
                        type="number"
                        id="pending"
                        name="pending"
                        value={formData.pending}
                        readOnly
                        className={`
                          w-full px-3 py-1.5 rounded-md text-sm
                          ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100/70'}
                          backdrop-blur-sm border border-white/10 dark:border-white/5
                          focus:outline-none
                          text-gray-700 dark:text-gray-300
                        `}
                      />
                    </div>
                  </div>
                </div>

                {/* 第四列 */}
                <div className="space-y-3">
                  {/* 成交店铺 */}
                  <div>
                    <label htmlFor="dealShopId" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      成交店铺
                    </label>
                    <select
                      id="dealShopId"
                      name="dealShopId"
                      value={formData.dealShopId || ''}
                      onChange={handleChange}
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                      `}
                    >
                      <option value="">请选择成交店铺</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>
                          {shop.nickname || shop.wechat || shop.accountNo || `店铺ID: ${shop.id}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 备注 */}
                  <div>
                    <label htmlFor="remark" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      备注
                    </label>
                    <textarea
                      id="remark"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      rows={2}
                      placeholder="请输入备注信息"
                      className={`
                        w-full px-3 py-1.5 rounded-md text-sm
                        ${isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'}
                        backdrop-blur-sm border border-white/20 dark:border-white/10
                        focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                        text-gray-800 dark:text-white
                        resize-none
                      `}
                    />
                  </div>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`
                    px-5 py-2 rounded-lg text-white font-medium text-sm
                    flex items-center justify-center
                    transition-all duration-200
                    ${isSubmitting
                      ? 'bg-blue-400/80 cursor-not-allowed'
                      : `${isDarkMode ? 'bg-blue-600/80 hover:bg-blue-500/80' : 'bg-blue-500 hover:bg-blue-600'} 
                        hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`
                    }
                    backdrop-blur-md border border-white/20
                  `}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提交中...
                    </div>
                  ) : '创建销售记录'}
                </button>
              </div>
            </Card>
          </form>
        </>
      )}
    </div>
  );
} 