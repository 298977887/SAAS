/**
 * 数据库连接管理器
 * 作者: 阿瑞
 * 功能: 负责创建、维护和关闭数据库连接
 * 版本: 1.1
 */

import mysql, { Pool, PoolOptions, PoolConnection } from 'mysql2/promise';
import DbConfig from './config';
import db from './init';

/**
 * 数据库连接池管理类
 * 管理系统内的所有数据库连接
 */
export class ConnectionManager {
  /**
   * 连接池映射，键为数据库名称，值为连接池
   */
  private static pools: Map<string, Pool> = new Map();
  
  /**
   * 默认连接池选项
   * 基础连接参数，可根据需求覆盖
   */
  private static defaultPoolOptions: PoolOptions = {
    host: DbConfig.host,
    port: DbConfig.port,
    user: DbConfig.user,
    password: DbConfig.password,
    waitForConnections: true,
    connectionLimit: DbConfig.connectionLimit,
    queueLimit: DbConfig.queueLimit
  };

  /**
   * 初始化数据库和表结构
   * 确保系统所需的数据库和表都已存在
   */
  public static async initialize(): Promise<void> {
    try {
      console.log('开始初始化数据库...');
      // 确保数据库连接
      await db.ensureConnection();
      
      // 初始化所有系统表
      await db.initializeTables();
      
      console.log('数据库初始化完成！');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取主系统数据库连接池
   * 用于处理工作空间、用户和团队相关的操作
   */
  public static getMasterPool(): Pool {
    return db.getPool();
  }
  
  /**
   * 获取指定数据库的连接池
   * 如果连接池不存在则创建新的连接池
   * @param database 数据库名称
   * @param options 可选的连接池配置选项
   * @returns 数据库连接池
   */
  public static getPool(database: string = DbConfig.database, options?: Partial<PoolOptions>): Pool {
    // 如果是主数据库，直接使用Database实例的连接池
    if (database === DbConfig.database) {
      return db.getPool();
    }
    
    // 如果已存在连接池则直接返回
    if (this.pools.has(database)) {
      return this.pools.get(database)!;
    }
    
    // 构建连接池选项
    const poolOptions: PoolOptions = {
      ...this.defaultPoolOptions,
      database,
      ...options
    };
    
    // 创建新的连接池
    const pool = mysql.createPool(poolOptions);
    
    // 缓存连接池实例
    this.pools.set(database, pool);
    
    return pool;
  }

  /**
   * 创建团队数据库连接池
   * 使用团队自身的数据库连接信息创建连接池
   * @param teamConfig 团队数据库配置
   * @returns 数据库连接池
   */
  public static createTeamPool(teamConfig: {
    db_host: string;
    db_name: string;
    db_username: string;
    db_password: string;
    team_code: string;
  }): Pool {
    const { db_host, db_name, db_username, db_password, team_code } = teamConfig;
    
    // 检查是否已存在连接池
    const poolKey = `team_${team_code}`;
    if (this.pools.has(poolKey)) {
      return this.pools.get(poolKey)!;
    }
    
    // 创建团队专用连接池
    const pool = mysql.createPool({
      host: db_host,
      database: db_name,
      user: db_username,
      password: db_password,
      waitForConnections: true,
      connectionLimit: 5, // 团队库连接限制较低
      queueLimit: 0
    });
    
    // 缓存连接池实例
    this.pools.set(poolKey, pool);
    
    return pool;
  }

  /**
   * 测试数据库连接是否有效
   * @param database 数据库名称
   * @returns 连接是否有效
   */
  public static async testConnection(database: string = DbConfig.database): Promise<boolean> {
    try {
      // 如果是主数据库，使用Database实例进行测试
      if (database === DbConfig.database) {
        return await db.ensureConnection();
      }
      
      const pool = this.getPool(database);
      const connection = await pool.getConnection();
      connection.release();
      return true;
    } catch (error) {
      console.error(`测试数据库[${database}]连接失败:`, error);
      return false;
    }
  }

  /**
   * 测试团队数据库连接是否有效
   * @param teamConfig 团队数据库配置
   * @returns 连接是否有效和错误信息
   */
  public static async testTeamConnection(teamConfig: {
    db_host: string;
    db_name: string;
    db_username: string;
    db_password: string;
  }): Promise<{ success: boolean; message?: string }> {
    const { db_host, db_name, db_username, db_password } = teamConfig;
    
    try {
      // 创建临时连接池进行测试
      const tempPool = mysql.createPool({
        host: db_host,
        database: db_name,
        user: db_username,
        password: db_password,
        waitForConnections: true,
        connectionLimit: 1,
        connectTimeout: 5000 // 超时设置为5秒
      });
      
      // 尝试获取连接
      const connection = await tempPool.getConnection();
      connection.release();
      
      // 关闭临时连接池
      await tempPool.end();
      
      return { success: true };
    } catch (error: any) {
      console.error('测试团队数据库连接失败:', error);
      
      // 根据错误类型返回具体的错误信息
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return { success: false, message: '数据库用户名或密码错误' };
      } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
        return { success: false, message: '没有访问数据库的权限' };
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        return { success: false, message: '无法连接到数据库服务器，请检查主机地址' };
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        return { success: false, message: '数据库不存在' };
      }
      
      return { success: false, message: `连接失败: ${error.message}` };
    }
  }

  /**
   * 在事务中执行多个查询操作
   * @param database 数据库名称
   * @param callback 事务回调函数
   * @returns 事务执行结果
   */
  public static async transaction<T>(database: string = DbConfig.database, callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    // 如果是主数据库，使用Database实例的事务方法
    if (database === DbConfig.database) {
      return await db.transaction(callback);
    }
    
    const pool = this.getPool(database);
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 关闭指定数据库的连接池
   * @param database 数据库名称
   */
  public static async closePool(database: string): Promise<void> {
    if (this.pools.has(database)) {
      const pool = this.pools.get(database)!;
      await pool.end();
      this.pools.delete(database);
    }
  }

  /**
   * 关闭所有连接池
   * 应用程序退出前应调用此方法
   */
  public static async closeAllPools(): Promise<void> {
    // 关闭主数据库连接
    try {
      await db.close();
      console.log(`已关闭主数据库连接池`);
    } catch (error) {
      console.error(`关闭主数据库连接池失败:`, error);
    }
    
    // 关闭其他连接池
    for (const [database, pool] of this.pools.entries()) {
      try {
        await pool.end();
        console.log(`已关闭数据库[${database}]连接池`);
      } catch (error) {
        console.error(`关闭数据库[${database}]连接池失败:`, error);
      }
    }
    
    // 清空连接池映射
    this.pools.clear();
  }
} 