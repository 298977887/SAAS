/**
 * 品类数据模型类型定义
 * 作者: 阿瑞
 * 功能: 定义品类相关的数据结构和接口
 * 版本: 1.0.0
 */

/**
 * 品类数据模型接口
 */
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建品类请求参数
 */
export interface CreateCategoryParams {
  name: string;
  description?: string;
  icon?: string;
}

/**
 * 更新品类请求参数
 */
export interface UpdateCategoryParams {
  id: number;
  name?: string;
  description?: string;
  icon?: string;
}

/**
 * 查询品类列表参数
 */
export interface QueryCategoriesParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 品类列表响应数据
 */
export interface CategoriesResponse {
  total: number;
  categories: Category[];
} 