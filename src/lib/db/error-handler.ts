/**
 * 数据库错误处理模块
 * 作者: 阿瑞
 * 功能: 提供数据库错误处理、日志记录和报告功能
 * 版本: 1.0
 */

import { QueryError } from 'mysql2';

/**
 * 数据库错误类型枚举
 */
export enum DbErrorType {
  CONNECTION = 'connection',    // 连接错误
  QUERY = 'query',              // 查询错误
  TRANSACTION = 'transaction',  // 事务错误
  FOREIGN_KEY = 'foreign_key',  // 外键约束错误
  DUPLICATE = 'duplicate',      // 唯一键约束错误
  CONSTRAINT = 'constraint',    // 其他约束错误
  PERMISSION = 'permission',    // 权限错误
  TIMEOUT = 'timeout',          // 超时错误
  UNKNOWN = 'unknown'           // 未知错误
}

/**
 * 数据库错误详情接口
 */
export interface DbErrorDetails {
  type: DbErrorType;            // 错误类型
  code?: string;                // 错误代码
  sqlState?: string;            // SQL状态码
  sql?: string;                 // 导致错误的SQL语句
  parameters?: any[];           // SQL参数
  timestamp: number;            // 错误发生时间戳
  database?: string;            // 相关数据库名称
  table?: string;               // 相关表名
  field?: string;               // 相关字段名
  message: string;              // 错误消息
  retryable: boolean;           // 是否可重试
  userFriendlyMessage: string;  // 用户友好消息
}

/**
 * 数据库错误类
 * 扩展Error，提供更多数据库相关错误信息
 */
export class DbError extends Error {
  public details: DbErrorDetails;
  
  constructor(
    message: string,
    type: DbErrorType = DbErrorType.UNKNOWN,
    options: Partial<Omit<DbErrorDetails, 'type' | 'timestamp' | 'message'>> = {}
  ) {
    super(message);
    this.name = 'DbError';
    
    // 设置错误详情
    this.details = {
      type,
      message,
      timestamp: Date.now(),
      retryable: options.retryable ?? false,
      userFriendlyMessage: options.userFriendlyMessage || '数据库操作出错，请稍后再试',
      ...options
    };
  }
  
  /**
   * 将错误转换为JSON对象
   */
  public toJSON(): any {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      details: this.details
    };
  }
  
  /**
   * 获取用户友好的错误信息
   */
  public getUserMessage(): string {
    return this.details.userFriendlyMessage;
  }
}

/**
 * 数据库错误处理器
 */
export class DbErrorHandler {
  /**
   * 错误日志缓存
   * 记录最近的错误以便分析
   */
  private static errorLogs: DbErrorDetails[] = [];
  
  /**
   * 最大错误日志数量
   */
  private static readonly MAX_ERROR_LOGS = 100;
  
  /**
   * 错误计数器，按类型统计
   */
  private static errorCounts: Record<DbErrorType, number> = {
    [DbErrorType.CONNECTION]: 0,
    [DbErrorType.QUERY]: 0,
    [DbErrorType.TRANSACTION]: 0,
    [DbErrorType.FOREIGN_KEY]: 0,
    [DbErrorType.DUPLICATE]: 0,
    [DbErrorType.CONSTRAINT]: 0,
    [DbErrorType.PERMISSION]: 0,
    [DbErrorType.TIMEOUT]: 0,
    [DbErrorType.UNKNOWN]: 0
  };
  
  /**
   * 处理数据库错误
   * @param error 原始错误对象
   * @param context 错误上下文
   * @returns 标准化的DbError对象
   */
  public static handleError(
    error: Error | QueryError | DbError | any,
    context: {
      sql?: string;
      parameters?: any[];
      database?: string;
      table?: string;
      operation?: string;
    } = {}
  ): DbError {
    // 如果已经是DbError，直接返回
    if (error instanceof DbError) {
      this.logError(error.details);
      return error;
    }
    
    // 获取MySQL错误代码和状态
    const errorCode = error.code || error.errno;
    const sqlState = error.sqlState;
    
    // 确定错误类型和详情
    let type = DbErrorType.UNKNOWN;
    let retryable = false;
    let userFriendlyMessage = '数据库操作出错，请稍后再试';
    let field: string | undefined;
    
    // 根据错误代码识别错误类型
    if (
      errorCode === 'ECONNREFUSED' || 
      errorCode === 'PROTOCOL_CONNECTION_LOST' ||
      errorCode === 'ETIMEDOUT'
    ) {
      type = DbErrorType.CONNECTION;
      retryable = true;
      userFriendlyMessage = '数据库连接失败，请稍后再试';
    } 
    else if (errorCode === 'ER_DUP_ENTRY' || errorCode === 1062) {
      type = DbErrorType.DUPLICATE;
      userFriendlyMessage = '数据已存在，请勿重复提交';
      
      // 提取重复的字段名
      const match = /for key '(.+?)'/i.exec(error.message);
      if (match && match[1]) {
        field = match[1];
      }
    }
    else if (errorCode === 'ER_NO_REFERENCED_ROW' || errorCode === 1452) {
      type = DbErrorType.FOREIGN_KEY;
      userFriendlyMessage = '操作失败，引用的记录不存在';
    }
    else if (errorCode === 'ER_ROW_IS_REFERENCED' || errorCode === 1451) {
      type = DbErrorType.FOREIGN_KEY;
      userFriendlyMessage = '无法删除，该记录正被其他数据引用';
    }
    else if (
      errorCode === 'ER_LOCK_DEADLOCK' || 
      errorCode === 1213 ||
      error.message.includes('deadlock')
    ) {
      type = DbErrorType.TRANSACTION;
      retryable = true;
      userFriendlyMessage = '数据库繁忙，请稍后再试';
    }
    else if (errorCode === 'ER_LOCK_WAIT_TIMEOUT' || errorCode === 1205) {
      type = DbErrorType.TIMEOUT;
      retryable = true;
      userFriendlyMessage = '操作超时，请稍后再试';
    }
    else if (
      errorCode === 'ER_ACCESS_DENIED_ERROR' || 
      errorCode === 1045 ||
      errorCode === 'ER_TABLEACCESS_DENIED_ERROR' ||
      errorCode === 1142
    ) {
      type = DbErrorType.PERMISSION;
      userFriendlyMessage = '权限不足，无法完成操作';
    }
    else if (
      errorCode === 'ER_CHECK_CONSTRAINT_VIOLATED' ||
      errorCode === 3819 ||
      error.message.includes('constraint')
    ) {
      type = DbErrorType.CONSTRAINT;
      userFriendlyMessage = '数据不符合约束条件，请检查输入';
    }
    
    // 创建标准化的错误对象
    const dbError = new DbError(
      error.message || '数据库操作失败',
      type,
      {
        code: errorCode?.toString(),
        sqlState,
        sql: context.sql,
        parameters: context.parameters,
        database: context.database,
        table: context.table,
        field,
        retryable,
        userFriendlyMessage
      }
    );
    
    // 记录错误
    this.logError(dbError.details);
    
    // 控制台输出更详细的错误信息
    console.error(`数据库错误 [${type}]: ${error.message}`);
    if (context.sql) {
      console.error(`SQL: ${context.sql}`);
      if (context.parameters) {
        console.error(`参数: ${JSON.stringify(context.parameters)}`);
      }
    }
    if (context.operation) {
      console.error(`操作: ${context.operation}`);
    }
    if (error.stack) {
      console.error(`堆栈: ${error.stack}`);
    }
    
    return dbError;
  }
  
  /**
   * 记录错误到内存日志
   * @param errorDetails 错误详情
   */
  private static logError(errorDetails: DbErrorDetails): void {
    // 增加对应类型的错误计数
    this.errorCounts[errorDetails.type]++;
    
    // 添加到错误日志
    this.errorLogs.unshift(errorDetails);
    
    // 如果超出最大记录数，移除最早的记录
    if (this.errorLogs.length > this.MAX_ERROR_LOGS) {
      this.errorLogs.pop();
    }
  }
  
  /**
   * 获取最近的错误日志
   * @param limit 获取的日志数量
   * @param type 可选的错误类型筛选
   */
  public static getRecentErrors(limit: number = 10, type?: DbErrorType): DbErrorDetails[] {
    if (type) {
      return this.errorLogs
        .filter(log => log.type === type)
        .slice(0, limit);
    }
    return this.errorLogs.slice(0, limit);
  }
  
  /**
   * 获取错误统计信息
   */
  public static getErrorStats(): Record<DbErrorType, number> {
    return { ...this.errorCounts };
  }
  
  /**
   * 清除错误日志
   */
  public static clearErrorLogs(): void {
    this.errorLogs = [];
    
    // 重置错误计数
    for (const type in this.errorCounts) {
      this.errorCounts[type as DbErrorType] = 0;
    }
  }
}

/**
 * 创建可重试的异步函数包装器
 * @param fn 要重试的异步函数
 * @param maxRetries 最大重试次数
 * @param delayMs 初始延迟毫秒数(指数增长)
 * @returns 包装后的函数
 */
export function withRetry<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 300
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error: any) {
        lastError = error;
        
        // 检查是否是可重试的数据库错误
        const isRetryable = 
          error instanceof DbError 
            ? error.details.retryable 
            : (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ER_LOCK_DEADLOCK');
        
        if (!isRetryable || attempt >= maxRetries) {
          // 不可重试或达到最大重试次数
          throw error;
        }
        
        // 指数退避延迟
        const retryDelay = delayMs * Math.pow(2, attempt);
        console.warn(`操作失败，${retryDelay}ms后第${attempt + 1}次重试: ${error.message}`);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    // 抛出最后一个错误(这行代码理论上永远不会执行，但TypeScript需要)
    throw lastError; 
  };
}

/**
 * 导出默认错误处理器
 */
export default DbErrorHandler; 