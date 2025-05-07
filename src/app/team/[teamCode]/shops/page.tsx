/**
 * 店铺管理页面
 * 作者: 阿瑞
 * 功能: 提供店铺数据的展示和管理功能
 * 版本: 1.0.0
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTeam } from '@/hooks/useTeam';
import { useAccessToken } from '@/store/userStore';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdOutlineStorefront, MdPhone } from 'react-icons/md';
import { FaWeixin } from 'react-icons/fa';
import { Shop, ShopStatus } from '@/models/team/types/shop';
import ShopModal from './shop-modal';
import Image from 'next/image';

/**
 * 店铺状态标签组件
 */
const StatusBadge = ({ status }: { status: ShopStatus }) => {
  let bgColor = '';
  let textColor = '';
  let label = '';

  switch (status) {
    case ShopStatus.ACTIVE:
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      label = '正常';
      break;
    case ShopStatus.DISABLED:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = '停用';
      break;
    case ShopStatus.BANNED:
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      label = '封禁';
      break;
    case ShopStatus.PENDING:
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      label = '待解封';
      break;
    case ShopStatus.RESERVE:
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      label = '备用';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      label = '其他';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  );
};

/**
 * 店铺管理页面组件
 */
export default function ShopsPage() {
  const params = useParams();
  const teamCode = params?.teamCode as string;
  const { currentTeam } = useTeam();
  const accessToken = useAccessToken();

  // 店铺数据状态
  const [shops, setShops] = useState<Shop[]>([]);
  const [totalShops, setTotalShops] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // 删除确认状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null);

  /**
   * 获取店铺列表数据
   */
  const fetchShops = useCallback(async () => {
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
      if (statusFilter) queryParams.append('status', statusFilter);

      const response = await fetch(`/api/team/${teamCode}/shops?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('获取店铺列表失败');
      }

      const data = await response.json();
      setShops(data.shops || []);
      setTotalShops(data.total || 0);
    } catch (err) {
      console.error('获取店铺列表失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam, teamCode, accessToken, currentPage, pageSize, searchKeyword, statusFilter]);

  /**
   * 初始加载和依赖变化时获取数据
   */
  useEffect(() => {
    if (accessToken && teamCode) {
      fetchShops();
    }
  }, [accessToken, teamCode, fetchShops]);

  /**
   * 处理搜索
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置到第一页
    fetchShops();
  };

  /**
   * 清空筛选条件
   */
  const handleClearFilters = () => {
    setSearchKeyword('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchShops();
  };

  /**
   * 处理添加店铺按钮点击
   */
  const handleAddShop = () => {
    setSelectedShop(null);
    setIsModalOpen(true);
  };

  /**
   * 处理编辑店铺
   */
  const handleEditShop = (shop: Shop) => {
    setSelectedShop(shop);
    setIsModalOpen(true);
  };

  /**
   * 处理删除店铺确认
   */
  const handleDeleteClick = (shop: Shop) => {
    setShopToDelete(shop);
    setShowDeleteConfirm(true);
  };

  /**
   * 执行删除店铺操作
   */
  const confirmDelete = async () => {
    if (!shopToDelete || !teamCode) return;

    try {
      const response = await fetch(`/api/team/${teamCode}/shops/${shopToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('删除店铺失败');
      }

      // 移除已删除的店铺
      setShops(prev => prev.filter(s => s.id !== shopToDelete.id));
      setTotalShops(prev => prev - 1);
      setShowDeleteConfirm(false);
      setShopToDelete(null);
    } catch (err) {
      console.error('删除店铺失败:', err);
    }
  };

  /**
   * 计算总页数
   */
  const totalPages = Math.ceil(totalShops / pageSize);

  /**
   * 判断URL是否有效
   */
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="w-full">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">店铺管理</h1>
        <button
          onClick={handleAddShop}
          className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          <MdAdd size={20} />
          <span>添加店铺</span>
        </button>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索店铺名称、微信号、手机号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-4 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">全部状态</option>
              <option value={ShopStatus.ACTIVE.toString()}>正常</option>
              <option value={ShopStatus.DISABLED.toString()}>停用</option>
              <option value={ShopStatus.BANNED.toString()}>封禁</option>
              <option value={ShopStatus.PENDING.toString()}>待解封</option>
              <option value={ShopStatus.RESERVE.toString()}>备用</option>
              <option value={ShopStatus.OTHER.toString()}>其他</option>
            </select>
          </div>

          <div className="flex gap-2">
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
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* 店铺列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  店铺信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  联系方式
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  账号编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : shops.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    暂无店铺数据
                  </td>
                </tr>
              ) : (
                shops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {shop.avatar && isValidUrl(shop.avatar) ? (
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={shop.avatar}
                              alt={shop.nickname || '店铺头像'}
                              className="h-10 w-10 rounded-full object-cover"
                              width={40}
                              height={40}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <MdOutlineStorefront className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {shop.nickname || '未命名店铺'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {shop.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {shop.wechat && (
                          <div className="flex items-center gap-1 mb-1">
                            <FaWeixin className="text-green-500" />
                            <span>{shop.wechat}</span>
                          </div>
                        )}
                        {shop.phone && (
                          <div className="flex items-center gap-1">
                            <MdPhone className="text-blue-500" />
                            <span>{shop.phone}</span>
                          </div>
                        )}
                        {!shop.wechat && !shop.phone && (
                          <span className="text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {shop.accountNo || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={shop.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEditShop(shop)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="编辑"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(shop)}
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
                  {Math.min(currentPage * pageSize, totalShops)}
                </span>{' '}
                条，共 <span className="font-medium">{totalShops}</span> 条
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 ${currentPage === 1
                    ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } mr-3`}
              >
                上一页
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 ${currentPage === totalPages
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

      {/* 店铺模态框 */}
      <ShopModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shop={selectedShop}
        onSuccess={fetchShops}
      />

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">确认删除</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              您确定要删除店铺 "{shopToDelete?.nickname || shopToDelete?.wechat || '未命名店铺'}" 吗？此操作不可撤销。
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