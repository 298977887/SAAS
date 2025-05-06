/**
 * 数据库模块入口
 * 作者: 阿瑞
 * 功能: 导出所有数据库相关功能
 * 版本: 1.0
 */

import db, { Database } from './init';
import { ConnectionManager } from './connection-manager';
import DbConfig from './config';

/**
 * 初始化数据库
 * 确保所有必需的数据库表都已创建
 */
export async function initDatabase(): Promise<void> {
  try {
    await ConnectionManager.initialize();
    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 导出数据库相关类和实例
export { 
  Database,
  db as default,
  ConnectionManager,
  DbConfig
}; 