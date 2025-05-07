/**
 * 店铺数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义店铺相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 店铺状态枚举
 */
export enum ShopStatus {
  DISABLED = 0,  // 停用
  ACTIVE = 1,    // 正常
  BANNED = 2,    // 封禁
  PENDING = 3,   // 待解封
  RESERVE = 4,   // 备用
  OTHER = 5      // 其他
}

/**
 * 店铺数据模型接口
 */
export interface Shop {
  id: number;
  unionid?: string;
  openid?: string;
  accountNo?: string;
  wechat?: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  status: ShopStatus;
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建店铺请求参数
 */
export interface CreateShopParams {
  unionid?: string;
  openid?: string;
  accountNo?: string;
  wechat?: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  status?: ShopStatus;
  remark?: string;
}

/**
 * 更新店铺请求参数
 */
export interface UpdateShopParams {
  id: number;
  unionid?: string;
  openid?: string;
  accountNo?: string;
  wechat?: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  status?: ShopStatus;
  remark?: string;
}

/**
 * 查询店铺列表参数
 */
export interface QueryShopsParams {
  keyword?: string;
  status?: ShopStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 店铺列表响应数据
 */
export interface ShopsResponse {
  total: number;
  shops: Shop[];
} 