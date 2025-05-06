/**
 * 团队数据模型
 * 作者: 阿瑞
 * 功能: 提供团队数据的CRUD操作
 * 版本: 1.1
 */

import db from '@/lib/db';
import { ITeam, ICreateTeamParams, IUpdateTeamParams, TeamStatus } from './types';

/**
 * 团队数据模型类
 * 提供对团队表的增删改查操作
 */
export class TeamModel {
  /**
   * 表名常量
   */
  private static readonly TABLE_NAME = 'teams';

  /**
   * 获取所有团队列表
   */
  public static async getAll(): Promise<ITeam[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<ITeam>(`SELECT * FROM ${this.TABLE_NAME}`);
    } catch (error) {
      console.error('获取团队列表失败:', error);
      throw new Error('获取团队列表失败');
    }
  }

  /**
   * 根据工作空间ID获取团队列表
   * @param workspaceId 工作空间ID
   */
  public static async getByWorkspace(workspaceId: number): Promise<ITeam[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<ITeam>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE workspace_id = ?`,
        [workspaceId]
      );
    } catch (error) {
      console.error(`获取工作空间(ID: ${workspaceId})的团队列表失败:`, error);
      throw new Error('获取工作空间团队列表失败');
    }
  }

  /**
   * 根据ID获取团队
   * @param id 团队ID
   */
  public static async getById(id: number): Promise<ITeam | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ITeam>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, 
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取团队(ID: ${id})失败:`, error);
      throw new Error(`获取团队失败`);
    }
  }

  /**
   * 根据团队编码获取团队
   * @param teamCode 团队编码
   */
  public static async getByTeamCode(teamCode: string): Promise<ITeam | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<ITeam>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE team_code = ?`, 
        [teamCode]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取团队(团队编码: ${teamCode})失败:`, error);
      throw new Error(`获取团队失败`);
    }
  }

  /**
   * 根据拥有者ID获取团队列表
   * @param ownerId 拥有者ID
   */
  public static async getByOwner(ownerId: number): Promise<ITeam[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<ITeam>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE owner_id = ?`,
        [ownerId]
      );
    } catch (error) {
      console.error(`获取拥有者(ID: ${ownerId})的团队列表失败:`, error);
      throw new Error('获取拥有者团队列表失败');
    }
  }

  /**
   * 创建新团队
   * @param params 创建参数
   */
  public static async create(params: ICreateTeamParams): Promise<number> {
    try {
      const { 
        team_code, 
        name, 
        db_host, 
        db_name, 
        db_username, 
        db_password,
        workspace_id,
        owner_id
      } = params;
      
      // 使用insert方法创建团队
      return await db.insert(this.TABLE_NAME, {
        team_code,
        name,
        db_host,
        db_name,
        db_username,
        db_password,
        workspace_id,
        owner_id,
        status: TeamStatus.ACTIVE,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建团队失败:', error);
      throw new Error('创建团队失败');
    }
  }

  /**
   * 更新团队信息
   * @param id 团队ID
   * @param params 更新参数
   */
  public static async update(id: number, params: IUpdateTeamParams): Promise<boolean> {
    try {
      // 构建更新数据
      const updateData: Record<string, any> = {};
      
      if (params.name !== undefined) updateData.name = params.name;
      if (params.db_host !== undefined) updateData.db_host = params.db_host;
      if (params.db_name !== undefined) updateData.db_name = params.db_name;
      if (params.db_username !== undefined) updateData.db_username = params.db_username;
      if (params.db_password !== undefined) updateData.db_password = params.db_password;
      if (params.owner_id !== undefined) updateData.owner_id = params.owner_id;
      if (params.status !== undefined) updateData.status = params.status;
      
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
      console.error(`更新团队(ID: ${id})失败:`, error);
      throw new Error('更新团队失败');
    }
  }

  /**
   * 停用团队（设置状态为停用）
   * @param id 团队ID
   */
  public static async disable(id: number): Promise<boolean> {
    try {
      // 执行逻辑停用操作，将状态设为停用
      const affectedRows = await db.update(
        this.TABLE_NAME,
        {
          status: TeamStatus.INACTIVE,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`停用团队(ID: ${id})失败:`, error);
      throw new Error('停用团队失败');
    }
  }
} 