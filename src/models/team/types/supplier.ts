/**
 * 供应商数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义供应商相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 供应商状态枚举
 */
export enum SupplierStatus {
  DISABLED = 0,  // 停用
  NORMAL = 1,    // 正常
  EXCEPTION = 2, // 异常
  BACKUP = 3     // 备用
}

/**
 * 供应商联系方式接口
 */
export interface SupplierContact {
  phone?: string;
  contactPerson?: string;
  address?: string;
}

/**
 * 供应商数据模型接口
 */
export interface Supplier {
  id: number;
  order: number;
  name: string;
  contact?: SupplierContact;
  status: SupplierStatus;
  level?: string;
  type?: string;
  remark?: string;
  categories?: number[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建供应商请求参数
 */
export interface CreateSupplierParams {
  order?: number;
  name: string;
  contact?: SupplierContact;
  status?: SupplierStatus;
  level?: string;
  type?: string;
  remark?: string;
  categories?: number[];
}

/**
 * 更新供应商请求参数
 */
export interface UpdateSupplierParams {
  id: number;
  order?: number;
  name?: string;
  contact?: SupplierContact;
  status?: SupplierStatus;
  level?: string;
  type?: string;
  remark?: string;
  categories?: number[];
}

/**
 * 查询供应商列表参数
 */
export interface QuerySuppliersParams {
  keyword?: string;
  status?: SupplierStatus;
  categoryId?: number;
  level?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 供应商列表响应数据
 */
export interface SuppliersResponse {
  total: number;
  suppliers: Supplier[];
} 