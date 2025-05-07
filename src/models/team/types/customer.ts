/**
 * 客户数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义客户相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 客户状态枚举
 */
export enum CustomerStatus {
  INACTIVE = 0, // 未激活/已禁用
  ACTIVE = 1,   // 活跃/正常
}

/**
 * 客户等级枚举
 */
export enum CustomerLevel {
  NORMAL = 1,   // 普通客户
  SILVER = 2,   // 银牌客户
  GOLD = 3,     // 金牌客户
  PLATINUM = 4, // 白金客户
  VIP = 5,      // VIP客户
}

/**
 * 客户性别枚举
 */
export enum CustomerGender {
  MALE = '男',   // 男性
  FEMALE = '女',  // 女性
}

/**
 * 客户来源枚举
 */
export enum CustomerSource {
  UNKNOWN = 0,    // 未知
  REFERRAL = 1,   // 转介绍
  ADVERTISING = 2,// 广告
  SOCIAL = 3,     // 社交媒体
  SEARCH = 4,     // 搜索引擎
  OTHER = 99,     // 其他
}

/**
 * 客户地址接口
 */
export interface CustomerAddress {
  province?: string;  // 省份
  city?: string;      // 城市
  district?: string;  // 区/县
  detail?: string;    // 详细地址
}

/**
 * 客户数据模型接口
 */
export interface Customer {
  id: number;
  name: string;
  phone: string;
  gender?: CustomerGender;
  wechat?: string;
  address?: CustomerAddress;
  birthday?: string;
  followDate?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建客户请求参数
 */
export interface CreateCustomerParams {
  name: string;
  phone: string;
  gender?: CustomerGender;
  wechat?: string;
  address?: CustomerAddress | string;
  birthday?: string;
  followDate?: string;
  balance?: number;
}

/**
 * 更新客户请求参数
 */
export interface UpdateCustomerParams {
  id: number;
  name?: string;
  phone?: string;
  gender?: CustomerGender;
  wechat?: string;
  address?: CustomerAddress | string | null;
  birthday?: string | null;
  followDate?: string | null;
  balance?: number;
}

/**
 * 查询客户列表参数
 */
export interface QueryCustomersParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 客户列表响应数据
 */
export interface CustomersResponse {
  total: number;
  customers: Customer[];
} 