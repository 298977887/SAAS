/**
 * 表格头部组件
 * 作者: 阿瑞
 * 功能: 展示店铺粉丝增长表格的头部
 * 版本: 1.1.0
 */

import React, { memo } from 'react';

/**
 * 日期数据接口
 */
interface DateColumn {
  date: string;
  formatted: string;
  backgroundColor: string;
}

/**
 * 表格头部属性
 */
interface TableHeaderProps {
  monthDates: DateColumn[];
  isDarkMode: boolean;
  calculateDateTotalGrowth: (date: string) => number;
}

/**
 * 表格头部组件 - 使用memo优化渲染性能
 */
const TableHeader = memo(({ 
  monthDates, 
  isDarkMode,
  calculateDateTotalGrowth
}: TableHeaderProps) => {
  /**
   * 子列样式配置 - 固定列宽样式
   */
  const subColumnStyles = {
    width: '70px',
    minWidth: '70px',
    maxWidth: '70px'
  };

  return (
    <thead>
      <tr>
        {/* 固定的店铺列 */}
        <th 
          className={`sticky left-0 z-10 px-4 py-2 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}
          style={{ minWidth: '160px' }}
        >
          店铺信息
        </th>
        
        {/* 日期列 */}
        {monthDates.map((dateInfo) => (
          <th 
            key={dateInfo.date} 
            colSpan={3}
            className={`px-2 py-1 text-center border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
            style={{ 
              backgroundColor: isDarkMode 
                ? `${dateInfo.backgroundColor}30` 
                : dateInfo.backgroundColor,
              width: '210px', // 固定为3个子列的总宽度
              minWidth: '210px'
            }}
          >
            <div className="font-medium">
              {dateInfo.formatted}
            </div>
            <div className="text-xs">
              总增长: {calculateDateTotalGrowth(dateInfo.date)}
            </div>
          </th>
        ))}
      </tr>
      
      {/* 子表头 */}
      <tr>
        {/* 空的店铺列表头 */}
        <th 
          className={`sticky left-0 z-10 px-4 py-1 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
          }`}
        >
          月增长
        </th>
        
        {/* 每个日期的子列 */}
        {monthDates.map((dateInfo) => (
          <React.Fragment key={`sub-${dateInfo.date}`}>
            <th 
              className={`px-1 py-1 text-xs border text-center ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
              style={subColumnStyles}
            >
              总数
            </th>
            <th 
              className={`px-1 py-1 text-xs border text-center ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
              style={subColumnStyles}
            >
              扣除
            </th>
            <th 
              className={`px-1 py-1 text-xs border text-center ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}
              style={subColumnStyles}
            >
              增长
            </th>
          </React.Fragment>
        ))}
      </tr>
    </thead>
  );
});

// 设置组件显示名称，便于调试
TableHeader.displayName = 'TableHeader';

export default TableHeader; 