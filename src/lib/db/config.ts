/**
 * 数据库配置模块
 * 作者: 阿瑞
 * 功能: 提供数据库连接配置
 * 版本: 1.0
 */

/**
 * 数据库连接配置
 * 优先从环境变量读取，如果环境变量不存在则使用默认值
 */
export const DbConfig = {
  // 数据库连接基本配置
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  
  // 管理员账号(需要有创建数据库权限)
  adminUser: process.env.DB_ADMIN_USER || 'root',
  adminPassword: process.env.DB_ADMIN_PASSWORD || 'aiwoQwo520..',
  
  // 常规用户账号(用于应用程序连接)
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'aiwoQwo520..',

  // 数据库名称
  database: process.env.DB_DATABASE || 'saas_master',
  
  // 连接池配置
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
  
  // 重试配置
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
};

export default DbConfig; 