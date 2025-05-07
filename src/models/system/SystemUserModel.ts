/**
 * 系统用户数据模型
 * 作者: 阿瑞
 * 功能: 提供系统用户数据的CRUD操作
 * 版本: 1.3
 */

import db from '@/lib/db';
import { 
  ISystemUser, 
  ICreateUserParams, 
  IUpdateUserParams, 
  UserStatus, 
  SystemRoleType
} from './types';

/**
 * 系统用户数据模型类
 * 提供对系统用户表的增删改查操作
 */
export class SystemUserModel {
  /**
   * 表名常量
   */
  private static readonly TABLE_NAME = 'system_users';

  /**
   * 获取所有系统用户列表
   */
  public static async getAll(): Promise<ISystemUser[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ISystemUser>(
        `SELECT * FROM ${this.TABLE_NAME}`
      );
      
      return rows;
    } catch (error) {
      console.error('获取系统用户列表失败:', error);
      throw new Error('获取系统用户列表失败');
    }
  }

  /**
   * 按工作空间ID获取用户列表
   * @param workspaceId 工作空间ID
   */
  public static async getByWorkspace(workspaceId: number): Promise<ISystemUser[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ISystemUser>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE workspace_id = ?`,
        [workspaceId]
      );
      
      return rows;
    } catch (error) {
      console.error(`获取工作空间(ID: ${workspaceId})的用户列表失败:`, error);
      throw new Error('获取工作空间用户列表失败');
    }
  }

  /**
   * 根据ID获取系统用户
   * @param id 用户ID
   */
  public static async getById(id: number): Promise<ISystemUser | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ISystemUser>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, 
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取用户(ID: ${id})失败:`, error);
      throw new Error(`获取用户失败`);
    }
  }

  /**
   * 根据用户名获取系统用户
   * @param username 用户名
   */
  public static async getByUsername(username: string): Promise<ISystemUser | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ISystemUser>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE username = ?`, 
        [username]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取用户(用户名: ${username})失败:`, error);
      throw new Error(`获取用户失败`);
    }
  }

  /**
   * 根据邮箱获取系统用户
   * @param email 邮箱
   */
  public static async getByEmail(email: string): Promise<ISystemUser | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ISystemUser>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE email = ?`, 
        [email]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取用户(邮箱: ${email})失败:`, error);
      throw new Error(`获取用户失败`);
    }
  }

  /**
   * 创建新系统用户
   * @param params 创建参数
   */
  public static async create(params: ICreateUserParams): Promise<number> {
    try {
      const { 
        username, 
        password, 
        email, 
        phone, 
        workspace_id, 
        role_type = SystemRoleType.USER,
        role_name = '普通用户',
        is_custom_role = false,
        invited_by = null, 
        invitation_token = null 
      } = params;
      
      // 使用insert方法创建用户
      return await db.insert(this.TABLE_NAME, {
        username,
        password,
        email,
        phone,
        workspace_id,
        role_type,
        role_name,
        is_custom_role,
        status: UserStatus.ENABLED,
        invited_by,
        invitation_token,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建系统用户失败:', error);
      throw new Error('创建系统用户失败');
    }
  }

  /**
   * 更新系统用户信息
   * @param id 用户ID
   * @param params 更新参数
   */
  public static async update(id: number, params: IUpdateUserParams): Promise<boolean> {
    try {
      // 构建更新数据
      const updateData: Record<string, any> = {};
      
      if (params.username !== undefined) updateData.username = params.username;
      if (params.password !== undefined) updateData.password = params.password;
      if (params.email !== undefined) updateData.email = params.email;
      if (params.phone !== undefined) updateData.phone = params.phone;
      if (params.role_type !== undefined) updateData.role_type = params.role_type;
      if (params.role_name !== undefined) updateData.role_name = params.role_name;
      if (params.is_custom_role !== undefined) updateData.is_custom_role = params.is_custom_role;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.last_login_at !== undefined) updateData.last_login_at = params.last_login_at;
      
      // 添加更新时间
      updateData.updated_at = new Date();
      
      // 没有更新字段则直接返回成功
      if (Object.keys(updateData).length === 0) {
        return true;
      }
      
      // 执行更新
      const affectedRows = await db.update(
        this.TABLE_NAME,
        updateData,
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`更新用户(ID: ${id})失败:`, error);
      throw new Error('更新用户失败');
    }
  }

  /**
   * 更新用户最后登录时间
   * @param id 用户ID
   */
  public static async updateLastLogin(id: number): Promise<boolean> {
    try {
      // 更新最后登录时间为当前时间
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { last_login_at: new Date(), updated_at: new Date() },
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`更新用户(ID: ${id})最后登录时间失败:`, error);
      throw new Error('更新用户最后登录时间失败');
    }
  }

  /**
   * 禁用系统用户
   * @param id 用户ID
   */
  public static async disable(id: number): Promise<boolean> {
    try {
      // 禁用用户
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { status: UserStatus.DISABLED, updated_at: new Date() },
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`禁用用户(ID: ${id})失败:`, error);
      throw new Error('禁用用户失败');
    }
  }
} 