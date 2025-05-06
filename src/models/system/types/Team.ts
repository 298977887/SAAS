/**
 * 团队接口定义
 * 作者: 阿瑞
 * 功能: 定义团队数据模型接口
 * 版本: 1.0
 */

/**
 * 团队状态枚举
 */
export enum TeamStatus {
  INACTIVE = 0, // 停用
  ACTIVE = 1,   // 正常
}

/**
 * 团队接口定义
 */
export interface ITeam {
  id: number;            // 团队ID（主键）
  team_code: string;     // 团队唯一编码
  name: string;          // 团队名称
  db_host: string;       // 数据库主机地址
  db_name: string;       // 数据库名称
  db_username: string;   // 数据库用户名
  db_password: string;   // 数据库密码
  workspace_id: number;  // 所属工作空间ID
  owner_id: number;      // 团队管理员ID
  status: TeamStatus;    // 状态
  created_at: Date;      // 创建时间
  updated_at?: Date;     // 更新时间
}

/**
 * 创建团队请求参数
 */
export interface ICreateTeamParams {
  team_code: string;     // 团队唯一编码
  name: string;          // 团队名称
  db_host: string;       // 数据库主机地址
  db_name: string;       // 数据库名称
  db_username: string;   // 数据库用户名
  db_password: string;   // 数据库密码
  workspace_id: number;  // 所属工作空间ID
  owner_id: number;      // 团队管理员ID
}

/**
 * 更新团队请求参数
 */
export interface IUpdateTeamParams {
  name?: string;         // 团队名称
  db_host?: string;      // 数据库主机地址
  db_name?: string;      // 数据库名称
  db_username?: string;  // 数据库用户名
  db_password?: string;  // 数据库密码
  owner_id?: number;     // 团队管理员ID
  status?: TeamStatus;   // 状态
} 