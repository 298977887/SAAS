/**
 * 支付平台数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义支付平台相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 支付平台状态枚举
 */
export enum PaymentPlatformStatus {
  DISABLED = 0, // 停用
  ACTIVE = 1,   // 正常
  STANDBY = 2,  // 备用
  OTHER = 3     // 其他
}

/**
 * 支付平台数据模型接口
 */
export interface PaymentPlatform {
  id: number;
  order: number;
  name: string;
  description?: string;
  status: PaymentPlatformStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建支付平台请求参数
 */
export interface CreatePaymentPlatformParams {
  name: string;
  order: number;
  description?: string;
  status?: PaymentPlatformStatus;
}

/**
 * 更新支付平台请求参数
 */
export interface UpdatePaymentPlatformParams {
  id: number;
  name?: string;
  order?: number;
  description?: string;
  status?: PaymentPlatformStatus;
}

/**
 * 查询支付平台列表参数
 */
export interface QueryPaymentPlatformsParams {
  keyword?: string;
  status?: PaymentPlatformStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 支付平台列表响应数据
 */
export interface PaymentPlatformsResponse {
  total: number;
  paymentPlatforms: PaymentPlatform[];
} 