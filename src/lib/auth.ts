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
import * as jose from 'jose';

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
export async function createToken(user: ISystemUser): Promise<string> {
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
    // 使用jose库生成JWT令牌
    const token = await new jose.SignJWT(userInfo as Record<string, any>)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(new TextEncoder().encode(JWT_SECRET));
    
    return token;
  } catch (e) {
    console.error('创建令牌失败:', e);
    throw new Error('创建令牌失败');
  }
}

/**
 * 验证JWT令牌
 */
export const verifyToken = async (token: string): Promise<User | null> => {
  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );
    return payload as unknown as User;
  } catch {
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
  
  return await verifyToken(token);
};

/**
 * 清理用户信息，移除敏感字段
 * @param user 用户信息对象
 * @returns 清理后的用户信息
 */
export const sanitizeUser = (user: ISystemUser): IUserInfo => {
  return {
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
};

/**
 * 导出认证工具集
 */
export const AuthUtils = {
  createToken,
  verifyToken,
  getTokenFromHeader,
  getUserFromAuthHeader,
  sanitizeUser
}; 