/**
 * 工作空间接口定义
 * 作者: 阿瑞
 * 功能: 定义工作空间数据模型接口
 * 版本: 1.0
 */

/**
 * 工作空间状态枚举
 */
export enum WorkspaceStatus {
  INACTIVE = 0, // 停用
  ACTIVE = 1,   // 活跃
}

/**
 * 工作空间接口定义
 */
export interface IWorkspace {
  id: number;            // 空间ID（主键）
  name: string;          // 空间名称
  creator_id: number;    // 创建者用户ID
  status: WorkspaceStatus; // 状态
  created_at: Date;      // 创建时间
  updated_at?: Date;     // 更新时间
}

/**
 * 创建工作空间请求参数
 */
export interface ICreateWorkspaceParams {
  name: string;          // 空间名称
  creator_id: number;    // 创建者ID
}

/**
 * 更新工作空间请求参数
 */
export interface IUpdateWorkspaceParams {
  name?: string;         // 空间名称
  status?: WorkspaceStatus; // 状态
} 