/**
 * 数据库查询缓存模块
 * 作者: 阿瑞
 * 功能: 提供数据库查询结果缓存，减少重复查询，提高性能
 * 版本: 1.0
 */

/**
 * 缓存项接口
 */
interface CacheItem<T> {
  data: T;                  // 缓存的数据
  expiry: number;           // 过期时间戳
  hash: string;             // 查询唯一标识
  hits: number;             // 命中次数
  lastAccessed: number;     // 最后访问时间
  size: number;             // 数据大小估算(字节)
}

/**
 * 缓存配置接口
 */
interface CacheConfig {
  ttl: number;              // 默认缓存生存时间(毫秒)
  maxItems: number;         // 最大缓存项数量
  maxSize: number;          // 最大缓存占用内存(字节)
  enabled: boolean;         // 是否启用缓存
  evictionPolicy: 'lru' | 'lfu' | 'ttl';  // 缓存淘汰策略
}

/**
 * 缓存统计接口
 */
interface CacheStats {
  hits: number;             // 缓存命中次数
  misses: number;           // 缓存未命中次数
  size: number;             // 当前缓存大小(字节)
  itemCount: number;        // 当前缓存项数量
  evictions: number;        // 淘汰次数
  hitRate: number;          // 命中率
}

/**
 * 表更新事件追踪
 */
interface TableUpdate {
  table: string;            // 表名
  timestamp: number;        // 更新时间戳
  operation: 'insert' | 'update' | 'delete';  // 操作类型
}

/**
 * 查询缓存管理器
 * 提供数据库查询结果的内存缓存
 */
export class QueryCache {
  private static instance: QueryCache;
  private cache: Map<string, CacheItem<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    itemCount: 0,
    evictions: 0,
    hitRate: 0
  };
  private tableUpdates: Map<string, TableUpdate> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  /**
   * 默认缓存配置
   */
  private config: CacheConfig = {
    ttl: 60 * 1000,         // 默认1分钟过期
    maxItems: 1000,         // 最多缓存1000个查询
    maxSize: 50 * 1024 * 1024, // 最大50MB内存占用
    enabled: true,          // 默认启用
    evictionPolicy: 'lru'   // 默认使用LRU淘汰策略
  };
  
  /**
   * 私有构造函数
   */
  private constructor() {
    // 启动自动清理定时器
    this.startCleanupTimer();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): QueryCache {
    if (!QueryCache.instance) {
      QueryCache.instance = new QueryCache();
    }
    return QueryCache.instance;
  }
  
  /**
   * 设置缓存配置
   * @param config 缓存配置
   */
  public setConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('查询缓存配置已更新:', this.config);
  }
  
  /**
   * 获取当前缓存配置
   */
  public getConfig(): CacheConfig {
    return { ...this.config };
  }
  
  /**
   * 生成查询的唯一哈希值
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询哈希值
   */
  private generateHash(sql: string, params?: any[]): string {
    // 简单哈希方法：SQL + 参数序列化
    const paramStr = params ? JSON.stringify(params) : '';
    return `${sql}:${paramStr}`;
  }
  
  /**
   * 估算数据大小(字节)
   * @param data 要估算大小的数据
   * @returns 估算的字节大小
   */
  private estimateSize(data: any): number {
    const json = JSON.stringify(data);
    return json.length * 2; // 每个字符约2字节
  }
  
  /**
   * 获取缓存项
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 缓存的数据，未命中则返回null
   */
  public get<T>(sql: string, params?: any[]): T | null {
    if (!this.config.enabled) {
      return null;
    }
    
    // 生成查询哈希
    const hash = this.generateHash(sql, params);
    
    // 检查缓存
    const item = this.cache.get(hash);
    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(hash);
      this.stats.size -= item.size;
      this.stats.itemCount--;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
    
    // 检查相关表是否已更新
    const tablesInQuery = this.extractTablesFromSql(sql);
    for (const table of tablesInQuery) {
      const update = this.tableUpdates.get(table);
      if (update && update.timestamp > item.lastAccessed) {
        this.cache.delete(hash);
        this.stats.size -= item.size;
        this.stats.itemCount--;
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
    }
    
    // 更新访问统计
    item.hits++;
    item.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();
    
    return item.data;
  }
  
  /**
   * 从SQL语句中提取表名
   * 简单实现，实际中可能需要更复杂的SQL解析
   * @param sql SQL查询语句
   * @returns 查询中涉及的表名数组
   */
  private extractTablesFromSql(sql: string): string[] {
    const tables: string[] = [];
    
    // 尝试匹配FROM和JOIN后面的表名
    // 这是一个简单实现，可能不适用于所有复杂SQL
    const normalized = sql.replace(/\s+/g, ' ').toLowerCase();
    
    // 匹配FROM子句中的表
    const fromMatch = / from ([a-z0-9_`,.\[\]]+)/i.exec(normalized);
    if (fromMatch) {
      const fromTables = fromMatch[1].split(',').map(t => {
        // 清理表名
        return t.trim()
          .replace(/`/g, '')
          .replace(/\[|\]/g, '')
          .split(' ')[0]  // 获取别名前的表名
          .split('.').pop() || ''; // 获取schema.table中的table部分
      });
      tables.push(...fromTables);
    }
    
    // 匹配JOIN子句中的表
    const joinRegex = / join ([a-z0-9_`,.\[\]]+)/gi;
    let joinMatch;
    while ((joinMatch = joinRegex.exec(normalized)) !== null) {
      const joinTable = joinMatch[1].trim()
        .replace(/`/g, '')
        .replace(/\[|\]/g, '')
        .split(' ')[0]
        .split('.').pop() || '';
      tables.push(joinTable);
    }
    
    // 推断INSERT, UPDATE, DELETE操作的表
    if (normalized.startsWith('insert into ')) {
      const match = /insert into ([a-z0-9_`,.\[\]]+)/i.exec(normalized);
      if (match) {
        const table = match[1].trim()
          .replace(/`/g, '')
          .replace(/\[|\]/g, '')
          .split(' ')[0]
          .split('.').pop() || '';
        tables.push(table);
      }
    } else if (normalized.startsWith('update ')) {
      const match = /update ([a-z0-9_`,.\[\]]+)/i.exec(normalized);
      if (match) {
        const table = match[1].trim()
          .replace(/`/g, '')
          .replace(/\[|\]/g, '')
          .split(' ')[0]
          .split('.').pop() || '';
        tables.push(table);
      }
    } else if (normalized.startsWith('delete ')) {
      const match = /delete from ([a-z0-9_`,.\[\]]+)/i.exec(normalized);
      if (match) {
        const table = match[1].trim()
          .replace(/`/g, '')
          .replace(/\[|\]/g, '')
          .split(' ')[0]
          .split('.').pop() || '';
        tables.push(table);
      }
    }
    
    // 过滤空表名和去重
    return [...new Set(tables.filter(t => t.length > 0))];
  }
  
  /**
   * 设置缓存项
   * @param sql SQL查询语句
   * @param params 查询参数
   * @param data 要缓存的数据
   * @param ttl 可选的过期时间(毫秒)
   */
  public set<T>(sql: string, params: any[] | undefined, data: T, ttl?: number): void {
    if (!this.config.enabled) {
      return;
    }
    
    // 不缓存空结果或非SELECT查询
    if (data === null || data === undefined || !sql.trim().toLowerCase().startsWith('select')) {
      return;
    }
    
    // 生成查询哈希
    const hash = this.generateHash(sql, params);
    
    // 估算数据大小
    const size = this.estimateSize(data);
    
    // 设置过期时间
    const expiry = Date.now() + (ttl || this.config.ttl);
    
    // 创建缓存项
    const item: CacheItem<T> = {
      data,
      expiry,
      hash,
      hits: 1,
      lastAccessed: Date.now(),
      size
    };
    
    // 检查缓存限制并可能驱逐项目
    this.ensureCacheLimit(size);
    
    // 存储到缓存
    this.cache.set(hash, item);
    this.stats.size += size;
    this.stats.itemCount++;
  }
  
  /**
   * 确保缓存在限制范围内
   * 如果需要，根据驱逐策略删除缓存项
   * @param newItemSize 新添加项的大小
   */
  private ensureCacheLimit(newItemSize: number): void {
    // 检查缓存项数量限制
    if (this.stats.itemCount >= this.config.maxItems) {
      this.evictItems();
    }
    
    // 检查缓存大小限制
    if (this.stats.size + newItemSize > this.config.maxSize) {
      this.evictItems(Math.ceil((this.stats.size + newItemSize - this.config.maxSize) / 20000));
    }
  }
  
  /**
   * 根据驱逐策略清除缓存项
   * @param count 要清除的项数量
   */
  private evictItems(count: number = 1): void {
    if (this.cache.size === 0) {
      return;
    }
    
    // 获取所有缓存项
    const items = Array.from(this.cache.values());
    
    if (this.config.evictionPolicy === 'lru') {
      // 按最后访问时间排序（最早的在前）
      items.sort((a, b) => a.lastAccessed - b.lastAccessed);
    } else if (this.config.evictionPolicy === 'lfu') {
      // 按命中次数排序（最少的在前）
      items.sort((a, b) => a.hits - b.hits);
    } else if (this.config.evictionPolicy === 'ttl') {
      // 按过期时间排序（最早过期的在前）
      items.sort((a, b) => a.expiry - b.expiry);
    }
    
    // 删除指定数量的项
    for (let i = 0; i < count && i < items.length; i++) {
      const item = items[i];
      this.cache.delete(item.hash);
      this.stats.size -= item.size;
      this.stats.itemCount--;
      this.stats.evictions++;
    }
  }
  
  /**
   * 使指定表的缓存无效
   * @param tableName 表名
   * @param operation 导致无效的操作类型
   */
  public invalidateTable(tableName: string, operation: 'insert' | 'update' | 'delete'): void {
    if (!this.config.enabled) {
      return;
    }
    
    // 记录表更新
    this.tableUpdates.set(tableName, {
      table: tableName,
      timestamp: Date.now(),
      operation
    });
    
    // 可选：立即清除包含该表的所有缓存
    // 对于小型缓存，可以直接清理；对于大型缓存，可以延迟到下次访问时检查更新时间
    if (this.cache.size < 100) { // 如果缓存项较少，直接清理
      for (const [hash, item] of this.cache.entries()) {
        const tablesInQuery = this.extractTablesFromSql(hash.split(':')[0]);
        if (tablesInQuery.includes(tableName)) {
          this.stats.size -= item.size;
          this.stats.itemCount--;
          this.cache.delete(hash);
        }
      }
    }
  }
  
  /**
   * 清除所有缓存
   */
  public clear(): void {
    this.cache.clear();
    this.tableUpdates.clear();
    this.stats.size = 0;
    this.stats.itemCount = 0;
    console.log('查询缓存已清空');
  }
  
  /**
   * 获取缓存统计信息
   */
  public getStats(): CacheStats {
    return { ...this.stats };
  }
  
  /**
   * 更新缓存命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total === 0 ? 0 : this.stats.hits / total;
  }
  
  /**
   * 开始缓存清理定时器
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
    }
    
    // 每分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredItems();
    }, 60 * 1000);
  }
  
  /**
   * 清理过期的缓存项
   */
  private cleanupExpiredItems(): void {
    if (!this.config.enabled || this.cache.size === 0) {
      return;
    }
    
    const now = Date.now();
    let expiredCount = 0;
    let freedSize = 0;
    
    for (const [hash, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(hash);
        freedSize += item.size;
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.stats.size -= freedSize;
      this.stats.itemCount -= expiredCount;
      console.log(`清理了${expiredCount}个过期缓存项，释放${Math.round(freedSize / 1024)}KB内存`);
    }
    
    // 清理过旧的表更新记录
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;
    for (const [table, update] of this.tableUpdates.entries()) {
      if (update.timestamp < twoHoursAgo) {
        this.tableUpdates.delete(table);
      }
    }
  }
  
  /**
   * 停止缓存管理器
   */
  public stop(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.cache.clear();
    this.tableUpdates.clear();
    
    // 重置统计数据
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      itemCount: 0,
      evictions: 0,
      hitRate: 0
    };
  }
}

/**
 * 获取查询缓存单例
 */
export function getQueryCache(): QueryCache {
  return QueryCache.getInstance();
}

/**
 * 导出默认实例
 */
export default getQueryCache(); 