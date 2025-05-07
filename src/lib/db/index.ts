/**
 * 数据库模块入口
 * 作者: 阿瑞
 * 功能: 导出所有数据库相关功能
 * 版本: 1.4
 */

import db, { Database } from './init';
import { ConnectionManager } from './connection-manager';
import DbConfig from './config';
import DbErrorHandler, { DbError, DbErrorType, withRetry } from './error-handler';
import { QueryCache, getQueryCache } from './query-cache';
import { QueryMonitor, getQueryMonitor, withQueryMonitoring } from './query-monitor';
import { TeamConnectionManager, type TeamDatabaseConfig } from './team/team-connection-manager';
import type { PoolConnection } from 'mysql2/promise';

/**
 * 初始化数据库
 * 确保所有必需的数据库表都已创建
 */
export async function initDatabase(): Promise<void> {
  try {
    // 初始化系统数据库
    await ConnectionManager.initialize();
    console.log('系统数据库初始化成功');
    
    // 初始化团队连接管理器
    TeamConnectionManager.initialize();
    
    // 启动查询缓存和监控
    const queryCache = getQueryCache();
    const queryMonitor = getQueryMonitor();
    
    // 配置查询缓存
    queryCache.setConfig({
      ttl: 60 * 1000,  // 1分钟缓存过期
      maxItems: 500,    // 最多缓存500个查询
      maxSize: 20 * 1024 * 1024 // 最大20MB
    });
    
    // 配置查询监控
    queryMonitor.setSlowQueryThreshold(500); // 慢查询阈值500ms
    
    console.log('数据库性能优化模块已启动');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 * 在应用关闭前调用，确保资源正确释放
 */
export async function closeDatabase(): Promise<void> {
  try {
    // 关闭系统连接池
    await ConnectionManager.closeAllPools();
    
    // 关闭团队连接池
    await TeamConnectionManager.closeAllTeamPools();
    
    console.log('所有数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }
}

/**
 * 数据库健康检查
 * 用于监控系统检查数据库连接状态
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  details: any;
}> {
  try {
    // 测试主数据库连接
    const connected = await ConnectionManager.testConnection();
    
    if (!connected) {
      return {
        status: 'critical',
        details: {
          message: '无法连接到主数据库',
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // 获取系统连接池统计
    const systemPoolStats = ConnectionManager.getPoolStats();
    
    // 获取团队连接状态
    const teamConnections = TeamConnectionManager.getTeamConnectionStatus();
    
    // 获取查询监控统计
    const queryStats = getQueryMonitor().getStats();
    const slowQueries = getQueryMonitor().getSlowQueries(5);
    
    // 获取缓存统计
    const cacheStats = getQueryCache().getStats();
    
    // 分析健康状态
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    // 如果有错误或慢查询比例过高，降级状态
    if (queryStats.totalErrors > 0 || queryStats.slowQueries / queryStats.totalQueries > 0.1) {
      status = 'degraded';
    }
    
    // 计算活跃团队连接数
    const activeTeamConnections = Object.values(teamConnections).filter(
      (conn: any) => conn.active && conn.isConnected
    ).length;
    
    // 返回健康状态和详细信息
    return {
      status,
      details: {
        connected,
        systemPools: systemPoolStats,
        teamConnections: {
          active: activeTeamConnections,
          total: Object.keys(teamConnections).length,
          details: teamConnections
        },
        queryStats: {
          totalQueries: queryStats.totalQueries,
          totalErrors: queryStats.totalErrors,
          averageDuration: queryStats.averageDuration,
          slowQueries: queryStats.slowQueries
        },
        cacheStats: {
          hitRate: cacheStats.hitRate,
          itemCount: cacheStats.itemCount,
          size: Math.round(cacheStats.size / 1024) + 'KB'
        },
        recentSlowQueries: slowQueries.map(q => ({
          sql: q.sql,
          duration: q.duration,
          timestamp: new Date(q.timestamp).toISOString()
        })),
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('数据库健康检查失败:', error);
    return {
      status: 'critical',
      details: {
        message: '健康检查执行失败',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * 创建团队数据库连接池
 * @param teamConfig 团队数据库配置
 * @returns 数据库连接池
 */
export async function createTeamConnection(teamConfig: TeamDatabaseConfig) {
  return TeamConnectionManager.createTeamPool(teamConfig);
}

/**
 * 从团队编码获取团队数据库连接
 * @param teamCode 团队编码
 * @returns 数据库连接池
 */
export async function getTeamConnection(teamCode: string) {
  return TeamConnectionManager.getTeamPoolByCode(teamCode);
}

/**
 * 测试团队数据库连接
 * @param config 团队数据库配置
 * @returns 连接测试结果
 */
export async function testTeamConnection(config: {
  db_host: string;
  db_name: string;
  db_username: string;
  db_password: string;
}) {
  return TeamConnectionManager.testTeamConnection(config);
}

/**
 * 关闭指定团队的数据库连接
 * @param teamCode 团队编码
 */
export async function closeTeamConnection(teamCode: string) {
  return TeamConnectionManager.closeTeamPool(teamCode);
}

/**
 * 在团队事务中执行数据库操作
 * @param teamCode 团队编码
 * @param callback 事务回调函数
 * @param retries 重试次数
 * @returns 执行结果
 */
export async function runTeamTransaction<T>(
  teamCode: string,
  callback: (connection: PoolConnection) => Promise<T>,
  retries: number = 2
): Promise<T> {
  return TeamConnectionManager.teamTransaction(teamCode, callback, retries);
}

// 导出数据库相关类和实例
export { 
  Database,
  db as default,
  ConnectionManager,
  DbConfig,
  DbErrorHandler,
  DbError,
  DbErrorType,
  withRetry,
  QueryCache,
  getQueryCache,
  QueryMonitor,
  getQueryMonitor,
  withQueryMonitoring,
  TeamConnectionManager
};

// 导出类型
export type { TeamDatabaseConfig, PoolConnection }; 