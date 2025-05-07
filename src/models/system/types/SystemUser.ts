/**
 * 系统用户接口定义
 * 作者: 阿瑞
 * 功能: 定义系统用户数据模型接口
 * 版本: 1.1
 */

/**
 * 用户状态枚举
 */
export enum UserStatus {
  DISABLED = 0, // 禁用
  ENABLED = 1,  // 启用
}

/**
 * 系统预设角色枚举
 */
export enum SystemRoleType {
  ADMIN = 'admin',       // 管理员
  BOSS = 'boss',         // 老板
  FINANCE = 'finance',   // 财务
  OPERATION = 'operation', // 运营
  CUSTOMER = 'customer', // 客服
  USER = 'user',         // 普通用户
}

/**
 * 用户角色接口定义
 */
export interface IUserRole {
  type: string;          // 角色类型，可以是SystemRoleType或自定义值
  name: string;          // 角色显示名称
  is_custom: boolean;    // 是否为自定义角色
}

/**
 * 系统用户接口定义
 */
export interface ISystemUser {
  id: number;              // 用户ID（主键）
  username: string;        // 登录用户名
  password: string;        // 加密密码
  email: string;           // 电子邮箱
  phone: string;           // 手机号码
  workspace_id: number;    // 所属工作空间ID
  role_type: string;       // 系统角色类型
  role_name: string;       // 角色显示名称
  is_custom_role: boolean; // 是否为自定义角色
  status: UserStatus;      // 状态
  invited_by?: number;     // 邀请人ID
  invitation_token?: string; // 邀请验证令牌
  last_login_at?: Date;    // 最后登录时间
  created_at: Date;        // 创建时间
  updated_at?: Date;       // 更新时间
}

/**
 * 创建用户请求参数
 */
export interface ICreateUserParams {
  username: string;        // 登录用户名
  password: string;        // 密码
  email: string;           // 电子邮箱
  phone: string;           // 手机号码
  workspace_id: number;    // 所属工作空间ID
  role_type?: string;      // 角色类型
  role_name?: string;      // 角色显示名称
  is_custom_role?: boolean; // 是否为自定义角色
  invited_by?: number;     // 邀请人ID
  invitation_token?: string; // 邀请验证令牌
}

/**
 * 更新用户请求参数
 */
export interface IUpdateUserParams {
  username?: string;       // 登录用户名
  password?: string;       // 密码
  email?: string;          // 电子邮箱
  phone?: string;          // 手机号码
  role_type?: string;      // 角色类型
  role_name?: string;      // 角色显示名称
  is_custom_role?: boolean; // 是否为自定义角色
  status?: UserStatus;     // 状态
  last_login_at?: Date;    // 最后登录时间
}

/**
 * 系统角色创建/更新参数
 */
export interface IUserRoleParams {
  type: string;           // 角色类型
  name: string;           // 角色显示名称
  is_custom: boolean;     // 是否为自定义角色
  workspace_id: number;   // 所属工作空间ID
} 