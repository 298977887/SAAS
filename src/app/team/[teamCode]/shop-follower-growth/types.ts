/**
 * 店铺粉丝增长页面类型定义
 * 作者: 阿瑞
 * 功能: 集中定义相关数据类型
 * 版本: 1.0.0
 */

/**
 * 店铺粉丝增长数据接口
 */
export interface ShopFollowerGrowth {
  id: number;
  shop_id: number;
  date: string;
  total: number;
  deducted: number;
  daily_increase: number;
  created_at: string;
  updated_at: string;
  shop_name?: string;  // 从关联表获取的数据
}

/**
 * 店铺数据接口
 */
export interface Shop {
  id: number;
  wechat: string;
  nickname: string;
  status: number;
}

/**
 * 日期数据接口
 */
export interface DateColumn {
  date: string;
  formatted: string;
  backgroundColor: string;
}

/**
 * 编辑中的数据接口
 */
export interface EditedData {
  [shopId: number]: {
    [date: string]: {
      total: number;
      deducted: number;
    };
  };
} 