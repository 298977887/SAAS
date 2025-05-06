/**
 * 工作空间数据模型
 * 作者: 阿瑞
 * 功能: 提供工作空间数据的CRUD操作
 * 版本: 1.1
 */

import db from '@/lib/db';
import { IWorkspace, ICreateWorkspaceParams, IUpdateWorkspaceParams, WorkspaceStatus } from './types';

/**
 * 工作空间数据模型类
 * 提供对工作空间表的增删改查操作
 */
export class WorkspaceModel {
  /**
   * 表名常量
   */
  private static readonly TABLE_NAME = 'workspaces';

  /**
   * 获取所有工作空间列表
   */
  public static async getAll(): Promise<IWorkspace[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<IWorkspace>(`SELECT * FROM ${this.TABLE_NAME}`);
    } catch (error) {
      console.error('获取工作空间列表失败:', error);
      throw new Error('获取工作空间列表失败');
    }
  }

  /**
   * 根据ID获取工作空间
   * @param id 工作空间ID
   */
  public static async getById(id: number): Promise<IWorkspace | null> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      const rows = await db.query<IWorkspace>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE id = ?`, 
        [id]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`获取工作空间(ID: ${id})失败:`, error);
      throw new Error(`获取工作空间失败`);
    }
  }

  /**
   * 根据创建者ID获取工作空间列表
   * @param creatorId 创建者用户ID
   */
  public static async getByCreator(creatorId: number): Promise<IWorkspace[]> {
    try {
      // 确保表存在
      await db.ensureTable(this.TABLE_NAME);
      
      // 执行查询
      return await db.query<IWorkspace>(
        `SELECT * FROM ${this.TABLE_NAME} WHERE creator_id = ?`, 
        [creatorId]
      );
    } catch (error) {
      console.error(`获取创建者(ID: ${creatorId})的工作空间列表失败:`, error);
      throw new Error('获取创建者的工作空间列表失败');
    }
  }

  /**
   * 创建新工作空间
   * @param params 创建参数
   */
  public static async create(params: ICreateWorkspaceParams): Promise<number> {
    try {
      const { name, creator_id } = params;
      
      // 使用insert方法创建工作空间
      return await db.insert(this.TABLE_NAME, {
        name, 
        creator_id, 
        status: WorkspaceStatus.ACTIVE,
        created_at: new Date()
      });
    } catch (error) {
      console.error('创建工作空间失败:', error);
      throw new Error('创建工作空间失败');
    }
  }

  /**
   * 更新工作空间信息
   * @param id 工作空间ID
   * @param params 更新参数
   */
  public static async update(id: number, params: IUpdateWorkspaceParams): Promise<boolean> {
    try {
      // 构建更新数据
      const updateData: Record<string, any> = {};
      
      if (params.name !== undefined) updateData.name = params.name;
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
      console.error(`更新工作空间(ID: ${id})失败:`, error);
      throw new Error('更新工作空间失败');
    }
  }

  /**
   * 逻辑删除工作空间（设置状态为停用）
   * @param id 工作空间ID
   */
  public static async delete(id: number): Promise<boolean> {
    try {
      // 执行逻辑删除操作，将状态设为停用
      const affectedRows = await db.update(
        this.TABLE_NAME,
        { 
          status: WorkspaceStatus.INACTIVE,
          updated_at: new Date()
        },
        'id = ?',
        [id]
      );
      
      return affectedRows > 0;
    } catch (error) {
      console.error(`删除工作空间(ID: ${id})失败:`, error);
      throw new Error('删除工作空间失败');
    }
  }
} 