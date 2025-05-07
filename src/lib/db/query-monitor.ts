/**
 * 数据库查询监控模块
 * 作者: 阿瑞
 * 功能: 提供数据库查询性能监控，跟踪慢查询和查询统计
 * 版本: 1.0
 */

/**
 * 查询信息接口
 */
interface QueryInfo {
  sql: string;              // SQL语句
  parameters?: any[];       // 查询参数
  startTime: number;        // 查询开始时间戳
  endTime?: number;         // 查询结束时间戳
  duration?: number;        // 查询持续时间(毫秒)
  database?: string;        // 数据库名称
  error?: Error;            // 查询错误(如果有)
  rowCount?: number;        // 返回的行数
  source?: string;          // 查询来源(API路径、函数名等)
}

/**
 * 慢查询记录接口
 */
interface SlowQuery extends QueryInfo {
  timestamp: number;        // 记录时间戳
}

/**
 * 表统计信息接口
 */
interface TableStats {
  tableName: string;        // 表名
  selectCount: number;      // SELECT查询次数
  insertCount: number;      // INSERT查询次数
  updateCount: number;      // UPDATE查询次数
  deleteCount: number;      // DELETE查询次数
  totalTime: number;        // 所有查询总耗时(毫秒)
  lastAccessed: number;     // 最后访问时间戳
}

/**
 * 查询统计接口
 */
interface QueryStats {
  totalQueries: number;     // 总查询数
  totalErrors: number;      // 查询错误数
  totalDuration: number;    // 总查询时间(毫秒)
  averageDuration: number;  // 平均查询时间(毫秒)
  slowQueries: number;      // 慢查询数
  maxDuration: number;      // 最长查询时间(毫秒)
  startTime: number;        // 统计开始时间
}

/**
 * 查询监控器
 * 监控数据库查询性能和跟踪慢查询
 */
export class QueryMonitor {
  private static instance: QueryMonitor;
  
  /**
   * 慢查询阈值(毫秒)
   */
  private slowQueryThreshold: number = 500;
  
  /**
   * 保留的慢查询记录数量
   */
  private maxSlowQueries: number = 100;
  
  /**
   * 当前正在执行的查询
   */
  private activeQueries: Map<string, QueryInfo> = new Map();
  
  /**
   * 慢查询历史记录
   */
  private slowQueries: SlowQuery[] = [];
  
  /**
   * 表操作统计
   */
  private tableStats: Map<string, TableStats> = new Map();
  
  /**
   * 查询统计信息
   */
  private stats: QueryStats = {
    totalQueries: 0,
    totalErrors: 0,
    totalDuration: 0,
    averageDuration: 0,
    slowQueries: 0,
    maxDuration: 0,
    startTime: Date.now()
  };
  
  /**
   * 运行时间最长的前N个查询
   */
  private longRunningQueries: QueryInfo[] = [];
  
  /**
   * 最近查询历史(最多100条)
   */
  private recentQueries: QueryInfo[] = [];
  
  /**
   * 最大记录最近查询数
   */
  private maxRecentQueries: number = 100;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    // 启动长时间运行查询检测
    this.startLongRunningDetection();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor();
    }
    return QueryMonitor.instance;
  }
  
  /**
   * 设置慢查询阈值
   * @param threshold 阈值(毫秒)
   */
  public setSlowQueryThreshold(threshold: number): void {
    this.slowQueryThreshold = threshold;
  }
  
  /**
   * 获取当前慢查询阈值
   */
  public getSlowQueryThreshold(): number {
    return this.slowQueryThreshold;
  }
  
  /**
   * 生成查询的唯一ID
   */
  private generateQueryId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
  
  /**
   * 开始跟踪查询
   * @param sql SQL语句
   * @param parameters 查询参数
   * @param database 数据库名称
   * @param source 查询来源
   * @returns 查询ID
   */
  public startQuery(
    sql: string, 
    parameters?: any[],
    database?: string,
    source?: string
  ): string {
    // 生成查询ID
    const queryId = this.generateQueryId();
    
    // 记录查询信息
    this.activeQueries.set(queryId, {
      sql,
      parameters,
      startTime: performance.now(),
      database,
      source
    });
    
    // 更新表统计
    this.updateTableStats(sql);
    
    return queryId;
  }
  
  /**
   * 结束查询跟踪
   * @param queryId 查询ID
   * @param error 可选的查询错误
   * @param rowCount 可选的返回行数
   */
  public endQuery(queryId: string, error?: Error, rowCount?: number): void {
    const query = this.activeQueries.get(queryId);
    if (!query) {
      return; // 查询ID不存在
    }
    
    // 记录结束时间和持续时间
    const endTime = performance.now();
    const duration = endTime - query.startTime;
    
    // 更新查询信息
    query.endTime = endTime;
    query.duration = duration;
    query.error = error;
    query.rowCount = rowCount;
    
    // 移除活跃查询
    this.activeQueries.delete(queryId);
    
    // 更新统计信息
    this.stats.totalQueries++;
    this.stats.totalDuration += duration;
    this.stats.averageDuration = this.stats.totalDuration / this.stats.totalQueries;
    
    if (error) {
      this.stats.totalErrors++;
    }
    
    if (duration > this.stats.maxDuration) {
      this.stats.maxDuration = duration;
    }
    
    // 添加到最近查询历史
    this.recentQueries.unshift({...query});
    if (this.recentQueries.length > this.maxRecentQueries) {
      this.recentQueries.pop();
    }
    
    // 检查是否为慢查询
    if (duration > this.slowQueryThreshold) {
      this.recordSlowQuery(query);
    }
    
    // 更新长时间运行查询列表
    this.updateLongRunningQueries(query);
  }
  
  /**
   * 记录慢查询
   * @param query 查询信息
   */
  private recordSlowQuery(query: QueryInfo): void {
    const slowQuery: SlowQuery = {
      ...query,
      timestamp: Date.now()
    };
    
    this.slowQueries.unshift(slowQuery);
    this.stats.slowQueries++;
    
    // 限制记录数量
    if (this.slowQueries.length > this.maxSlowQueries) {
      this.slowQueries.pop();
    }
    
    // 记录慢查询日志
    console.warn(`检测到慢查询(${query.duration?.toFixed(2)}ms): ${this.formatSql(query.sql, query.parameters)}`);
  }
  
  /**
   * 格式化SQL语句（用于日志）
   * @param sql SQL语句
   * @param params 参数
   */
  private formatSql(sql: string, params?: any[]): string {
    if (!params || params.length === 0) {
      return sql;
    }
    
    // 简单格式化：将?替换为参数值
    let formattedSql = sql;
    let paramIndex = 0;
    
    formattedSql = formattedSql.replace(/\?/g, () => {
      const param = params[paramIndex++];
      if (param === null) return 'NULL';
      if (typeof param === 'string') return `'${param}'`;
      return String(param);
    });
    
    return formattedSql;
  }
  
  /**
   * 更新表统计信息
   * @param sql SQL语句
   */
  private updateTableStats(sql: string): void {
    // 提取SQL类型和表名
    const { type, tables } = this.extractSqlInfo(sql);
    if (!type || tables.length === 0) {
      return;
    }
    
    // 更新每个表的统计信息
    for (const table of tables) {
      let stats = this.tableStats.get(table);
      if (!stats) {
        stats = {
          tableName: table,
          selectCount: 0,
          insertCount: 0,
          updateCount: 0,
          deleteCount: 0,
          totalTime: 0,
          lastAccessed: Date.now()
        };
      }
      
      // 更新操作计数
      switch (type) {
        case 'select':
          stats.selectCount++;
          break;
        case 'insert':
          stats.insertCount++;
          break;
        case 'update':
          stats.updateCount++;
          break;
        case 'delete':
          stats.deleteCount++;
          break;
      }
      
      stats.lastAccessed = Date.now();
      this.tableStats.set(table, stats);
    }
  }
  
  /**
   * 从SQL中提取操作类型和表名
   * @param sql SQL语句
   */
  private extractSqlInfo(sql: string): { type: string | null; tables: string[] } {
    const normalized = sql.trim().toLowerCase();
    let type: string | null = null;
    const tables: string[] = [];
    
    // 确定SQL类型
    if (normalized.startsWith('select')) {
      type = 'select';
    } else if (normalized.startsWith('insert')) {
      type = 'insert';
    } else if (normalized.startsWith('update')) {
      type = 'update';
    } else if (normalized.startsWith('delete')) {
      type = 'delete';
    }
    
    // 提取表名（简化版本）
    // 注意：这是一个简单实现，可能不适用于所有复杂SQL
    try {
      if (type === 'select') {
        // 从FROM子句提取表名
        const fromMatch = / from\s+([a-z0-9_`,.\[\]]+)/i.exec(normalized);
        if (fromMatch) {
          tables.push(...this.parseTableNames(fromMatch[1]));
        }
        
        // 从JOIN子句提取表名
        const joinRegex = / join\s+([a-z0-9_`,.\[\]]+)/gi;
        let joinMatch;
        while ((joinMatch = joinRegex.exec(normalized)) !== null) {
          tables.push(...this.parseTableNames(joinMatch[1]));
        }
      } else if (type === 'insert') {
        // 从INSERT INTO子句提取表名
        const match = /insert\s+into\s+([a-z0-9_`,.\[\]]+)/i.exec(normalized);
        if (match) {
          tables.push(...this.parseTableNames(match[1]));
        }
      } else if (type === 'update') {
        // 从UPDATE子句提取表名
        const match = /update\s+([a-z0-9_`,.\[\]]+)/i.exec(normalized);
        if (match) {
          tables.push(...this.parseTableNames(match[1]));
        }
      } else if (type === 'delete') {
        // 从DELETE FROM子句提取表名
        const match = /delete\s+from\s+([a-z0-9_`,.\[\]]+)/i.exec(normalized);
        if (match) {
          tables.push(...this.parseTableNames(match[1]));
        }
      }
    } catch (error) {
      console.error('解析SQL失败:', error);
    }
    
    return { type, tables };
  }
  
  /**
   * 解析表名列表
   * @param tableStr 表名字符串
   */
  private parseTableNames(tableStr: string): string[] {
    const tables: string[] = [];
    
    // 拆分多个表（如果有逗号分隔）
    const tableParts = tableStr.split(',');
    
    for (let part of tableParts) {
      part = part.trim()
        .replace(/`/g, '')
        .replace(/\[|\]/g, '')
        .split(' ')[0]  // 移除别名
        .split('.').pop() || ''; // 获取schema.table中的table部分
      
      if (part.length > 0) {
        tables.push(part);
      }
    }
    
    return tables;
  }
  
  /**
   * 获取慢查询列表
   * @param limit 限制返回数量
   */
  public getSlowQueries(limit?: number): SlowQuery[] {
    return this.slowQueries.slice(0, limit || this.maxSlowQueries);
  }
  
  /**
   * 获取表统计信息
   * @param tableName 可选的表名筛选
   */
  public getTableStats(tableName?: string): TableStats | Map<string, TableStats> {
    if (tableName) {
      return this.tableStats.get(tableName) || {
        tableName,
        selectCount: 0,
        insertCount: 0,
        updateCount: 0,
        deleteCount: 0,
        totalTime: 0,
        lastAccessed: 0
      };
    }
    return new Map(this.tableStats);
  }
  
  /**
   * 获取查询统计信息
   */
  public getStats(): QueryStats {
    return { ...this.stats };
  }
  
  /**
   * 获取最近的查询
   * @param limit 限制返回数量
   */
  public getRecentQueries(limit: number = 20): QueryInfo[] {
    return this.recentQueries.slice(0, limit);
  }
  
  /**
   * 获取当前活跃查询
   */
  public getActiveQueries(): Map<string, QueryInfo> {
    return this.activeQueries;
  }
  
  /**
   * 获取运行时间最长的查询
   * @param limit 限制返回数量
   */
  public getLongRunningQueries(limit: number = 10): QueryInfo[] {
    return this.longRunningQueries.slice(0, limit);
  }
  
  /**
   * 更新长时间运行查询列表
   * @param query 已完成的查询
   */
  private updateLongRunningQueries(query: QueryInfo): void {
    if (!query.duration) return;
    
    // 添加到长运行查询列表并排序
    this.longRunningQueries.push({...query});
    this.longRunningQueries.sort((a, b) => {
      return (b.duration || 0) - (a.duration || 0);
    });
    
    // 限制列表大小
    if (this.longRunningQueries.length > 20) {
      this.longRunningQueries.pop();
    }
  }
  
  /**
   * 启动长时间运行查询检测
   */
  private startLongRunningDetection(): void {
    // 每5秒检查一次长时间运行的查询
    setInterval(() => {
      const now = performance.now();
      const longRunningThreshold = this.slowQueryThreshold * 2; // 长时间运行阈值
      
      for (const query of this.activeQueries.values()) {
        const runningTime = now - query.startTime;
        
        if (runningTime > longRunningThreshold) {
          // 记录长时间运行查询警告
          //console.warn(`查询运行时间过长(${runningTime.toFixed(2)}ms): ${this.formatSql(query.sql, query.parameters)}`);
        }
      }
    }, 5000);
  }
  
  /**
   * 重置统计信息
   * @param keepSlowQueries 是否保留慢查询记录
   */
  public reset(keepSlowQueries: boolean = false): void {
    if (!keepSlowQueries) {
      this.slowQueries = [];
    }
    
    this.stats = {
      totalQueries: 0,
      totalErrors: 0,
      totalDuration: 0,
      averageDuration: 0,
      slowQueries: keepSlowQueries ? this.slowQueries.length : 0,
      maxDuration: 0,
      startTime: Date.now()
    };
    
    this.longRunningQueries = [];
    this.recentQueries = [];
    console.log('查询监控统计已重置');
  }
  
  /**
   * 检查查询ID是否处于活跃状态
   * @param queryId 查询ID
   * @returns 是否活跃
   */
  public isActiveQueryId(queryId: string): boolean {
    return this.activeQueries.has(queryId);
  }
}

/**
 * 包装查询函数，添加监控功能
 * @param fn 原始查询函数
 * @param database 数据库名称
 * @param source 查询来源
 * @returns 包装后的函数
 */
export function withQueryMonitoring<T, Args extends [string, ...any[]]>(
  fn: (...args: Args) => Promise<T>,
  database?: string,
  source?: string
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const monitor = QueryMonitor.getInstance();
    const sql = args[0];
    const params = args.length > 1 ? args[1] : undefined;
    
    // 开始监控
    const queryId = monitor.startQuery(sql, params, database, source);
    
    try {
      // 执行查询
      const result = await fn(...args);
      
      // 结束监控
      const rowCount = Array.isArray(result) ? result.length : undefined;
      monitor.endQuery(queryId, undefined, rowCount);
      
      return result;
    } catch (error: any) {
      // 错误监控
      monitor.endQuery(queryId, error);
      throw error;
    }
  };
}

/**
 * 获取查询监控器单例
 */
export function getQueryMonitor(): QueryMonitor {
  return QueryMonitor.getInstance();
}

/**
 * 导出默认实例
 */
export default getQueryMonitor(); 