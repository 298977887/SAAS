/**
 * 用户-团队关系数据模型
 * 作者: 阿瑞
 * 功能: 提供用户-团队关系数据的CRUD操作
 * 版本: 1.1
 */

import db from '@/lib/db';
import { IUserTeamRelation, ICreateUserTeamRelationParams, IUpdateUserTeamRelationParams, TeamRole } from './types';

/**
 * 用户-团队关系数据模型类
 * 提供对用户-团队关系表的增删改查操作
 */
export class UserTeamRelationModel {
  /**
   * 表名常量
   */
  private static readonly TABLE_NAME = 'user_team_relations';

  /**
   * 获取所有用户-团队关系
   */
  public static async getAll(): Promise<IUserTeamRelation[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<IUserTeamRelation>(`SELECT * FROM ${this.TABLE_NAME}`);
    } catch (error) {
      console.error('获取用户-团队关系列表失败:', error);
      throw new Error('获取用户-团队关系列表失败');
    }
  }

  /**
   * 根据ID获取用户-团队关系
   * @param id 关系ID
   */
  public static async getById(id: number): Promise<IUserTeamRelation | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<IUserTeamRelation>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, 
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取用户-团队关系(ID: ${id})失败:`, error);
      throw new Error(`获取用户-团队关系失败`);
    }
  }

  /**
   * 根据用户ID获取用户的所有团队关系
   * @param userId 用户ID
   */
  public static async getByUserId(userId: number): Promise<IUserTeamRelation[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<IUserTeamRelation>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE user_id = ?`,
        [userId]
      );
    } catch (error) {
      console.error(`获取用户(ID: ${userId})的团队关系列表失败:`, error);
      throw new Error('获取用户的团队关系列表失败');
    }
  }

  /**
   * 根据团队ID获取团队的所有用户关系
   * @param teamId 团队ID
   */
  public static async getByTeamId(teamId: number): Promise<IUserTeamRelation[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<IUserTeamRelation>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE team_id = ?`,
        [teamId]
      );
    } catch (error) {
      console.error(`获取团队(ID: ${teamId})的用户关系列表失败:`, error);
      throw new Error('获取团队的用户关系列表失败');
    }
  }

  /**
   * 获取特定用户在特定团队中的关系
   * @param userId 用户ID
   * @param teamId 团队ID
   */
  public static async getRelation(userId: number, teamId: number): Promise<IUserTeamRelation | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<IUserTeamRelation>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE user_id = ? AND team_id = ?`,
        [userId, teamId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取用户(ID: ${userId})在团队(ID: ${teamId})中的关系失败:`, error);
      throw new Error('获取用户在团队中的关系失败');
    }
  }

  /**
   * 创建新的用户-团队关系
   * @param params 创建参数
   */
  public static async create(params: ICreateUserTeamRelationParams): Promise<number> {
    try {
      const { user_id, team_id, role } = params;
      
      // 使用insert方法创建用户-团队关系
      return await db.insert(this.TABLE_NAME, {
        user_id,
        team_id,
        role,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建用户-团队关系失败:', error);
      throw new Error('创建用户-团队关系失败');
    }
  }

  /**
   * 更新用户-团队关系
   * @param id 关系ID
   * @param params 更新参数
   */
  public static async update(id: number, params: IUpdateUserTeamRelationParams): Promise<boolean> {
    try {
      // 执行更新
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { 
          role: params.role,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`更新用户-团队关系(ID: ${id})失败:`, error);
      throw new Error('更新用户-团队关系失败');
    }
  }

  /**
   * 更新用户在特定团队中的角色
   * @param userId 用户ID
   * @param teamId 团队ID
   * @param role 新角色
   */
  public static async updateRole(userId: number, teamId: number, role: TeamRole): Promise<boolean> {
    try {
      // 执行更新
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { 
          role,
          updated_at: new Date()
        },
        'user_id = ? AND team_id = ?',
        [userId, teamId]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`更新用户(ID: ${userId})在团队(ID: ${teamId})中的角色失败:`, error);
      throw new Error('更新用户在团队中的角色失败');
    }
  }

  /**
   * 删除用户-团队关系
   * @param id 关系ID
   */
  public static async delete(id: number): Promise<boolean> {
    try {
      // 执行删除
      const affectedRows = await db.delete(
        this.TABLE_NAME,
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`删除用户-团队关系(ID: ${id})失败:`, error);
      throw new Error('删除用户-团队关系失败');
    }
  }

  /**
   * 删除用户在特定团队中的关系（将用户从团队中移除）
   * @param userId 用户ID
   * @param teamId 团队ID
   */
  public static async removeUserFromTeam(userId: number, teamId: number): Promise<boolean> {
    try {
      // 执行删除
      const affectedRows = await db.delete(
        this.TABLE_NAME,
        'user_id = ? AND team_id = ?',
        [userId, teamId]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`从团队(ID: ${teamId})中移除用户(ID: ${userId})失败:`, error);
      throw new Error('从团队中移除用户失败');
    }
  }
} 