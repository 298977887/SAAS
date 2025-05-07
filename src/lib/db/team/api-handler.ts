/**
 * API请求处理器
 * 作者: 阿瑞
 * 功能: 提供API路由的数据库连接与错误处理
 * 版本: 1.3.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, PoolConnection } from 'mysql2/promise';
import { ConnectionManager } from '../connection-manager';
import { DbErrorHandler, DbError, DbErrorType } from '../error-handler';
import { getQueryMonitor } from '../query-monitor';
import { getQueryCache } from '../query-cache';
import { TeamConnectionManager } from './team-connection-manager';

/**
 * API处理函数类型
 */
export type ApiHandler = (
  req: NextRequest, 
  params: any, 
  connection: Pool
) => Promise<NextResponse>;

/**
 * 事务处理函数类型
 */
export type TransactionHandler = (
  req: NextRequest, 
  params: any, 
  connection: PoolConnection
) => Promise<NextResponse>;

/**
 * 从请求中获取团队连接池
 * @param teamCode 团队代码
 * @returns 团队数据库连接池
 */
export async function getTeamPool(teamCode: string): Promise<Pool> {
  if (!teamCode) {
    throw new Error('团队编码不能为空');
  }
  
  // 使用团队连接管理器获取连接池
  return TeamConnectionManager.getTeamPoolByCode(teamCode);
}

/**
 * 包装API处理函数，提供数据库连接
 * @param handler API处理函数
 * @param database 可选的数据库名称
 * @returns 包装后的处理函数
 */
export function withDb(handler: ApiHandler, database?: string) {
  return async function(req: NextRequest, context: { params: any }) {
    const startTime = performance.now();
    const queryMonitor = getQueryMonitor();
    const apiPath = req.nextUrl.pathname;
    
    try {
      // 获取数据库连接池
      const pool = database 
        ? ConnectionManager.getPool(database)
        : ConnectionManager.getMasterPool();
      
      // 记录API调用
      const monitorId = queryMonitor.startQuery('API CALL', [], database, apiPath);
      
      try {
        // 执行API处理函数
        const response = await handler(req, context.params, pool);
        
        // 记录执行时间
        const duration = performance.now() - startTime;
        queryMonitor.endQuery(monitorId, undefined, 0);
        
        if (duration > 1000) { // 记录执行时间超过1秒的API调用
          console.warn(`慢API调用: ${apiPath} (${duration.toFixed(2)}ms)`);
        }
        
        return response;
      } catch (error) {
        // 记录错误
        queryMonitor.endQuery(monitorId, error as Error);
        throw error;
      }
    } catch (error: any) {
      // 使用统一的错误处理
      const dbError = DbErrorHandler.handleError(error, {
        database,
        operation: apiPath
      });
      
      // 构建友好的错误响应
      const statusCode = getStatusCodeFromError(dbError);
      
      console.error(`API错误 [${apiPath}]:`, dbError.message);
      
      return NextResponse.json(
        { 
          error: dbError.getUserMessage(),
          code: dbError.details.code,
          path: apiPath
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * 包装API处理函数，提供系统数据库事务支持
 * @param handler 事务处理函数
 * @param database 可选的数据库名称
 * @returns 包装后的处理函数
 */
export function withTransaction(handler: TransactionHandler, database?: string) {
  return async function(req: NextRequest, context: { params: any }) {
    const startTime = performance.now();
    const queryMonitor = getQueryMonitor();
    const apiPath = req.nextUrl.pathname;
    
    try {
      // 记录事务API调用
      const monitorId = queryMonitor.startQuery('TRANSACTION API CALL', [], database, apiPath);
      
      try {
        // 在事务中执行
        const response = await ConnectionManager.transaction(database, async (connection) => {
          return await handler(req, context.params, connection);
        }, 3); // 最多重试3次
        
        // 记录执行时间
        const duration = performance.now() - startTime;
        queryMonitor.endQuery(monitorId, undefined, 0);
        
        if (duration > 1500) { // 事务API通常更长，所以阈值更高
          console.warn(`慢事务API调用: ${apiPath} (${duration.toFixed(2)}ms)`);
        }
        
        // 事务成功后，让查询缓存失效
        // 这里简单处理，实际应该基于修改的表来选择性失效
        const cache = getQueryCache();
        if (req.method !== 'GET') {
          // 非GET请求可能修改了数据，清除相关缓存
          cache.clear();
        }
        
        return response;
      } catch (error) {
        // 记录错误
        queryMonitor.endQuery(monitorId, error as Error);
        throw error;
      }
    } catch (error: any) {
      // 使用统一的错误处理
      const dbError = DbErrorHandler.handleError(error, {
        database,
        operation: `TRANSACTION ${apiPath}`
      });
      
      // 构建友好的错误响应
      const statusCode = getStatusCodeFromError(dbError);
      
      console.error(`事务API错误 [${apiPath}]:`, dbError.message);
      
      return NextResponse.json(
        { 
          error: dbError.getUserMessage(),
          code: dbError.details.code,
          path: apiPath
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * 从数据库错误确定HTTP状态码
 * @param error 数据库错误
 * @returns HTTP状态码
 */
function getStatusCodeFromError(error: DbError): number {
  switch (error.details.type) {
    case DbErrorType.CONNECTION:
      return 503; // Service Unavailable
    case DbErrorType.PERMISSION:
      return 403; // Forbidden
    case DbErrorType.DUPLICATE:
      return 409; // Conflict
    case DbErrorType.FOREIGN_KEY:
      return 422; // Unprocessable Entity
    case DbErrorType.CONSTRAINT:
      return 400; // Bad Request
    case DbErrorType.TIMEOUT:
      return 408; // Request Timeout
    default:
      return 500; // Internal Server Error
  }
}

/**
 * 包装API处理函数，提供团队数据库连接
 * @param handler API处理函数
 * @returns 包装后的处理函数
 */
export function withTeamDb(handler: ApiHandler) {
  return async function(req: NextRequest, context: { params: any }) {
    const startTime = performance.now();
    const queryMonitor = getQueryMonitor();
    const apiPath = req.nextUrl.pathname;
    const params = await context.params;
    const { teamCode } = params;
    
    if (!teamCode) {
      return NextResponse.json(
        { error: '缺少团队编码' },
        { status: 400 }
      );
    }
    
    try {
      // 记录团队API调用
      const monitorId = queryMonitor.startQuery(`TEAM API CALL [${teamCode}]`, [], `team_${teamCode}`, apiPath);
      
      try {
        // 获取团队数据库连接池
        const pool = await TeamConnectionManager.getTeamPoolByCode(teamCode);
        
        // 执行API处理函数
        const response = await handler(req, params, pool);
        
        // 记录执行时间
        const duration = performance.now() - startTime;
        queryMonitor.endQuery(monitorId, undefined, 0);
        
        if (duration > 1000) {
          console.warn(`慢团队API调用: ${apiPath} [${teamCode}] (${duration.toFixed(2)}ms)`);
        }
        
        return response;
      } catch (error) {
        // 记录错误
        queryMonitor.endQuery(monitorId, error as Error);
        throw error;
      }
    } catch (error: any) {
      // 使用统一的错误处理
      const dbError = DbErrorHandler.handleError(error, {
        database: `team_${teamCode}`,
        operation: `TEAM API CALL ${apiPath}`
      });
      
      // 构建友好的错误响应
      const statusCode = getStatusCodeFromError(dbError);
      
      console.error(`团队API错误 [${apiPath}][${teamCode}]:`, dbError.message);
      
      return NextResponse.json(
        { 
          error: dbError.getUserMessage(),
          code: dbError.details.code,
          path: apiPath
        },
        { status: statusCode }
      );
    }
  };
}

/**
 * 包装API处理函数，提供团队数据库事务支持
 * @param handler 事务处理函数
 * @returns 包装后的处理函数
 */
export function withTeamTransaction(handler: TransactionHandler) {
  return async function(req: NextRequest, context: { params: any }) {
    const startTime = performance.now();
    const queryMonitor = getQueryMonitor();
    const apiPath = req.nextUrl.pathname;
    const params = await context.params;
    const { teamCode } = params;
    
    if (!teamCode) {
      return NextResponse.json(
        { error: '缺少团队编码' },
        { status: 400 }
      );
    }
    
    try {
      // 记录事务API调用
      const monitorId = queryMonitor.startQuery(`TEAM TRANSACTION API CALL [${teamCode}]`, [], `team_${teamCode}`, apiPath);
      
      try {
        // 使用团队连接管理器执行事务
        const response = await TeamConnectionManager.teamTransaction(teamCode, async (connection) => {
          return await handler(req, params, connection);
        }, 3); // 最多重试3次
        
        // 记录执行时间
        const duration = performance.now() - startTime;
        queryMonitor.endQuery(monitorId, undefined, 0);
        
        if (duration > 1500) { // 事务API通常更长，所以阈值更高
          console.warn(`慢团队事务API调用: ${apiPath} [${teamCode}] (${duration.toFixed(2)}ms)`);
        }
        
        // 事务成功后，让查询缓存失效
        // 这里简单处理，实际应该基于修改的表来选择性失效
        const cache = getQueryCache();
        if (req.method !== 'GET') {
          // 非GET请求可能修改了数据，清除相关缓存
          cache.clear();
        }
        
        return response;
      } catch (error) {
        // 记录错误
        queryMonitor.endQuery(monitorId, error as Error);
        throw error;
      }
    } catch (error: any) {
      // 使用统一的错误处理
      const dbError = DbErrorHandler.handleError(error, {
        database: `team_${teamCode}`,
        operation: `TEAM TRANSACTION API CALL ${apiPath}`
      });
      
      // 构建友好的错误响应
      const statusCode = getStatusCodeFromError(dbError);
      
      console.error(`团队事务API错误 [${apiPath}][${teamCode}]:`, dbError.message);
      
      return NextResponse.json(
        { 
          error: dbError.getUserMessage(),
          code: dbError.details.code,
          path: apiPath
        },
        { status: statusCode }
      );
    }
  };
} 