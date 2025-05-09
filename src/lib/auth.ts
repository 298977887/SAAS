/**
 * 用户认证工具模块
 * 作者: 阿瑞
 * 功能: 提供用户认证相关的工具函数
 * 版本: 1.0.0
 */

import { NextRequest } from 'next/server';
import { ISystemUser } from '@/models/system/types';
import { IUserInfo } from '@/store/userStore';
import { JWT_SECRET } from '@/config/constants';
import jwt from 'jsonwebtoken';

/**
 * JWT密钥配置
 * 生产环境中应从环境变量中获取
 */
const JWT_EXPIRES_IN = '24h';

/**
 * 用户信息接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  teamId?: number;
}

/**
 * 创建JWT令牌
 * @param user 用户信息
 * @returns JWT令牌
 */
export function createToken(user: ISystemUser): string {
  const userInfo: IUserInfo = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
    isAdmin: user.role === 'admin',
    teamId: user.currentTeamId,
    phone: user.phone || '',
    roleType: user.role_type || 'user',
    roleName: user.role_name || '用户',
    isCustomRole: user.is_custom_role || false,
    status: user.status || 1,
    workspace: {
      id: user.workspace_id || 0,
      name: '',
      status: 1
    }
  };
  
  try {
    // 生成JWT令牌
    const token = jwt.sign(userInfo, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
    
    return token;
  } catch (error) {
    console.error('创建令牌失败:', error);
    throw new Error('创建令牌失败');
  }
}

/**
 * 验证JWT令牌
 */
export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as User;
  } catch (error) {
    return null;
  }
};

/**
 * 从请求头获取Token
 */
export const getTokenFromHeader = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
};

/**
 * 从请求头获取用户信息
 */
export const getUserFromAuthHeader = async (req: NextRequest): Promise<User | null> => {
  const token = getTokenFromHeader(req);
  if (!token) return null;
  
  return verifyToken(token);
};

/**
 * 导出认证工具集
 */
export const AuthUtils = {
  createToken,
  verifyToken,
  getTokenFromHeader,
  getUserFromAuthHeader
}; 