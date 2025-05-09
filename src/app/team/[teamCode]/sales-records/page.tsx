/**
 * 销售记录列表页面
 * 作者: 阿瑞
 * 功能: 提供销售记录数据的展示和查询功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useThemeMode } from '@/store/settingStore';
import { useAccessToken } from '@/store/userStore';
import { ThemeMode } from '@/types/enum';
import { 
  MdAdd, 
  MdSearch, 
  MdRefresh, 
  MdPerson, 
  MdCalendarMonth, 
  MdPayment,
  MdStore,
  MdShoppingCart,
  MdVisibility,
  MdEdit} from 'react-icons/md';
import { SalesRecord, PaymentType, SalesRecordProduct } from '@/models/team/types/sales';
import { formatDate } from '@/utils';

/**
 * 支付类型中文映射
 */
const PaymentTypeNames: Record<PaymentType, string> = {
  [PaymentType.FULL_PAYMENT]: '全款',
  [PaymentType.DEPOSIT]: '定金',
  [PaymentType.UNPAID]: '未付',
  [PaymentType.FREE]: '赠送',
  [PaymentType.OTHER]: '其他'
};

/**
 * 支付类型颜色映射
 */
const PaymentTypeColors: Record<PaymentType, string> = {
  [PaymentType.FULL_PAYMENT]: 'text-green-600 dark:text-green-400',
  [PaymentType.DEPOSIT]: 'text-yellow-600 dark:text-yellow-400',
  [PaymentType.UNPAID]: 'text-red-600 dark:text-red-400',
  [PaymentType.FREE]: 'text-blue-600 dark:text-blue-400',
  [PaymentType.OTHER]: 'text-gray-600 dark:text-gray-400'
};

/**
 * 扩展的销售记录产品接口，包含API返回的额外字段
 */
interface SalesRecordProductWithDetails extends SalesRecordProduct {
  productName?: string;
  productCode?: string;
  productSku?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  image?: string;
  description?: string;
}

/**
 * 扩展的销售记录接口，使用扩展的产品接口
 */
interface SalesRecordWithDetails extends Omit<SalesRecord, 'products'> {
  products?: SalesRecordProductWithDetails[];
  // 客户信息
  customerName?: string;
  customerPhone?: string;
  customerFollowDate?: string;
  customerAddress?: string;
  // 店铺信息
  sourceName?: string;
  sourceWechat?: string;
  sourcePhone?: string;
  sourceAccountNo?: string;
  // 成交店铺信息
  dealShopId?: number;
  dealShopName?: string;
  dealShopWechat?: string;
  dealShopPhone?: string;
  dealShopAccountNo?: string;
  // 导购信息
  guideName?: string;
  guideUsername?: string;
  // 支付平台信息
  platformName?: string;
  // 订单信息
  remark?: string;
}

/**
 * 销售记录列表页面组件
 */
export default function SalesRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();
  const themeMode = useThemeMode();
  const isDarkMode = themeMode === ThemeMode.Dark;
  
  // 销售记录数据状态
  const [salesRecords, setSalesRecords] = useState<SalesRecordWithDetails[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState<string>('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  /**
   * 获取销售记录列表数据
   */
  const fetchSalesRecords = useCallback(async () => {
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
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (filterPaymentType) queryParams.append('paymentType', filterPaymentType);
      
      const response = await fetch(`/api/team/${teamCode}/sales-records?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('获取销售记录列表失败');
      }
      
      const data = await response.json();
      setSalesRecords(data.salesRecords || []);
      setTotalRecords(data.total || 0);
    } catch (err) {
      console.error('获取销售记录列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword, startDate, endDate, filterPaymentType]);
  
  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchSalesRecords();
    }
  }, [accessToken, teamCode, currentPage, fetchSalesRecords]);
  
  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchSalesRecords();
  };
  
  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setStartDate('');
    setEndDate('');
    setFilterPaymentType('');
    setCurrentPage(1);
    fetchSalesRecords();
  };
  
  /**
   * 处理高级筛选切换
   */
  const toggleAdvancedFilter = () => {
    setIsAdvancedFilterOpen(!isAdvancedFilterOpen);
  };
  
  /**
   * 处理添加销售记录按钮点击
   */
  const handleAddSalesRecord = () => {
    router.push(`/team/${teamCode}/sales`);
  };
  
  /**
   * 处理编辑销售记录
   */
  const handleEditSalesRecord = (salesRecord: SalesRecordWithDetails) => {
    router.push(`/team/${teamCode}/sales/${salesRecord.id}`);
  };
  
  /**
   * 处理查看销售记录详情
   */
  const handleViewSalesRecord = (salesRecord: SalesRecordWithDetails) => {
    router.push(`/team/${teamCode}/sales-records/${salesRecord.id}`);
  };
  
  /**
   * 处理页码变更
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalRecords / pageSize);
  
  /**
   * 格式化金额显示
   */
  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '¥0.00';
    // 确保 amount 是数字类型
    const numAmount = Number(amount);
    // 检查是否为有效数字
    if (isNaN(numAmount)) return '¥0.00';
    return `¥${numAmount.toFixed(2)}`;
  };
  
  /**
   * 格式化友好日期
   */
  const formatFriendlyDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '-';
    return formatDate(dateStr, 'YYYY-MM-DD');
  };
  
  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '-';
    return formatDate(dateStr, 'YYYY-MM-DD HH:mm');
  };
  
  /**
   * 格式化电话号码，添加隐私保护
   */
  const formatPhone = (phone: string | undefined | null): string => {
    if (!phone || phone.length < 7) return phone || '-';
    // 只显示前3位和后4位，中间用星号代替
    return `${phone.substring(0, 3)}****${phone.substring(phone.length - 4)}`;
  };
  
  /**
   * 截断长文本并添加省略号
   */
  const truncateText = (text: string | undefined | null, maxLength: number = 50): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  /**
   * 渲染分页控件
   */
  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5; // 最多显示的页码数
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // 首页
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1 mx-1 rounded ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(
          <span key="dots1" className="mx-1">...</span>
        );
      }
    }
    
    // 页码按钮
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // 末页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots2" className="mx-1">...</span>
        );
      }
      
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 mx-1 rounded ${
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {totalPages}
        </button>
      );
    }
    
    return (
      <div className="flex justify-center items-center mt-6">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          上一页
        </button>
        
        {pages}
        
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === totalPages || totalPages === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          下一页
        </button>
      </div>
    );
  };
  
  return (
    <div className="w-full px-2 py-3 md:px-4 md:py-6 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">销售记录管理</h1>
      
      {/* 搜索和筛选区域 */}
      <div className={`mb-6 rounded-xl p-4 ${isDarkMode ? 'bg-gray-800/70' : 'bg-white shadow-sm border border-gray-200'}`}>
        <form onSubmit={handleSearch} className="space-y-4">
          {/* 基本搜索栏 */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索客户名称、电话、备注..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg outline-none ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500'
                      : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
                  }`}
                />
                <MdSearch className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <div className="w-[140px]">
                <input
                  type="date"
                  placeholder="开始日期"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg outline-none ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500'
                      : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>
              <div className="w-[140px]">
                <input
                  type="date"
                  placeholder="结束日期"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg outline-none ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500'
                      : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
                  }`}
                />
              </div>
              
              <select
                value={filterPaymentType}
                onChange={(e) => setFilterPaymentType(e.target.value)}
                className={`px-3 py-2 rounded-lg outline-none ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-100 border border-gray-600 focus:border-blue-500'
                    : 'bg-white text-gray-900 border border-gray-300 focus:border-blue-500'
                }`}
              >
                <option value="">所有支付类型</option>
                <option value={PaymentType.FULL_PAYMENT.toString()}>全款</option>
                <option value={PaymentType.DEPOSIT.toString()}>定金</option>
                <option value={PaymentType.UNPAID.toString()}>未付</option>
                <option value={PaymentType.FREE.toString()}>赠送</option>
                <option value={PaymentType.OTHER.toString()}>其他</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <MdSearch className="mr-1" />
                搜索
              </button>
              <button
                type="button"
                onClick={toggleAdvancedFilter}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isAdvancedFilterOpen ? '收起筛选' : '高级筛选'}
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className={`px-3 py-2 rounded-lg flex items-center ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MdRefresh className="mr-1" />
                重置
              </button>
              <button
                type="button"
                onClick={handleAddSalesRecord}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <MdAdd className="mr-1" />
                新增
              </button>
            </div>
          </div>
          
          {/* 高级筛选选项 */}
          {isAdvancedFilterOpen && (
            <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="space-y-2">
                <label className="block text-sm font-medium">筛选范围</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // 设置为过去7天
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 7);
                      setStartDate(formatDate(startDate, 'YYYY-MM-DD'));
                      setEndDate(formatDate(endDate, 'YYYY-MM-DD'));
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    最近7天
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // 设置为过去30天
                      const endDate = new Date();
                      const startDate = new Date();
                      startDate.setDate(startDate.getDate() - 30);
                      setStartDate(formatDate(startDate, 'YYYY-MM-DD'));
                      setEndDate(formatDate(endDate, 'YYYY-MM-DD'));
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    最近30天
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // 设置为本月
                      const now = new Date();
                      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                      setStartDate(formatDate(startDate, 'YYYY-MM-DD'));
                      setEndDate(formatDate(now, 'YYYY-MM-DD'));
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    本月
                  </button>
                </div>
              </div>
              
              {/* 更多高级筛选选项可以添加在这里 */}
            </div>
          )}
        </form>
      </div>
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {/* 销售记录列表 */}
      {!isLoading && salesRecords.length === 0 ? (
        <div className={`p-8 rounded-xl text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className="text-gray-500 dark:text-gray-400">暂无销售记录数据</p>
          <button
            onClick={handleAddSalesRecord}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
          >
            <MdAdd className="mr-1" />
            创建销售记录
          </button>
        </div>
      ) : (
        !isLoading && (
          <div className="overflow-x-auto">
            <table className={`min-w-full border-collapse ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead>
                <tr className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} border-b dark:border-gray-700`}>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">客户信息</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">日期信息</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">店铺/导购</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">支付信息</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">产品信息</th>
                  <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">备注</th>
                  <th className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {salesRecords.map(record => (
                  <tr 
                    key={record.id} 
                    className={`hover:${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-colors duration-150`}
                  >
                    {/* 客户信息 */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <MdPerson className="text-blue-500 mr-1 flex-shrink-0" size={18} />
                          <span className="font-medium truncate max-w-[120px]" title={record.customerName || '-'}>
                            {record.customerName || '-'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 ml-5">
                          电话: {formatPhone(record.customerPhone)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 ml-5">
                          ID: {record.customerId}
                        </div>
                      </div>
                    </td>
                    
                    {/* 日期信息 */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <MdCalendarMonth className="text-green-500 mr-1 flex-shrink-0" size={16} />
                          <span className="font-medium">成交日期:</span>
                        </div>
                        <div className="text-sm ml-5">{formatFriendlyDate(record.dealDate)}</div>
                        
                        <div className="flex items-center mt-1">
                          <MdCalendarMonth className="text-gray-500 mr-1 flex-shrink-0" size={16} />
                          <span className="font-medium">创建时间:</span>
                        </div>
                        <div className="text-sm ml-5">
                          {formatDateTime(record.createdAt)}
                        </div>
                      </div>
                    </td>
                    
                    {/* 店铺/导购信息 */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <MdStore className="text-purple-500 mr-1 flex-shrink-0" size={16} />
                          <span className="font-medium">来源店铺:</span>
                        </div>
                        <div className="text-sm ml-5 truncate max-w-[150px]" title={record.sourceName || '-'}>
                          {record.sourceName || '-'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 ml-5">
                          微信: {record.sourceWechat || '-'}
                        </div>
                        
                        <div className="flex items-center mt-1">
                          <MdStore className="text-blue-500 mr-1 flex-shrink-0" size={16} />
                          <span className="font-medium">成交店铺:</span>
                        </div>
                        <div className="text-sm ml-5 truncate max-w-[150px]" title={record.dealShopName || '-'}>
                          {record.dealShopName || '-'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 ml-5">
                          微信: {record.dealShopWechat || '-'}
                        </div>
                      </div>
                    </td>
                    
                    {/* 支付信息 */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center">
                          <MdPayment className="text-yellow-500 mr-1 flex-shrink-0" size={16} />
                          <span className={`font-medium ${PaymentTypeColors[record.paymentType]}`}>
                            {PaymentTypeNames[record.paymentType] || '未知'}
                          </span>
                        </div>
                        
                        <div className="text-sm ml-5">
                          支付平台: {record.platformName || '-'}
                        </div>
                        
                        <div className="flex flex-col mt-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span>应收:</span>
                            <span className="font-medium">{formatAmount(record.receivable)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>实收:</span>
                            <span className={`${PaymentTypeColors[record.paymentType]}`}>
                              {formatAmount(record.received)}
                            </span>
                          </div>
                          {record.pending > 0 && (
                            <div className="flex justify-between items-center">
                              <span>待收:</span>
                              <span className="text-red-500 dark:text-red-400">
                                {formatAmount(record.pending)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* 产品信息 */}
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <MdShoppingCart className="text-orange-500 mr-1 flex-shrink-0" size={16} />
                          <span className="font-medium">产品列表:</span>
                        </div>
                        
                        {record.products && record.products.length > 0 ? (
                          <div className="ml-5 mt-1">
                            <div className="max-h-[250px] overflow-y-auto pr-2">
                              {record.products.map((product, idx) => (
                                <div key={idx} className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                  <div className="flex gap-2">
                                    {/* 产品图片 */}
                                    <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden">
                                      {product.image ? (
                                        <img 
                                          src={product.image} 
                                          alt={product.productName || '产品'} 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                          <MdShoppingCart size={24} className="text-gray-500" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* 产品信息 */}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm truncate max-w-[200px]" title={product.productName || '无名称产品'}>
                                        {product.productName || '无名称产品'}
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center">
                                          <span className="font-medium">数量:</span> 
                                          <span className="ml-1">{product.quantity}件</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium">单价:</span> 
                                          <span className="ml-1">{formatAmount(product.price)}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium">品牌:</span> 
                                          <span className="ml-1 truncate">{product.brandName || '-'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="font-medium">品类:</span> 
                                          <span className="ml-1 truncate">{product.categoryName || '-'}</span>
                                        </div>
                                        <div className="flex items-center col-span-2">
                                          <span className="font-medium">供应商:</span> 
                                          <span className="ml-1 truncate">{product.supplierName || '-'}</span>
                                        </div>
                                        {product.productCode && (
                                          <div className="flex items-center col-span-2">
                                            <span className="font-medium">编码:</span>
                                            <span className="ml-1 truncate">{product.productCode}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-sm font-medium mt-2 flex justify-between items-center">
                              <span>共{record.products.reduce((sum, p) => sum + p.quantity, 0)}件商品</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                总价: {formatAmount(record.products.reduce((sum, p) => sum + (p.price * p.quantity), 0))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 ml-5 mt-1">
                            无产品信息
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* 备注 */}
                    <td className="px-3 py-3 align-top">
                      <div className="max-w-[150px] max-h-[120px] overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">
                          {truncateText(record.remark)}
                        </p>
                      </div>
                    </td>
                    
                    {/* 操作按钮 */}
                    <td className="px-3 py-3 text-center align-top">
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => handleViewSalesRecord(record)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="查看详情"
                        >
                          <MdVisibility size={20} />
                        </button>
                        <button
                          onClick={() => handleEditSalesRecord(record)}
                          className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300"
                          title="编辑"
                        >
                          <MdEdit size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      
      {/* 分页控件 */}
      {!isLoading && salesRecords.length > 0 && renderPagination()}
    </div>
  );
} 