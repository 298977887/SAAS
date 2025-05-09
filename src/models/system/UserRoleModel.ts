/**
 * 用户角色数据模型
 * 作者: 阿瑞
 * 功能: 提供用户角色数据的CRUD操作
 * 版本: 1.1
 */

import db from '@/lib/db';
import { IUserRole, IUserRoleParams, SystemRoleType } from './types';

/**
 * 用户角色数据模型类
 * 提供对用户角色表的增删改查操作
 */
export class UserRoleModel {
  /**
   * 表名常量
   */
  private static readonly TABLE_NAME = 'user_roles';
  
  /**
   * 用户表名常量
   */
  private static readonly USER_TABLE_NAME = 'system_users';

  /**
   * 获取所有系统预设角色
   */
  public static getSystemRoles(): IUserRole[] {
    const systemRoles: IUserRole[] = [
      { type: SystemRoleType.ADMIN, name: '管理员', is_custom: false },
      { type: SystemRoleType.BOSS, name: '老板', is_custom: false },
      { type: SystemRoleType.FINANCE, name: '财务', is_custom: false },
      { type: SystemRoleType.OPERATION, name: '运营', is_custom: false },
      { type: SystemRoleType.CUSTOMER, name: '客服', is_custom: false },
      { type: SystemRoleType.USER, name: '普通用户', is_custom: false }
    ];
    
    return systemRoles;
  }

  /**
   * 获取特定工作空间的所有角色（包括系统预设和自定义角色）
   * @param workspaceId 工作空间ID
   */
  public static async getAllRoles(workspaceId: number): Promise<IUserRole[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 获取系统预设角色
      const systemRoles = this.getSystemRoles();
      
      // 获取自定义角色
      const customRoles = await db.query<IUserRole>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE workspace_id = ? AND is_custom = 1`,
        [workspaceId]
      );
      
      // 合并角色列表
      return [...systemRoles, ...customRoles];
    } catch (error) {
      console.error(`获取工作空间(ID: ${workspaceId})的角色列表失败:`, error);
      throw new Error('获取角色列表失败');
    }
  }

  /**
   * 获取工作空间内所有自定义角色
   * @param workspaceId 工作空间ID
   */
  public static async getCustomRoles(workspaceId: number): Promise<IUserRole[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<IUserRole>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE workspace_id = ? AND is_custom = 1`,
        [workspaceId]
      );
      
      return rows;
    } catch (error) {
      console.error(`获取工作空间(ID: ${workspaceId})的自定义角色列表失败:`, error);
      throw new Error('获取自定义角色列表失败');
    }
  }
  
  /**
   * 根据类型获取角色信息
   * @param type 角色类型
   * @param workspaceId 工作空间ID
   */
  public static async getRoleByType(type: string, workspaceId: number): Promise<IUserRole | null> {
    try {
      // 检查是否为系统预设角色
      const systemRoles = this.getSystemRoles();
      const systemRole = systemRoles.find(role => role.type === type);
      
      if (systemRole) {
        return systemRole;
      }
      
      // 查询自定义角色
      const rows = await db.query<IUserRole>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE type = ? AND workspace_id = ? AND is_custom = 1`,
        [type, workspaceId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取角色(类型: ${type})失败:`, error);
      throw new Error('获取角色失败');
    }
  }
  
  /**
   * 根据ID获取自定义角色
   * @param id 角色ID
   */
  public static async getCustomRoleById(id: number): Promise<IUserRole | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<IUserRole>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ? AND is_custom = 1`,
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取角色(ID: ${id})失败:`, error);
      throw new Error('获取角色失败');
    }
  }

  /**
   * 创建自定义角色
   * @param params 角色参数
   */
  public static async createCustomRole(params: IUserRoleParams): Promise<number> {
    try {
      const { type, name, is_custom, workspace_id } = params;
      
      if (!is_custom) {
        throw new Error('只能创建自定义角色');
      }
      
      // 检查角色类型是否与系统预设角色冲突
      const systemRoles = this.getSystemRoles();
      if (systemRoles.some(role => role.type === type)) {
        throw new Error('角色类型与系统预设角色冲突');
      }
      
      // 检查角色类型是否已存在
      const existingRoles = await db.query<IUserRole>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE type = ? AND workspace_id = ?`,
        [type, workspace_id]
      );
      
      if (existingRoles.length > 0) {
        throw new Error('角色类型已存在');
      }
      
      // 使用insert方法创建角色
      return await db.insert(this.TABLE_NAME, {
        type,
        name,
        is_custom: true,
        workspace_id,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建自定义角色失败:', error);
      throw new Error('创建自定义角色失败');
    }
  }
  
  /**
   * 更新自定义角色名称
   * @param id 角色ID
   * @param name 角色名称
   */
  public static async updateCustomRole(id: number, name: string): Promise<boolean> {
    try {
      // 执行更新
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { 
          name,
          updated_at: new Date() 
        },
        'id = ? AND is_custom = 1',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`更新角色(ID: ${id})失败:`, error);
      throw new Error('更新角色失败');
    }
  }
  
  /**
   * 删除自定义角色
   * @param id 角色ID
   * @param workspaceId 工作空间ID
   */
  public static async deleteCustomRole(id: number, workspaceId: number): Promise<boolean> {
    try {
      // 查找是否有用户使用该角色
      const roleType = await db.query<{type: string}>(
        `SELECT type FROM ${this.TABLE_NAME} WHERE id = ? AND workspace_id = ? AND is_custom = 1`,
        [id, workspaceId]
      );
      
      if (roleType.length === 0) {
        throw new Error('角色不存在');
      }
      
      // 检查是否有用户使用此角色
      const users = await db.query(
        `SELECT * FROM ${this.USER_TABLE_NAME} WHERE role_type = ? AND workspace_id = ?`,
        [roleType[0].type, workspaceId]
      );
      
      if (users.length > 0) {
        throw new Error('该角色正在被用户使用，无法删除');
      }
      
      // 执行删除
      const affectedRows = await db.delete(
        this.TABLE_NAME,
        'id = ? AND workspace_id = ? AND is_custom = 1',
        [id, workspaceId]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`删除角色(ID: ${id})失败:`, error);
      throw new Error('删除角色失败');
    }
  }
  
  /**
   * 迁移旧用户角色数据
   * 将旧系统中的用户角色数据转换为新系统
   * 注意：此方法应该只在系统升级时执行一次
   */
  public static async migrateOldRoleData(): Promise<boolean> {
    try {
      // 检查是否需要迁移（检查系统用户表是否包含新的role_type字段）
      const userTableInfo = await db.query<{Field: string}>(
        `SHOW COLUMNS FROM ${this.USER_TABLE_NAME} LIKE 'role_type'`
      );
      
      // 如果没有role_type字段，说明表结构还没更新，不需要迁移
      if (userTableInfo.length === 0) {
        console.log('用户表结构尚未更新，不需要迁移角色数据');
        return false;
      }
      
      // 检查是否还有旧的role字段
      const oldRoleColumn = await db.query<{Field: string}>(
        `SHOW COLUMNS FROM ${this.USER_TABLE_NAME} LIKE 'role'`
      );
      
      // 如果role字段已不存在，不需要迁移
      if (oldRoleColumn.length === 0) {
        console.log('旧的role字段已不存在，不需要迁移');
        return false;
      }
      
      // 检查是否有包含旧role字段的用户
      const oldRoleUsers = await db.query<{id: number, workspace_id: number}>(
        `SELECT id, workspace_id FROM ${this.USER_TABLE_NAME} 
         WHERE role IS NOT NULL AND (role_type IS NULL OR role_name IS NULL)`
      );
      
      // 如果没有旧数据，不需要迁移
      if (oldRoleUsers.length === 0) {
        console.log('没有找到需要迁移的用户角色数据');
        return false;
      }
      
      console.log(`开始迁移 ${oldRoleUsers.length} 个用户的角色数据...`);
      
      // 迁移每个用户的角色数据
      for (const user of oldRoleUsers) {
        // 获取用户的旧角色
        const userDetails = await db.query<{role: string}>(
          `SELECT role FROM ${this.USER_TABLE_NAME} WHERE id = ?`,
          [user.id]
        );
        
        if (userDetails.length === 0 || !userDetails[0].role) continue;
        
        // 确定角色类型和名称
        const roleType = userDetails[0].role;
        let roleName = '普通用户';
        const isCustomRole = false;
        
        // 根据旧角色确定新的角色名称
        if (roleType === 'admin') {
          roleName = '管理员';
        } else if (roleType === 'user') {
          roleName = '普通用户';
        }
        
        // 更新用户的角色信息
        await db.update(
          this.USER_TABLE_NAME,
          {
            role_type: roleType,
            role_name: roleName,
            is_custom_role: isCustomRole,
            updated_at: new Date()
          },
          'id = ?',
          [user.id]
        );
      }
      
      console.log(`成功迁移 ${oldRoleUsers.length} 个用户的角色数据`);
      return true;
    } catch (error) {
      console.error('迁移用户角色数据失败:', error);
      throw new Error('迁移用户角色数据失败');
    }
  }
} 