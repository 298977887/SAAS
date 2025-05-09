/**
 * 团队数据库连接管理器
 * 作者: 阿瑞
 * 功能: 负责创建、维护和关闭团队数据库连接
 * 版本: 1.2
 */

import mysql, { Pool, PoolOptions, PoolConnection } from 'mysql2/promise';
import { ConnectionManager, PoolStats } from '../connection-manager';
import DbErrorHandler, { DbError, DbErrorType, withRetry } from '../error-handler';
import { getQueryMonitor } from '../query-monitor';
import { getQueryCache } from '../query-cache';
import DbConfig from '../config';

/**
 * 团队数据库配置接口
 */
export interface TeamDatabaseConfig {
  db_host: string;
  db_name: string;
  db_username: string;
  db_password: string;
  team_code: string;
}

/**
 * 团队数据连接状态
 */
interface TeamConnectionState {
  poolKey: string;
  teamCode: string;
  lastUsed: number;
  active: boolean;
  errorCount: number;
  lastError?: Error;
  lastHealthCheck: number;
}

/**
 * 团队连接管理器
 * 专门负责管理团队数据库的连接
 */
export class TeamConnectionManager {
  /**
   * 团队连接池映射，键为团队编码，值为连接池
   */
  private static pools: Map<string, Pool> = new Map();
  
  /**
   * 团队连接状态映射
   */
  private static teamConnections: Map<string, TeamConnectionState> = new Map();
  
  /**
   * 连接池统计信息
   */
  private static poolStats: Map<string, PoolStats> = new Map();
  
  /**
   * 连接池最后使用时间
   */
  private static poolLastUsed: Map<string, number> = new Map();
  
  /**
   * 健康检查定时器
   */
  private static healthCheckInterval: NodeJS.Timeout | null = null;
  
  /**
   * 清理定时器
   */
  private static cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * 健康检查间隔(毫秒)
   */
  private static readonly HEALTH_CHECK_INTERVAL = 30 * 1000; // 30秒
  
  /**
   * 清理间隔(毫秒)
   */
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟
  
  /**
   * 不活跃时间(毫秒)
   */
  private static readonly INACTIVE_TIME = 10 * 60 * 1000; // 10分钟
  
  /**
   * 初始化团队连接管理器
   */
  public static initialize(): void {
    // 启动健康检查
    this.startHealthCheck();
    
    // 启动清理任务
    this.startCleanupTimer();
    
    console.log('团队数据库连接管理器已初始化');
  }
  
  /**
   * 创建团队数据库连接池
   * 使用团队自身的数据库连接信息创建连接池
   * @param teamConfig 团队数据库配置
   * @returns 数据库连接池
   */
  public static createTeamPool(teamConfig: TeamDatabaseConfig): Pool {
    const { db_host, db_name, db_username, db_password, team_code } = teamConfig;
    const poolKey = `team_${team_code}`;
    
    // 检查是否已存在连接池
    if (this.pools.has(team_code)) {
      // 更新连接状态
      this.updateConnectionState(team_code);
      return this.pools.get(team_code)!;
    }
    
    // 只在开发环境输出日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`创建团队${team_code}数据库连接池`);
    }
    
    // 判断系统负载状态，调整连接数
    const connectionLimit = ConnectionManager.isHighLoadMode() ? 5 : 10;
    
    // 创建团队专用连接池选项
    const poolOptions: PoolOptions = {
      host: db_host,
      database: db_name,
      user: db_username,
      password: db_password,
      waitForConnections: true,
      connectionLimit,
      queueLimit: 20,
      enableKeepAlive: true,
      keepAliveInitialDelay: 5000,   // 5秒后开始保持连接
      idleTimeout: 30000,            // 30秒无活动自动断开
      connectTimeout: 10000,         // 连接超时10秒
      maxIdle: 5,                    // 最大空闲连接数
      timezone: '+08:00'             // 使用中国时区
    };
    
    try {
      // 创建团队专用连接池
      const pool = mysql.createPool(poolOptions);
      
      // 记录连接池统计信息
      const stats: PoolStats = {
        acquiredConnections: 0,
        totalConnections: 0,
        idleConnections: 0,
        pendingRequests: 0,
        lastUsed: Date.now(),
        healthStatus: 'healthy',
        errorCount: 0
      };
      
      // 记录团队连接状态
      this.teamConnections.set(team_code, {
        poolKey,
        teamCode: team_code,
        lastUsed: Date.now(),
        active: true,
        errorCount: 0,
        lastHealthCheck: Date.now()
      });
      
      // 缓存连接池和统计信息
      this.pools.set(team_code, pool);
      this.poolStats.set(team_code, stats);
      this.poolLastUsed.set(team_code, Date.now());
      
      // 添加连接池事件监听器
      this.setupPoolListeners(pool, team_code);
      
      return pool;
    } catch (error) {
      console.error(`创建团队${team_code}数据库连接池失败:`, error);
      throw new DbError(`无法创建团队数据库连接池: ${(error as Error).message}`, DbErrorType.CONNECTION, {
        userFriendlyMessage: '无法连接到团队数据库，请稍后再试',
        retryable: true
      });
    }
  }
  
  /**
   * 设置连接池事件监听器
   * @param pool 连接池
   * @param teamCode 团队编码
   */
  private static setupPoolListeners(pool: Pool, teamCode: string): void {
    const stats = this.poolStats.get(teamCode)!;
    
    // 监听连接事件
    pool.on('connection', () => {
      stats.totalConnections++;
      this.poolStats.set(teamCode, stats);
      
      // 不在这里启动查询监控，而是在获取连接时记录
    });
    
    // 监听获取连接事件
    pool.on('acquire', () => {
      stats.acquiredConnections++;
      this.poolStats.set(teamCode, stats);
    });
    
    // 监听释放连接事件
    pool.on('release', () => {
      stats.acquiredConnections = Math.max(0, stats.acquiredConnections - 1);
      stats.idleConnections++;
      this.poolStats.set(teamCode, stats);
    });
    
    // 监听等待队列事件
    pool.on('enqueue', () => {
      stats.pendingRequests++;
      this.poolStats.set(teamCode, stats);
    });
    
    // 监听连接池终止事件
    (pool as any).on('end', () => {
      console.log(`团队${teamCode}数据库连接池已关闭`);
      // 结束所有相关的查询监控
      this.cleanupTeamMonitors(teamCode);
    });
    
    // 监听错误事件
    (pool as any).on('error', (err: Error) => {
      console.error(`团队${teamCode}数据库连接池错误:`, err);
      
      stats.errorCount++;
      stats.lastError = err;
      stats.lastErrorTime = Date.now();
      
      if (stats.errorCount > 5) {
        stats.healthStatus = 'critical';
      } else if (stats.errorCount > 2) {
        stats.healthStatus = 'degraded';
      }
      
      this.poolStats.set(teamCode, stats);
      
      const connectionState = this.teamConnections.get(teamCode);
      if (connectionState) {
        connectionState.errorCount++;
        connectionState.lastError = err;
        
        // 如果错误计数过高，尝试恢复连接池
        if (connectionState.errorCount > 5) {
          this.attemptPoolRecovery(teamCode).catch(recoveryError => {
            console.error(`团队${teamCode}连接池恢复失败:`, recoveryError);
          });
        }
      }
    });
  }
  
  /**
   * 清理团队相关的查询监控
   * @param teamCode 团队编码
   */
  private static cleanupTeamMonitors(teamCode: string): void {
    const queryMonitor = getQueryMonitor();
    const activeQueries = queryMonitor.getActiveQueries();
    
    // 查找并结束所有与此团队相关的活跃查询
    activeQueries.forEach((query, id) => {
      if (query.sql === 'TEAM_POOL_CONNECTION' && 
          query.parameters && 
          query.parameters[0] === teamCode) {
        queryMonitor.endQuery(id as string);
        console.log(`已结束团队${teamCode}的连接监控`);
      }
    });
  }
  
  /**
   * 尝试恢复问题连接池
   * @param teamCode 团队编码
   */
  private static async attemptPoolRecovery(teamCode: string): Promise<void> {
    const connectionState = this.teamConnections.get(teamCode);
    if (!connectionState) return;
    
    console.log(`尝试恢复团队${teamCode}连接池`);
    
    try {
      // 关闭原有连接池
      await this.closeTeamPool(teamCode);
      
      // 重新获取团队信息并创建连接池
      await this.getTeamPoolByCode(teamCode);
      
      // 重置错误计数
      if (this.teamConnections.has(teamCode)) {
        const newState = this.teamConnections.get(teamCode)!;
        newState.errorCount = 0;
        newState.active = true;
      }
      
      console.log(`团队${teamCode}连接池已恢复`);
    } catch (error) {
      console.error(`恢复团队${teamCode}连接池失败:`, error);
      
      // 更新连接状态为不活跃
      if (this.teamConnections.has(teamCode)) {
        const newState = this.teamConnections.get(teamCode)!;
        newState.active = false;
      }
    }
  }
  
  /**
   * 更新团队连接状态
   * @param teamCode 团队编码
   */
  private static updateConnectionState(teamCode: string): void {
    const state = this.teamConnections.get(teamCode);
    if (state) {
      state.lastUsed = Date.now();
      this.poolLastUsed.set(teamCode, Date.now());
      
      // 如果上次健康检查已超过间隔时间，执行健康检查
      if (Date.now() - state.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
        this.checkTeamPoolHealth(teamCode).catch(error => {
          console.error(`团队${teamCode}健康检查失败:`, error);
        });
      }
    }
  }
  
  /**
   * 检查团队连接池健康状态
   * @param teamCode 团队编码
   */
  private static async checkTeamPoolHealth(teamCode: string): Promise<void> {
    const state = this.teamConnections.get(teamCode);
    if (!state || !state.active) return;
    
    if (!this.pools.has(teamCode)) return;
    
    const pool = this.pools.get(teamCode)!;
    let connection: PoolConnection | null = null;
    
    try {
      // 更新最后健康检查时间
      state.lastHealthCheck = Date.now();
      
      // 尝试获取连接并执行简单查询
      connection = await pool.getConnection();
      await connection.query('SELECT 1');
      
      // 检查成功，减少错误计数
      const stats = this.poolStats.get(teamCode);
      if (stats && stats.errorCount > 0) {
        stats.errorCount = Math.max(0, stats.errorCount - 1);
        if (stats.errorCount < 3) {
          stats.healthStatus = 'healthy';
        }
        this.poolStats.set(teamCode, stats);
      }
      
      if (state.errorCount > 0) {
        state.errorCount = Math.max(0, state.errorCount - 1);
      }
    } catch (error) {
      console.error(`团队${teamCode}健康检查失败:`, error);
      
      state.errorCount++;
      state.lastError = error as Error;
      
      const stats = this.poolStats.get(teamCode);
      if (stats) {
        stats.errorCount++;
        stats.lastError = error as Error;
        stats.lastErrorTime = Date.now();
        
        if (stats.errorCount > 5) {
          stats.healthStatus = 'critical';
        } else if (stats.errorCount > 2) {
          stats.healthStatus = 'degraded';
        }
        
        this.poolStats.set(teamCode, stats);
      }
      
      // 如果错误计数过高，尝试恢复连接池
      if (state.errorCount > 3) {
        await this.attemptPoolRecovery(teamCode);
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 测试团队数据库连接
   * @param teamConfig 团队数据库配置
   * @returns 连接测试结果
   */
  public static async testTeamConnection(teamConfig: {
    db_host: string;
    db_name: string;
    db_username: string;
    db_password: string;
  }): Promise<{ success: boolean; message?: string }> {
    const { db_host, db_name, db_username, db_password } = teamConfig;
    let testPool: Pool | null = null;
    
    try {
      // 创建临时连接池用于测试
      testPool = mysql.createPool({
        host: db_host,
        database: db_name,
        user: db_username,
        password: db_password,
        connectionLimit: 1,
        connectTimeout: 5000,
        waitForConnections: true
      });
      
      // 尝试连接并执行简单查询
      const connection = await testPool.getConnection();
      await connection.query('SELECT 1');
      connection.release();
      
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      console.error('测试团队数据库连接失败:', error);
      
      // 处理错误并返回友好信息
      const dbError = DbErrorHandler.handleError(error, {
        operation: '测试团队数据库连接'
      });
      
      return { success: false, message: dbError.getUserMessage() };
    } finally {
      // 释放资源
      if (testPool) {
        await testPool.end().catch(() => {}); // 忽略关闭错误
      }
    }
  }
  
  /**
   * 从主数据库获取团队信息并创建连接池
   * @param teamCode 团队编码
   * @returns 团队数据库连接池
   */
  public static async getTeamPoolByCode(teamCode: string): Promise<Pool> {
    // 检查连接池是否已存在
    if (this.pools.has(teamCode)) {
      this.updateConnectionState(teamCode);
      return this.pools.get(teamCode)!;
    }
    
    // 启用重试机制
    return withRetry(async () => {
      const masterPool = ConnectionManager.getMasterPool();
      const queryMonitor = getQueryMonitor();
      
      // 开始监控查询
      const monitorId = queryMonitor.startQuery(
        'SELECT id, team_code, db_host, db_name, db_username, db_password FROM teams WHERE team_code = ? AND status = 1',
        [teamCode],
        DbConfig.database,
        'getTeamPoolByCode'
      );
      
      try {
        // 查询团队数据库信息，确保指定数据库
        const [teamRows] = await masterPool.execute(
          `SELECT id, team_code, db_host, db_name, db_username, db_password 
           FROM ${DbConfig.database}.teams WHERE team_code = ? AND status = 1`,
          [teamCode]
        );
        
        // 结束查询监控
        queryMonitor.endQuery(monitorId, undefined, Array.isArray(teamRows) ? teamRows.length : 0);
        
        if (!Array.isArray(teamRows) || teamRows.length === 0) {
          throw new DbError(`团队[${teamCode}]不存在或已被禁用`, DbErrorType.PERMISSION, {
            userFriendlyMessage: '您请求的团队不存在或已被禁用',
            retryable: false
          });
        }
        
        const teamInfo = teamRows[0] as any;
        
        // 创建连接池前先检查是否已经有其他请求创建了连接池
        if (this.pools.has(teamCode)) {
          this.updateConnectionState(teamCode);
          return this.pools.get(teamCode)!;
        }
        
        // 创建连接池
        const pool = this.createTeamPool({
          db_host: teamInfo.db_host,
          db_name: teamInfo.db_name,
          db_username: teamInfo.db_username,
          db_password: teamInfo.db_password,
          team_code: teamInfo.team_code
        });
        
        // 在这里为连接创建监控记录
        const connectionMonitorId = queryMonitor.startQuery(
          `TEAM_POOL_CONNECTION`, 
          [teamCode],
          teamInfo.db_name,
          `team_connection_${teamCode}`
        );
        
        // 为该监控ID设置一个超时，以便在适当的时间结束监控
        setTimeout(() => {
          // 检查该监控是否仍然活跃，如果是，则结束它
          if (queryMonitor.isActiveQueryId(connectionMonitorId)) {
            queryMonitor.endQuery(connectionMonitorId);
            console.log(`自动终止了团队${teamCode}的连接监控`);
          }
        }, 10000); // 10秒后自动终止
        
        return pool;
      } catch (error) {
        // 结束监控并标记错误
        queryMonitor.endQuery(monitorId, error as Error);
        
        // 使用统一错误处理
        const dbError = DbErrorHandler.handleError(error, {
          database: DbConfig.database,
          operation: `获取团队 ${teamCode} 数据库配置`
        });
        
        console.error(`获取团队${teamCode}数据库连接池失败:`, dbError.message);
        throw dbError;
      }
    }, 2, 500)(); // 最多重试2次，初始延迟500ms
  }
  
  /**
   * 关闭指定团队的连接池
   * @param teamCode 团队编码
   */
  public static async closeTeamPool(teamCode: string): Promise<void> {
    if (this.pools.has(teamCode)) {
      const pool = this.pools.get(teamCode)!;
      
      try {
        await pool.end();
        this.pools.delete(teamCode);
        this.poolLastUsed.delete(teamCode);
        this.poolStats.delete(teamCode);
        
        // 更新连接状态
        if (this.teamConnections.has(teamCode)) {
          const state = this.teamConnections.get(teamCode)!;
          state.active = false;
        }
        
        console.log(`团队连接池 ${teamCode} 已关闭`);
      } catch (error) {
        console.error(`关闭团队连接池 ${teamCode} 失败:`, error);
        throw error;
      }
    }
  }
  
  /**
   * 启动健康检查定时器
   */
  private static startHealthCheck(): void {
    if (this.healthCheckInterval === null) {
      console.log('启动团队连接池健康检查定时器');
      this.healthCheckInterval = setInterval(() => {
        this.checkAllTeamPools();
      }, this.HEALTH_CHECK_INTERVAL);
    }
  }
  
  /**
   * 启动连接池清理定时器
   */
  private static startCleanupTimer(): void {
    if (this.cleanupInterval === null) {
      console.log('启动团队连接池清理定时器');
      this.cleanupInterval = setInterval(() => {
        this.cleanupUnusedPools();
      }, this.CLEANUP_INTERVAL);
    }
  }
  
  /**
   * 清理不活跃的连接池
   */
  private static async cleanupUnusedPools(): Promise<void> {
    console.log('开始清理不活跃的团队连接池');
    
    const now = Date.now();
    
    for (const [teamCode, lastUsed] of this.poolLastUsed.entries()) {
      // 如果连接池超过不活跃时间，则关闭并移除
      if (now - lastUsed > this.INACTIVE_TIME) {
        console.log(`清理不活跃团队连接池: ${teamCode}, 上次使用时间: ${new Date(lastUsed).toLocaleString()}`);
        
        try {
          await this.closeTeamPool(teamCode);
        } catch (error) {
          console.error(`关闭团队连接池 ${teamCode} 失败:`, error);
        }
      }
    }
  }
  
  /**
   * 检查所有团队连接池的健康状态
   */
  private static async checkAllTeamPools(): Promise<void> {
    const checkPromises: Promise<void>[] = [];
    
    for (const teamCode of this.teamConnections.keys()) {
      if (this.pools.has(teamCode)) {
        checkPromises.push(this.checkTeamPoolHealth(teamCode));
      }
    }
    
    if (checkPromises.length > 0) {
      await Promise.allSettled(checkPromises);
    }
  }
  
  /**
   * 关闭所有团队连接池
   */
  public static async closeAllTeamPools(): Promise<void> {
    console.log('关闭所有团队数据库连接池...');
    
    const closePromises: Promise<void>[] = [];
    
    for (const [teamCode, pool] of this.pools.entries()) {
      closePromises.push(
        pool.end()
          .then(() => console.log(`团队连接池 ${teamCode} 已关闭`))
          .catch(error => console.error(`关闭团队连接池 ${teamCode} 失败:`, error))
      );
    }
    
    await Promise.allSettled(closePromises);
    
    this.pools.clear();
    this.poolLastUsed.clear();
    this.poolStats.clear();
    
    // 更新所有连接状态为不活跃
    for (const state of this.teamConnections.values()) {
      state.active = false;
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
    
    console.log('所有团队数据库连接池已关闭');
  }
  
  /**
   * 获取团队连接状态列表
   * @returns 所有团队连接状态
   */
  public static getTeamConnectionStatus(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [teamCode, state] of this.teamConnections.entries()) {
      const poolStats = this.poolStats.get(teamCode);
      
      result[teamCode] = {
        ...state,
        poolStats,
        lastUsedTime: new Date(state.lastUsed).toISOString(),
        lastHealthCheckTime: new Date(state.lastHealthCheck).toISOString(),
        isConnected: this.pools.has(teamCode)
      };
    }
    
    return result;
  }
  
  /**
   * 在事务中执行团队数据库操作
   * @param teamCode 团队编码
   * @param callback 事务回调函数
   * @returns 回调函数返回值
   */
  public static async teamTransaction<T>(
    teamCode: string,
    callback: (connection: PoolConnection) => Promise<T>,
    retries: number = 2
  ): Promise<T> {
    // 获取团队连接池
    const pool = await this.getTeamPoolByCode(teamCode);
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
        
        // 可能的缓存失效处理
        const cache = getQueryCache();
        cache.invalidateTable(`team_${teamCode}`, 'update');
        
        return result;
      } catch (error: any) {
        attempts++;
        
        // 回滚事务
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error(`团队${teamCode}事务回滚失败:`, rollbackError);
          }
        }
        
        // 检查是否可以重试（针对连接和死锁错误）
        const retryableError = 
          error.code === 'PROTOCOL_CONNECTION_LOST' ||
          error.code === 'ER_LOCK_DEADLOCK' ||
          error.errno === 1213 || // 死锁错误码
          error.message.includes('deadlock');
        
        if (retryableError && attempts <= retries) {
          console.warn(`团队${teamCode}事务执行失败，准备第${attempts}次重试:`, error.message);
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempts - 1)));
          continue;
        }
        
        // 无法重试或重试次数耗尽
        console.error(`团队${teamCode}事务执行失败:`, error);
        
        // 使用统一错误处理
        const dbError = DbErrorHandler.handleError(error, {
          operation: `团队${teamCode}事务操作`
        });
        
        throw dbError;
      } finally {
        // 释放连接
        if (connection) {
          connection.release();
        }
      }
    }
    
    // 这里应该永远不会执行到，但TypeScript需要返回类型
    throw new DbError('事务执行失败: 超出最大重试次数', DbErrorType.TRANSACTION);
  }
} 