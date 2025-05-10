/**
 * 控制面板组件
 * 作者: 阿瑞
 * 功能: 提供数据控制和筛选功能
 * 版本: 1.3.0
 */

import React, { memo } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MdRefresh, MdSave, MdWarning } from 'react-icons/md';

/**
 * 控制面板属性
 */
interface ControlPanelProps {
  selectedMonth: string;
  handleMonthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  refreshData: () => void;
  hasUnsavedChanges: boolean;
  saveAllEditedData: () => Promise<void>;
  isLoading: boolean;
  isLoadingRef: boolean;
  savingData: boolean;
  isDarkMode: boolean;
}

/**
 * 控制面板组件 - 使用memo优化渲染性能
 */
const ControlPanel = memo(({
  selectedMonth,
  handleMonthChange,
  refreshData,
  hasUnsavedChanges,
  saveAllEditedData,
  isLoading,
  isLoadingRef,
  savingData,
  isDarkMode
}: ControlPanelProps) => {
  return (
    <Card 
      glassEffect={isDarkMode ? 'medium' : 'light'} 
      className="mb-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="w-40"
          />
          <Button
            variant="primary"
            buttonStyle="outline"
            icon={<MdRefresh className="text-xl" />}
            onClick={refreshData}
            disabled={isLoading || isLoadingRef}
          >
            刷新数据
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasUnsavedChanges && (
            <div className="flex items-center">
              <MdWarning className={`text-xl mr-1 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
              <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                您有未保存的修改，请点击保存按钮
              </span>
            </div>
          )}
          <Button
            variant={isDarkMode ? "success" : "primary"}
            icon={<MdSave className="text-xl" />}
            onClick={saveAllEditedData}
            disabled={!hasUnsavedChanges || savingData}
            className={`${hasUnsavedChanges ? 'animate-pulse' : ''} ${
              hasUnsavedChanges 
                ? isDarkMode 
                  ? 'bg-green-500 hover:bg-green-600 text-white font-bold shadow-md' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-md'
                : isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            size="lg"
          >
            {savingData ? '保存中...' : '保存所有更改'}
          </Button>
        </div>
      </div>
    </Card>
  );
});

// 设置组件显示名称，便于调试
ControlPanel.displayName = 'ControlPanel';

export default ControlPanel; 