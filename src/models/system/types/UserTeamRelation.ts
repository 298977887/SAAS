/**
 * 用户-团队关系接口定义
 * 作者: 阿瑞
 * 功能: 定义用户与团队之间的关系数据模型接口
 * 版本: 1.0
 */

/**
 * 用户团队角色枚举
 */
export enum TeamRole {
  OWNER = 'owner',   // 拥有者
  ADMIN = 'admin',   // 管理员
  MEMBER = 'member', // 成员
}

/**
 * 用户-团队关系接口定义
 */
export interface IUserTeamRelation {
  id: number;        // 关系ID（主键）
  user_id: number;   // 用户ID
  team_id: number;   // 团队ID
  role: TeamRole;    // 角色
  created_at: Date;  // 创建时间
  updated_at?: Date; // 更新时间
}

/**
 * 创建用户-团队关系请求参数
 */
export interface ICreateUserTeamRelationParams {
  user_id: number;   // 用户ID
  team_id: number;   // 团队ID
  role: TeamRole;    // 角色
}

/**
 * 更新用户-团队关系请求参数
 */
export interface IUpdateUserTeamRelationParams {
  role: TeamRole;    // 角色
} 