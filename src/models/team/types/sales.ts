/**
 * 销售记录数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义销售记录相关的数据结构和接口
 * 版本: 1.0.0
 */

import { Customer } from './customer';
import { Product } from './product';
import { Shop } from './shop';
import { PaymentPlatform } from './payment-platform';

/**
 * 支付类型枚举
 */
export enum PaymentType {
  FULL_PAYMENT = 0,   // 全款
  DEPOSIT = 1,        // 定金
  UNPAID = 2,         // 未付
  FREE = 3,           // 赠送
  OTHER = 4           // 其他
}

/**
 * 销售记录数据模型接口
 */
export interface SalesRecord {
  id: number;
  customerId: number;
  customer?: Customer;
  sourceId?: number;
  source?: Shop;
  guideId?: number;
  paymentType: PaymentType;
  dealDate: string;
  receivable: number;
  received: number;
  pending: number;
  platformId?: number;
  platform?: PaymentPlatform;
  dealShop?: string;
  orderStatus: string[];
  followupDate?: string;
  remark?: string;
  products?: SalesRecordProduct[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 销售记录-产品关联数据模型
 */
export interface SalesRecordProduct {
  id?: number;
  salesRecordId?: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  createdAt?: string;
}

/**
 * 创建销售记录请求参数
 */
export interface CreateSalesRecordParams {
  customerId: number;
  sourceId?: number;
  paymentType: PaymentType;
  dealDate: string;
  receivable: number;
  received: number;
  pending: number;
  platformId?: number;
  dealShop?: string;
  orderStatus?: string[];
  followupDate?: string;
  remark?: string;
  products: {
    productId: number;
    quantity: number;
    price: number;
  }[];
}

/**
 * 更新销售记录请求参数
 */
export interface UpdateSalesRecordParams {
  id: number;
  customerId?: number;
  sourceId?: number;
  paymentType?: PaymentType;
  dealDate?: string;
  receivable?: number;
  received?: number;
  pending?: number;
  platformId?: number;
  dealShop?: string;
  orderStatus?: string[];
  followupDate?: string;
  remark?: string;
  products?: {
    id?: number;
    productId: number;
    quantity: number;
    price: number;
  }[];
}

/**
 * 查询销售记录列表参数
 */
export interface QuerySalesRecordsParams {
  keyword?: string;
  customerId?: number;
  sourceId?: number;
  platformId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 销售记录列表响应数据
 */
export interface SalesRecordsResponse {
  total: number;
  salesRecords: SalesRecord[];
} 