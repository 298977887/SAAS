/**
 * 数据库初始化与连接管理模块
 * 作者: 阿瑞
 * 功能: 提供数据库连接、初始化和查询操作
 * 版本: 1.4
 */

import mysql, { Pool, PoolConnection, PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import DbConfig from './config';

/**
 * 数据库连接与操作类
 * 提供数据库连接池管理和数据操作方法
 */
export class Database {
  private static instance: Database;
  private pool: Pool;
  private isConnected: boolean = false;
  private dbExists: boolean = false;
  private tablesInitialized: Set<string> = new Set();
  private static monitorInterval: NodeJS.Timeout | null = null;
  private static healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * 表创建SQL定义
   * 系统所需的所有表结构
   */
  private static readonly TABLE_DEFINITIONS: Record<string, string> = {
    // 工作空间表
    workspaces: `
      CREATE TABLE IF NOT EXISTS \`workspaces\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '空间ID（主键）',
        \`name\` varchar(50) NOT NULL COMMENT '空间名称',
        \`creator_id\` int NOT NULL COMMENT '创建者用户ID',
        \`status\` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=活跃，0=停用）',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        KEY \`idx_creator_id\` (\`creator_id\`) COMMENT '创建者ID索引，提高查询效率'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作空间信息表'
    `,
    
    // 系统用户表
    system_users: `
      CREATE TABLE IF NOT EXISTS \`system_users\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '用户ID（主键）',
        \`username\` varchar(50) NOT NULL COMMENT '登录用户名（唯一）',
        \`password\` varchar(100) NOT NULL COMMENT '加密密码',
        \`email\` varchar(100) NOT NULL COMMENT '电子邮箱（唯一）',
        \`phone\` varchar(20) NOT NULL COMMENT '手机号码（唯一）',
        \`workspace_id\` int NOT NULL COMMENT '所属工作空间ID',
        \`role_type\` varchar(30) NOT NULL DEFAULT 'user' COMMENT '角色类型',
        \`role_name\` varchar(50) NOT NULL DEFAULT '普通用户' COMMENT '角色显示名称',
        \`is_custom_role\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否自定义角色（1=是，0=否）',
        \`status\` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=启用，0=禁用）',
        \`invited_by\` int DEFAULT NULL COMMENT '邀请人ID（NULL表示自主注册）',
        \`invitation_token\` varchar(100) DEFAULT NULL COMMENT '邀请验证令牌',
        \`last_login_at\` datetime DEFAULT NULL COMMENT '最后登录时间',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_username\` (\`username\`),
        UNIQUE KEY \`uk_email\` (\`email\`),
        UNIQUE KEY \`uk_phone\` (\`phone\`),
        KEY \`idx_workspace_id\` (\`workspace_id\`),
        KEY \`idx_invited_by\` (\`invited_by\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表'
    `,
    
    // 用户角色表
    user_roles: `
      CREATE TABLE IF NOT EXISTS \`user_roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '角色ID（主键）',
        \`type\` varchar(30) NOT NULL COMMENT '角色类型',
        \`name\` varchar(50) NOT NULL COMMENT '角色显示名称',
        \`is_custom\` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否自定义（1=是，0=否）',
        \`workspace_id\` int NOT NULL COMMENT '所属工作空间ID',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_type_workspace\` (\`type\`, \`workspace_id\`),
        KEY \`idx_workspace_id\` (\`workspace_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色表'
    `,
    
    // 团队表
    teams: `
      CREATE TABLE IF NOT EXISTS \`teams\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '团队ID（主键）',
        \`team_code\` varchar(30) NOT NULL COMMENT '团队唯一编码',
        \`name\` varchar(50) NOT NULL COMMENT '团队名称',
        \`db_host\` varchar(100) NOT NULL COMMENT '数据库主机地址',
        \`db_name\` varchar(50) NOT NULL COMMENT '数据库名称',
        \`db_username\` varchar(50) NOT NULL COMMENT '数据库用户名',
        \`db_password\` varchar(100) NOT NULL COMMENT '数据库密码',
        \`workspace_id\` int NOT NULL COMMENT '所属工作空间ID',
        \`owner_id\` int NOT NULL COMMENT '团队管理员ID',
        \`status\` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=正常，0=停用）',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_team_code\` (\`team_code\`),
        KEY \`idx_workspace_id\` (\`workspace_id\`),
        KEY \`idx_owner_id\` (\`owner_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队信息表'
    `,
    
    // 用户-团队关系表
    user_team_relations: `
      CREATE TABLE IF NOT EXISTS \`user_team_relations\` (
        \`id\` int NOT NULL AUTO_INCREMENT COMMENT '关系ID（主键）',
        \`user_id\` int NOT NULL COMMENT '用户ID',
        \`team_id\` int NOT NULL COMMENT '团队ID',
        \`role\` varchar(20) NOT NULL DEFAULT 'member' COMMENT '角色（owner=拥有者，admin=管理员，member=成员）',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_team\` (\`user_id\`,\`team_id\`) COMMENT '确保用户在一个团队中只有一个角色',
        KEY \`idx_team_id\` (\`team_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户团队关系表'
    `
  };

  /**
   * 外键定义
   * 定义表之间的关系
   */
  private static readonly FOREIGN_KEY_DEFINITIONS: string[] = [
    // 系统用户表的外键
    `ALTER TABLE \`system_users\` 
     ADD CONSTRAINT \`fk_user_workspace\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\` (\`id\`),
     ADD CONSTRAINT \`fk_user_inviter\` FOREIGN KEY (\`invited_by\`) REFERENCES \`system_users\` (\`id\`)`,
    
    // 用户角色表的外键
    `ALTER TABLE \`user_roles\` 
     ADD CONSTRAINT \`fk_role_workspace\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\` (\`id\`)`,
     
    // 团队表的外键
    `ALTER TABLE \`teams\` 
     ADD CONSTRAINT \`fk_team_workspace\` FOREIGN KEY (\`workspace_id\`) REFERENCES \`workspaces\` (\`id\`),
     ADD CONSTRAINT \`fk_team_owner\` FOREIGN KEY (\`owner_id\`) REFERENCES \`system_users\` (\`id\`)`,
    
    // 用户-团队关系表的外键
    `ALTER TABLE \`user_team_relations\` 
     ADD CONSTRAINT \`fk_relation_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`system_users\` (\`id\`),
     ADD CONSTRAINT \`fk_relation_team\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\` (\`id\`)`
  ];

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor(config: PoolOptions) {
    // 初始化一个没有指定数据库的连接池，用于检查和创建数据库
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0
    });

    console.log(`数据库连接池初始化: 连接限制=${config.connectionLimit || 10}, 队列限制=${config.queueLimit || 0}`);
    console.log(`数据库连接初始化至: ${config.host}:${config.port}`);
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database({
        host: DbConfig.host,
        port: DbConfig.port,
        user: DbConfig.adminUser,
        password: DbConfig.adminPassword,
        connectionLimit: 10,
        queueLimit: 0
      });
    }
    return Database.instance;
  }

  /**
   * 获取连接池
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * 检查并创建数据库
   * 在使用数据库前，确保数据库存在
   */
  private async ensureDatabase(): Promise<boolean> {
    if (this.dbExists) {
      return true;
    }

    try {
      console.log(`检查数据库 ${DbConfig.database} 是否存在...`);
      
      // 查询数据库是否存在
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SHOW DATABASES LIKE ?`,
        [DbConfig.database]
      );
      
      if (rows.length === 0) {
        // 数据库不存在，创建数据库
        console.log(`数据库 ${DbConfig.database} 不存在，正在创建...`);
        await this.pool.query(
          `CREATE DATABASE IF NOT EXISTS \`${DbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
        );
        console.log(`数据库 ${DbConfig.database} 创建成功`);
      } else {
        console.log(`数据库 ${DbConfig.database} 已存在`);
      }
      
      // 关闭当前连接池
      await this.pool.end();
      
      // 创建一个连接到新数据库的连接池
      this.pool = mysql.createPool({
        host: DbConfig.host,
        port: DbConfig.port,
        user: DbConfig.adminUser,
        password: DbConfig.adminPassword,
        database: DbConfig.database,
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 30,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        idleTimeout: 60000
      });
      
      // 监听连接池事件
      this.pool.on('connection', () => {
        console.log(`主数据库建立了新连接`);
      });
      
      this.pool.on('release', () => {
        //console.log(`主数据库释放了一个连接`);
      });
      
      this.pool.on('enqueue', () => {
        console.log(`主数据库连接请求进入队列等待`);
      });
      
      console.log(`已连接到数据库 ${DbConfig.database}`);
      this.dbExists = true;
      this.isConnected = true;
      this.setupMonitoring();
      
      return true;
    } catch (error) {
      console.error(`创建/连接数据库失败:`, error);
      this.isConnected = false;
      this.dbExists = false;
      throw error;
    }
  }

  /**
   * 设置监控定时器
   */
  private setupMonitoring() {
    // 仅在首次实例化时设置定时器
    if (Database.monitorInterval === null) {
      Database.monitorInterval = setInterval(async () => {
        try {
          //console.log(`连接池状态监控：${new Date().toISOString()}`);
          // 简单的健康检查
          await this.pool.query('SELECT 1');
        } catch (error) {
          console.error('连接池状态监控失败:', error);
          this.isConnected = false;
        }
      }, 60000); // 每分钟记录一次
    }

    // 仅在首次实例化时设置健康检查定时器
    if (Database.healthCheckInterval === null) {
      Database.healthCheckInterval = setInterval(async () => {
        try {
          await this.pool.query('SELECT 1');
        } catch (error) {
          console.error('数据库连接健康检查失败:', error);
          this.isConnected = false;
        }
      }, 60000); // 每分钟检查一次
    }
  }

  /**
   * 确保数据库连接和初始化
   */
  public async ensureConnection(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    const maxRetries = 3;
    const retryDelay = 1000;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // 确保数据库存在
        await this.ensureDatabase();
        
        // 尝试获取连接并执行简单查询
        console.log(`尝试连接数据库 (尝试 ${retries + 1}/${maxRetries})...`);
        await this.pool.query('SELECT 1');
        this.isConnected = true;
        console.log('数据库连接成功');
        
        // 连接成功后，确保所有表都被初始化
        await this.initializeTables();
        
        return true;
      } catch (error: any) {
        retries++;
        
        // 区分不同类型的错误
        if (error.code === 'ER_CON_COUNT_ERROR') {
          // 连接数超限，记录更详细的错误信息
          console.error('连接池已满/Too many connections:', error);
          
          // 在连接池已满的情况下，等待更长时间
          await new Promise(resolve => setTimeout(resolve, retryDelay * 2));
        } else {
          // 其他类型的错误
          console.error('数据库连接失败:', error);
          
          // 常规等待
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    }

    // 如果所有重试都失败，抛出异常
    console.error(`数据库连接失败，已重试 ${maxRetries} 次`);
    this.isConnected = false;
    throw new Error(`数据库连接失败，请检查MySQL服务器状态和配置`);
  }

  /**
   * 初始化系统表结构
   * 检查并创建所有必要的表
   */
  public async initializeTables(): Promise<void> {
    try {
      await this.ensureConnection();
      
      console.log('开始初始化系统表...');
      
      // 创建所有表
      for (const [tableName, tableDefinition] of Object.entries(Database.TABLE_DEFINITIONS)) {
        await this.ensureTable(tableName, tableDefinition);
      }
      
      // 添加外键关系
      try {
        console.log('尝试添加外键约束...');
        for (const foreignKeyDefinition of Database.FOREIGN_KEY_DEFINITIONS) {
          // 从定义中提取表名和约束名
          const tableMatch = foreignKeyDefinition.match(/ALTER TABLE `(\w+)`/i);
          const constraintMatches = foreignKeyDefinition.match(/ADD CONSTRAINT `([^`]+)`/gi);
          
          if (tableMatch && constraintMatches) {
            const tableName = tableMatch[1];
            let skipDefinition = true;
            
            // 检查每个约束是否存在
            for (const constraintMatch of constraintMatches) {
              const constraintName = constraintMatch.match(/ADD CONSTRAINT `([^`]+)`/i)![1];
              
              // 检查外键是否存在
              const exists = await this.checkForeignKeyExists(tableName, constraintName);
              if (!exists) {
                skipDefinition = false;
                break;
              }
            }
            
            // 如果所有约束都已存在，则跳过此定义
            if (skipDefinition) {
              console.log(`外键约束已存在，跳过添加: ${constraintMatches.join(', ')}`);
              continue;
            }
          }
          
          // 执行外键添加
          await this.pool.query(foreignKeyDefinition);
        }
      } catch (fkError) {
        console.warn('添加外键约束时出现警告（这可能是正常的，如果表中已有数据或约束已存在）:', fkError);
      }
      
      console.log('数据库表初始化完成！');
    } catch (error) {
      console.error('初始化表结构失败:', error);
      throw error;
    }
  }

  /**
   * 检查外键约束是否存在
   * @param tableName 表名
   * @param constraintName 约束名
   * @returns 是否存在
   */
  private async checkForeignKeyExists(tableName: string, constraintName: string): Promise<boolean> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT * FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND CONSTRAINT_NAME = ? 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        [DbConfig.database, tableName, constraintName]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error(`检查外键约束存在时出错:`, error);
      return false;
    }
  }

  /**
   * 检查表是否存在，如果不存在则创建
   * @param tableName 表名
   * @param createSQL 创建表的SQL语句（可选，如果不提供则从TABLE_DEFINITIONS中获取）
   */
  public async ensureTable(tableName: string, createSQL?: string): Promise<void> {
    // 确保数据库连接
    await this.ensureConnection();
    
    if (this.tablesInitialized.has(tableName)) {
      return;
    }

    try {
      // 检查表是否存在
      const [tables] = await this.pool.query<RowDataPacket[]>(
        `SHOW TABLES LIKE ?`,
        [tableName]
      );

      if (tables.length === 0) {
        // 表不存在，创建表
        console.log(`表 ${tableName} 不存在，开始创建...`);
        const sql = createSQL || Database.TABLE_DEFINITIONS[tableName];
        if (!sql) {
          throw new Error(`未找到表 ${tableName} 的创建语句`);
        }
        await this.pool.query(sql);
        console.log(`表 ${tableName} 创建成功`);
      } else {
        console.log(`表 ${tableName} 已存在`);
      }

      this.tablesInitialized.add(tableName);
    } catch (error) {
      console.error(`确保表 ${tableName} 存在时出错:`, error);
      throw error;
    }
  }

  /**
   * 执行查询
   * @param sql SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    await this.ensureConnection();

    let connection: PoolConnection | null = null;
    try {
      // 获取连接
      connection = await this.pool.getConnection();
      
      // 使用连接执行查询
      const [rows] = await connection.query<RowDataPacket[]>(sql, params || []);
      return rows as unknown as T[];
    } catch (error) {
      console.error('执行查询失败:', error);
      throw error;
    } finally {
      // 确保连接被释放
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * 执行插入操作
   * @param table 表名
   * @param data 要插入的数据
   * @returns 插入的记录ID
   */
  public async insert(table: string, data: Record<string, any>): Promise<number> {
    await this.ensureConnection();
    await this.ensureTable(table);

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value === null ? null : value;
      }
      return acc;
    }, {} as Record<string, any>);

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO ${table} SET ?`,
      [cleanData]
    );

    return result.insertId;
  }

  /**
   * 执行更新操作
   * @param table 表名
   * @param data 要更新的数据
   * @param where WHERE条件语句
   * @param whereParams WHERE条件参数
   * @returns 受影响的行数
   */
  public async update(
    table: string,
    data: Record<string, any>,
    where: string,
    whereParams?: any[]
  ): Promise<number> {
    await this.ensureConnection();
    await this.ensureTable(table);

    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value === null ? null : value;
      }
      return acc;
    }, {} as Record<string, any>);

    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE ${table} SET ? WHERE ${where}`,
      [cleanData, ...(whereParams || [])]
    );

    return result.affectedRows;
  }

  /**
   * 执行删除操作
   * @param table 表名
   * @param where WHERE条件语句
   * @param params WHERE条件参数
   * @returns 受影响的行数
   */
  public async delete(table: string, where: string, params?: any[]): Promise<number> {
    await this.ensureConnection();
    await this.ensureTable(table);

    const [result] = await this.pool.query<ResultSetHeader>(
      `DELETE FROM ${table} WHERE ${where}`,
      params || []
    );
    return result.affectedRows;
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   * @returns 事务执行结果
   */
  public async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    await this.ensureConnection();
    const connection = await this.pool.getConnection();

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
   * 关闭连接池
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      this.dbExists = false;
      
      // 清理定时器
      Database.clearIntervals();
    }
  }
  
  /**
   * 清理所有定时器
   */
  private static clearIntervals(): void {
    if (Database.monitorInterval) {
      clearInterval(Database.monitorInterval);
      Database.monitorInterval = null;
    }
    
    if (Database.healthCheckInterval) {
      clearInterval(Database.healthCheckInterval);
      Database.healthCheckInterval = null;
    }
  }
}

// 导出数据库实例
const db = Database.getInstance();
export default db; 