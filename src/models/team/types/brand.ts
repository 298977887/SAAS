/**
 * 品牌数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义品牌相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 品牌数据模型接口
 */
export interface Brand {
  id: number;
  order: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建品牌请求参数
 */
export interface CreateBrandParams {
  name: string;
  order?: number;
  description?: string;
}

/**
 * 更新品牌请求参数
 */
export interface UpdateBrandParams {
  id: number;
  name?: string;
  order?: number;
  description?: string;
}

/**
 * 查询品牌列表参数
 */
export interface QueryBrandsParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 品牌列表响应数据
 */
export interface BrandsResponse {
  total: number;
  brands: Brand[];
} 