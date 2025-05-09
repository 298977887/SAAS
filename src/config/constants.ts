/**
 * 系统常量配置
 * 作者: 阿瑞
 * 功能: 提供系统全局常量定义
 * 版本: 1.0.0
 */

// JWT相关配置
export const JWT_SECRET = process.env.JWT_SECRET || 'saas-app-secret-key-for-development';
export const JWT_EXPIRES_IN = '24h'; 