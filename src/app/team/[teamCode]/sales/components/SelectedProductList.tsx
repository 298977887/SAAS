/**
 * 已选产品列表组件
 * 作者: 阿瑞
 * 功能: 展示和管理已选择的产品列表
 * 版本: 1.0.0
 */

'use client';

import React from 'react';
import { MdDelete } from 'react-icons/md';

interface SelectedProductProps {
  products: {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  onRemove: (index: number) => void;
}

/**
 * 已选产品列表组件
 */
export default function SelectedProductList({ products, onRemove }: SelectedProductProps) {
  /**
   * 格式化金额显示
   */
  const formatAmount = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null) return "0.00";
    // 确保amount是数字类型
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    // 检查是否为有效数字
    if (isNaN(numAmount)) return "0.00";
    return numAmount.toFixed(2);
  };
  
  // 如果没有选择产品，则显示提示信息
  if (products.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center text-gray-500 dark:text-gray-400">
        暂未选择产品，请先添加产品
      </div>
    );
  }
  
  // 计算总金额
  const totalAmount = products.reduce((sum, product) => sum + product.total, 0);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">已选择产品</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                产品
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                单价
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                数量
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                小计
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {products.map((product, index) => (
              <tr key={`${product.productId}-${index}`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                  {product.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  ¥{formatAmount(product.price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-300">
                  {product.quantity}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-800 dark:text-gray-200">
                  ¥{formatAmount(product.total)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="移除产品"
                  >
                    <MdDelete size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
                总计:
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-white">
                ¥{formatAmount(totalAmount)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
} 