/**
 * 店铺数据行组件
 * 作者: 阿瑞
 * 功能: 展示单个店铺的粉丝增长数据行
 * 版本: 1.3.1
 */

import React, { memo } from 'react';
import { MdStorefront } from 'react-icons/md';
import Input from '@/components/ui/Input';
import { ThemeMode } from '@/types/enum';
import { formatDate } from '@/utils/date.utils';

/**
 * 店铺粉丝增长数据接口
 */
interface ShopFollowerGrowth {
  id: number;
  shop_id: number;
  date: string;
  total: number;
  deducted: number;
  daily_increase: number;
  created_at: string;
  updated_at: string;
  shop_name?: string;
}

/**
 * 日期数据接口
 */
interface DateColumn {
  date: string;
  formatted: string;
  backgroundColor: string;
}

/**
 * 店铺数据接口
 */
interface Shop {
  id: number;
  wechat: string;
  nickname: string;
  status: number;
}

/**
 * 店铺数据行属性
 */
interface ShopDataRowProps {
  shop: Shop;
  monthDates: DateColumn[];
  growthRecords: ShopFollowerGrowth[];
  editedData: Record<number, Record<string, { total: number; deducted: number }>>;
  isDarkMode: boolean;
  calculateMonthlyGrowth: (shopId: number) => number;
  getRecordData: (shopId: number, date: string) => { total: number; deducted: number };
  handleDataChange: (shopId: number, date: string, field: 'total' | 'deducted', value: number) => void;
  saveRecord: (shopId: number, date: string, retryCount?: number) => Promise<ShopFollowerGrowth | undefined>;
}

/**
 * 店铺数据行组件 - 使用memo优化渲染性能
 */
const ShopDataRow = memo(({
  shop,
  monthDates,
  growthRecords,
  editedData,
  isDarkMode,
  calculateMonthlyGrowth,
  getRecordData,
  handleDataChange,
  saveRecord
}: ShopDataRowProps) => {
  /**
   * 计算日增长量
   */
  const getDailyIncrease = (shopId: number, date: string) => {
    const recordData = getRecordData(shopId, date);
    const record = growthRecords.find(r => r.shop_id === shopId && r.date === date);
    return record ? record.daily_increase : (recordData.total - recordData.deducted);
  };

  /**
   * 子列样式配置 - 固定列宽样式，与表头保持一致
   */
  const cellStyles = {
    width: '70px',
    minWidth: '70px',
    maxWidth: '70px'
  };

  return (
    <tr>
      {/* 店铺信息 */}
      <td 
        className={`sticky left-0 z-10 px-3 py-2 border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <MdStorefront className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
          <div>
            <div className="font-medium">{shop.nickname || '未命名店铺'}</div>
            <div className="text-xs">{shop.wechat}</div>
            <div className={`text-xs mt-1 ${
              calculateMonthlyGrowth(shop.id) > 0
                ? 'text-green-500'
                : calculateMonthlyGrowth(shop.id) < 0
                  ? 'text-red-500'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              月增长: {calculateMonthlyGrowth(shop.id)}
            </div>
          </div>
        </div>
      </td>
      
      {/* 每一天的数据单元格 */}
      {monthDates.map((dateInfo) => {
        const recordData = getRecordData(shop.id, dateInfo.date);
        const isEdited = Boolean(editedData[shop.id]?.[dateInfo.date]);
        const dailyIncrease = getDailyIncrease(shop.id, dateInfo.date);
        
        return (
          <React.Fragment key={`${shop.id}-${dateInfo.date}`}>
            {/* 总数 */}
            <td 
              className={`px-1 py-1 border text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${isEdited ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}
              style={cellStyles}
            >
              <Input
                type="number"
                min={0}
                value={recordData.total}
                onChange={(e) => handleDataChange(shop.id, dateInfo.date, 'total', parseInt(e.target.value || '0'))}
                className="w-full text-center"
              />
            </td>
            
            {/* 扣除 */}
            <td 
              className={`px-1 py-1 border text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${isEdited ? (isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}
              style={cellStyles}
            >
              <Input
                type="number"
                min={0}
                value={recordData.deducted}
                onChange={(e) => handleDataChange(shop.id, dateInfo.date, 'deducted', parseInt(e.target.value || '0'))}
                className="w-full text-center"
              />
            </td>
            
            {/* 增长 */}
            <td 
              className={`px-1 py-1 text-center border ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              } ${
                dailyIncrease > 0
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : dailyIncrease < 0
                    ? isDarkMode ? 'text-red-400' : 'text-red-600'
                    : ''
              }`}
              style={cellStyles}
            >
              {dailyIncrease}
            </td>
          </React.Fragment>
        );
      })}
    </tr>
  );
});

// 设置组件显示名称，便于调试
ShopDataRow.displayName = 'ShopDataRow';

export default ShopDataRow; 