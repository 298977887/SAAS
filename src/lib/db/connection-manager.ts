/**
 * 数据库连接管理器
 * 作者: 阿瑞
 * 功能: 负责创建、维护和关闭系统数据库连接
 * 版本: 1.3
 */

import mysql, { Pool, PoolOptions, PoolConnection } from 'mysql2/promise';
import DbConfig from './config';
import db from './init';

/**
 * 连接池使用统计接口
 */
export interface PoolStats {
  acquiredConnections: number;
  totalConnections: number;
  idleConnections: number;
  pendingRequests: number;
  lastUsed: number;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  errorCount: number;
  lastError?: Error;
  lastErrorTime?: number;
}

/**
 * 系统数据库连接池管理类
 * 管理系统内的所有基础数据库连接
 */
export class ConnectionManager {
  /**
   * 连接池映射，键为数据库名称，值为连接池
   */
  private static pools: Map<string, Pool> = new Map();
  
  /**
   * 连接池使用统计
   */
  private static poolStats: Map<string, PoolStats> = new Map();
  
  /**
   * 连接池最后使用时间，用于清理不活跃的连接池
   */
  private static poolLastUsed: Map<string, number> = new Map();
  
  /**
   * 连接池清理间隔定时器
   */
  private static cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * 健康检查间隔定时器
   */
  private static healthCheckInterval: NodeJS.Timeout | null = null;
  
  /**
   * 当前处于高负载状态
   */
  private static isHighLoad: boolean = false;
  
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
    queueLimit: DbConfig.queueLimit,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: DbConfig.idleTimeout
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
      
      // 启动健康检查
      this.startHealthCheck();
      
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
      // 更新最后使用时间
      this.poolLastUsed.set(database, Date.now());
      return this.pools.get(database)!;
    }
    
    // 检查系统负载状态，如果负载高则适当减少连接限制
    const connectionLimit = this.isHighLoad 
      ? Math.max(5, Math.floor((options?.connectionLimit || DbConfig.connectionLimit) * 0.7))
      : (options?.connectionLimit || DbConfig.connectionLimit);
      
    // 构建连接池选项
    const poolOptions: PoolOptions = {
      ...this.defaultPoolOptions,
      database,
      connectionLimit,
      ...options
    };
    
    // 创建新的连接池
    const pool = mysql.createPool(poolOptions);
    
    // 初始化统计信息
    this.poolStats.set(database, {
      acquiredConnections: 0,
      totalConnections: 0,
      idleConnections: 0,
      pendingRequests: 0,
      lastUsed: Date.now(),
      healthStatus: 'healthy',
      errorCount: 0
    });
    
    // 缓存连接池实例
    this.pools.set(database, pool);
    this.poolLastUsed.set(database, Date.now());
    
    // 设置事件监听器进行连接统计
    this.setupPoolMonitoring(database, pool);
    
    return pool;
  }

  /**
   * 为连接池设置监控
   * @param poolKey 连接池键
   * @param pool 连接池实例
   */
  private static setupPoolMonitoring(poolKey: string, pool: Pool): void {
    const stats = this.poolStats.get(poolKey)!;
    
    pool.on('connection', () => {
      stats.totalConnections++;
      this.poolStats.set(poolKey, stats);
    });
    
    pool.on('acquire', () => {
      stats.acquiredConnections++;
      this.poolStats.set(poolKey, stats);
    });
    
    pool.on('release', () => {
      stats.acquiredConnections = Math.max(0, stats.acquiredConnections - 1);
      stats.idleConnections++;
      this.poolStats.set(poolKey, stats);
    });
    
    pool.on('enqueue', () => {
      stats.pendingRequests++;
      this.poolStats.set(poolKey, stats);
      
      // 只在开发环境记录高负载日志
      if (stats.pendingRequests > DbConfig.queueLimit * 0.8) {
        this.isHighLoad = true;
        if (process.env.NODE_ENV === 'development') {
          console.log(`数据库连接池[${poolKey}]处于高负载状态`);
        }
      }
    });
    
    // 监听错误事件
    (pool as any).on('error', (err: Error) => {
      stats.errorCount++;
      stats.lastError = err;
      stats.lastErrorTime = Date.now();
      
      if (stats.errorCount > 5) {
        stats.healthStatus = 'critical';
      } else if (stats.errorCount > 2) {
        stats.healthStatus = 'degraded';
      }
      
      this.poolStats.set(poolKey, stats);
      console.error(`数据库连接池 ${poolKey} 发生错误:`, err);
    });
  }

  /**
   * 启动连接池清理定时器
   * 定期检查不活跃的连接池并关闭
   */
  private static startPoolCleanup(): void {
    if (this.cleanupInterval === null) {
      console.log('启动连接池自动清理定时器');
      this.cleanupInterval = setInterval(() => {
        this.cleanupUnusedPools();
      }, 5 * 60 * 1000); // 每5分钟执行一次清理
    }
  }

  /**
   * 启动健康检查定时器
   * 定期检查连接池的健康状态
   */
  private static startHealthCheck(): void {
    if (this.healthCheckInterval === null) {
      console.log('启动连接池健康检查定时器');
      this.healthCheckInterval = setInterval(() => {
        this.checkPoolsHealth();
      }, 30 * 1000); // 每30秒检查一次
    }
  }

  /**
   * 检查所有连接池的健康状态
   */
  private static async checkPoolsHealth(): Promise<void> {
    // 恢复负载状态
    let hasHighLoad = false;
    
    for (const [poolKey, pool] of this.pools.entries()) {
      try {
        // 获取连接池状态
        const stats = this.poolStats.get(poolKey) || {
          acquiredConnections: 0,
          totalConnections: 0,
          idleConnections: 0,
          pendingRequests: 0,
          lastUsed: Date.now(),
          healthStatus: 'healthy',
          errorCount: 0
        };
        
        // 检查连接池是否过载
        if (stats.pendingRequests > 0 || stats.acquiredConnections > stats.totalConnections * 0.8) {
          hasHighLoad = true;
        }
        
        // 尝试简单查询测试连接
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        
        // 连接成功，重置错误计数
        if (stats.errorCount > 0) {
          stats.errorCount = Math.max(0, stats.errorCount - 1);
          if (stats.errorCount < 3) {
            stats.healthStatus = 'healthy';
          }
        }
        
        this.poolStats.set(poolKey, stats);
      } catch (error) {
        console.error(`连接池 ${poolKey} 健康检查失败:`, error);
        
        // 更新错误统计
        const stats = this.poolStats.get(poolKey)!;
        stats.errorCount++;
        stats.lastError = error as Error;
        stats.lastErrorTime = Date.now();
        
        if (stats.errorCount > 5) {
          stats.healthStatus = 'critical';
          // 尝试重新初始化连接池
          this.recreatePool(poolKey);
        } else if (stats.errorCount > 2) {
          stats.healthStatus = 'degraded';
        }
        
        this.poolStats.set(poolKey, stats);
      }
    }
    
    // 更新系统负载状态
    this.isHighLoad = hasHighLoad;
    
    // 输出健康状态报告
    if (hasHighLoad) {
      console.warn('数据库连接池处于高负载状态');
    }
  }

  /**
   * 重新创建问题连接池
   * @param poolKey 连接池键
   */
  private static async recreatePool(poolKey: string): Promise<void> {
    try {
      console.log(`尝试重新创建连接池 ${poolKey}`);
      
      // 关闭现有连接池
      const oldPool = this.pools.get(poolKey);
      if (oldPool) {
        await oldPool.end();
      }
      
      // 如果是主连接池，通过db实例重新初始化
      if (poolKey === DbConfig.database) {
        await db.ensureConnection();
        return;
      }
      
      // 移除现有连接池记录
      this.pools.delete(poolKey);
      this.poolStats.delete(poolKey);
      this.poolLastUsed.delete(poolKey);
      
      // 注：团队连接池的重建由TeamConnectionManager负责，不在此处处理
    } catch (error) {
      console.error(`重新创建连接池 ${poolKey} 失败:`, error);
    }
  }

  /**
   * 清理不活跃的连接池
   * 关闭30分钟未使用的连接池
   */
  private static async cleanupUnusedPools(): Promise<void> {
    console.log('开始清理不活跃的连接池');
    
    const now = Date.now();
    const inactiveTime = 30 * 60 * 1000; // 30分钟未使用视为不活跃
    
    for (const [poolKey, lastUsed] of this.poolLastUsed.entries()) {
      // 跳过主数据库连接池
      if (poolKey === DbConfig.database) {
        continue;
      }
      
      // 跳过团队连接池，由TeamConnectionManager管理
      if (poolKey.startsWith('team_')) {
        continue;
      }
      
      // 如果连接池超过不活跃时间，则关闭并移除
      if (now - lastUsed > inactiveTime) {
        console.log(`清理不活跃连接池: ${poolKey}, 上次使用时间: ${new Date(lastUsed).toLocaleString()}`);
        
        try {
          await this.closePool(poolKey);
        } catch (error) {
          console.error(`关闭连接池 ${poolKey} 失败:`, error);
        }
      }
    }
  }

  /**
   * 测试数据库连接
   * @param database 数据库名称
   * @returns 连接是否成功
   */
  public static async testConnection(database: string = DbConfig.database): Promise<boolean> {
    let testPool: Pool | null = null;
    let connection: PoolConnection | null = null;
    
    try {
      // 使用短期连接池进行测试
      testPool = mysql.createPool({
        host: DbConfig.host,
        port: DbConfig.port,
        user: DbConfig.user,
        password: DbConfig.password,
        database,
        connectionLimit: 1,
        connectTimeout: 5000
      });
      
      // 获取连接并执行简单查询
      connection = await testPool.getConnection();
      await connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error(`测试数据库 ${database} 连接失败:`, error);
      return false;
    } finally {
      // 释放资源
      if (connection) {
        connection.release();
      }
      if (testPool) {
        await testPool.end();
      }
    }
  }

  /**
   * 在事务中执行回调函数
   * @param database 数据库名称
   * @param callback 事务回调函数
   * @returns 回调函数返回值
   */
  public static async transaction<T>(
    database: string = DbConfig.database, 
    callback: (connection: PoolConnection) => Promise<T>,
    retries: number = DbConfig.maxRetries
  ): Promise<T> {
    const pool = this.getPool(database);
    let connection: PoolConnection | null = null;
    let attempts = 0;
    
    while (attempts <= retries) {
      try {
        // 获取连接
        connection = await pool.getConnection();
        
        // 开始事务
        await connection.beginTransaction();
        
        // 执行回调
        const result = await callback(connection);
        
        // 提交事务
        await connection.commit();
        
        return result;
      } catch (error: any) {
        attempts++;
        
        // 回滚事务
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error('事务回滚失败:', rollbackError);
          }
        }
        
        // 检查是否可以重试（针对连接和死锁错误）
        const retryableError = 
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ER_LOCK_DEADLOCK' ||
          error.errno === 1213 || // 死锁错误码
          error.message.includes('deadlock');
        
        if (retryableError && attempts <= retries) {
          console.warn(`事务执行失败，准备第${attempts}次重试:`, error.message);
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, DbConfig.retryDelay * Math.pow(2, attempts - 1)));
          continue;
        }
        
        // 无法重试或重试次数耗尽
        console.error('事务执行失败:', error);
        throw error;
      } finally {
        // 释放连接
        if (connection) {
          connection.release();
        }
      }
    }
    
    // 这里应该永远不会执行到，但TypeScript需要返回类型
    throw new Error('事务执行失败: 超出最大重试次数');
  }

  /**
   * 关闭指定的连接池
   * @param database 数据库名称
   */
  public static async closePool(database: string): Promise<void> {
    if (this.pools.has(database)) {
      const pool = this.pools.get(database)!;
      
      try {
        await pool.end();
        this.pools.delete(database);
        this.poolLastUsed.delete(database);
        this.poolStats.delete(database);
        console.log(`连接池 ${database} 已关闭`);
      } catch (error) {
        console.error(`关闭连接池 ${database} 失败:`, error);
        throw error;
      }
    }
  }

  /**
   * 关闭所有连接池
   */
  public static async closeAllPools(): Promise<void> {
    console.log('关闭所有数据库连接池...');
    
    const closePromises: Promise<void>[] = [];
    
    for (const [database, pool] of this.pools.entries()) {
      // 跳过团队连接池，由TeamConnectionManager负责关闭
      if (database.startsWith('team_')) {
        continue;
      }
      
      closePromises.push(
        pool.end()
          .then(() => console.log(`连接池 ${database} 已关闭`))
          .catch(error => console.error(`关闭连接池 ${database} 失败:`, error))
      );
    }
    
    await Promise.allSettled(closePromises);
    
    // 只清理非团队连接池
    for (const key of [...this.pools.keys()]) {
      if (!key.startsWith('team_')) {
        this.pools.delete(key);
        this.poolLastUsed.delete(key);
        this.poolStats.delete(key);
      }
    }
    
    // 清除定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    console.log('所有系统数据库连接池已关闭');
  }
  
  /**
   * 获取连接池统计信息
   * @param poolKey 连接池键名
   * @returns 连接池统计信息
   */
  public static getPoolStats(poolKey?: string): PoolStats | Record<string, PoolStats> {
    if (poolKey && this.poolStats.has(poolKey)) {
      return this.poolStats.get(poolKey)!;
    }
    
    // 返回所有连接池统计信息（只返回系统连接池信息）
    const allStats: Record<string, PoolStats> = {};
    for (const [key, stats] of this.poolStats.entries()) {
      // 不包括团队连接池，团队连接池由TeamConnectionManager管理
      if (!key.startsWith('team_')) {
        allStats[key] = stats;
      }
    }
    
    return allStats;
  }
  
  /**
   * 重置连接池
   * 用于在负载过高或错误过多时重新创建连接池
   * @param poolKey 连接池键名
   */
  public static async resetPool(poolKey: string): Promise<void> {
    // 只处理系统连接池
    if (!poolKey.startsWith('team_')) {
      await this.recreatePool(poolKey);
    }
  }

  /**
   * 检查连接池是否存在
   * @param poolKey 连接池键名
   * @returns 是否存在
   */
  public static hasPool(poolKey: string): boolean {
    return this.pools.has(poolKey);
  }
  
  /**
   * 获取已存在的连接池并更新最后使用时间
   * @param poolKey 连接池键名
   * @returns 连接池
   */
  public static getExistingPool(poolKey: string): Pool {
    if (!this.pools.has(poolKey)) {
      throw new Error(`连接池[${poolKey}]不存在`);
    }
    
    // 更新最后使用时间
    this.poolLastUsed.set(poolKey, Date.now());
    return this.pools.get(poolKey)!;
  }
  
  /**
   * 检查是否处于高负载模式
   * @returns 是否高负载
   */
  public static isHighLoadMode(): boolean {
    return this.isHighLoad;
  }
  
  /**
   * 注册新的连接池
   * @param poolKey 连接池键名
   * @param pool 连接池
   * @param initialStats 初始统计信息
   */
  public static registerPool(poolKey: string, pool: Pool, initialStats: PoolStats): void {
    // 缓存连接池实例
    this.pools.set(poolKey, pool);
    this.poolLastUsed.set(poolKey, Date.now());
    this.poolStats.set(poolKey, initialStats);
    
    // 设置事件监听器进行连接统计
    this.setupPoolMonitoring(poolKey, pool);
    
    // 启动连接池清理定时器
    this.startPoolCleanup();
  }
} 