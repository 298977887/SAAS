/**
 * 产品数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义产品相关的数据结构和接口
 * 版本: 1.0.0
 */

import { Brand } from './brand';
import { Supplier } from './supplier';

/**
 * 产品成本接口
 */
export interface ProductCost {
  base?: number;    // 基础成本价
  packaging?: number; // 包装费
  shipping?: number;  // 运费
}

/**
 * 产品数据模型接口
 */
export interface Product {
  id: number;
  supplierId?: number;
  supplier?: Supplier;
  brandId?: number;
  brand?: Brand;
  categoryId?: number;
  name: string;
  description?: string;
  code?: string;
  image?: string;
  sku?: string;
  aliases?: string[];
  level?: string;
  cost?: {
    costPrice?: number;
    packagingFee?: number;
    shippingFee?: number;
  };
  price: number;
  stock: number;
  logisticsStatus?: string;
  logisticsDetails?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
  
  // 关联信息（非数据库字段，由API查询填充）
  supplierName?: string;
  brandName?: string;
  categoryName?: string;
}

/**
 * 创建产品请求参数
 */
export interface CreateProductParams {
  supplierId?: number;
  brandId?: number;
  categoryId?: number;
  name: string;
  description?: string;
  code?: string;
  image?: string;
  sku?: string;
  aliases?: string[];
  level?: string;
  cost?: {
    costPrice?: number;
    packagingFee?: number;
    shippingFee?: number;
  };
  price: number;
  stock?: number;
}

/**
 * 更新产品请求参数
 */
export interface UpdateProductParams {
  id: number;
  supplierId?: number;
  brandId?: number;
  categoryId?: number;
  name?: string;
  description?: string;
  code?: string;
  image?: string;
  sku?: string;
  aliases?: string[];
  level?: string;
  cost?: {
    costPrice?: number;
    packagingFee?: number;
    shippingFee?: number;
  };
  price?: number;
  stock?: number;
}

/**
 * 查询产品列表参数
 */
export interface QueryProductsParams {
  keyword?: string;
  supplierId?: number;
  brandId?: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
}

/**
 * 产品列表响应数据
 */
export interface ProductsResponse {
  total: number;
  products: Product[];
} 