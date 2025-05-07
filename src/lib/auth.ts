/**
 * 认证工具类
 * 作者: 阿瑞
 * 功能: 提供密码加密验证和JWT生成功能
 * 版本: 1.2
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ISystemUser } from '@/models/system/types';
import { IUserInfo } from '@/store/userStore';

/**
 * JWT密钥配置
 * 生产环境中应从环境变量中获取
 */
const JWT_SECRET = process.env.JWT_SECRET || 'saas-app-secret-key-for-development';
const JWT_EXPIRES_IN = '24h';

/**
 * 认证工具类
 * 提供密码加密验证和JWT生成功能
 */
export class AuthUtils {
  /**
   * 生成密码哈希
   * @param password 明文密码
   * @returns 加密后的哈希密码
   */
  public static async hashPassword(password: string): Promise<string> {
    // 使用bcrypt生成哈希，密码复杂度为10
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 哈希密码
   * @returns 是否匹配
   */
  public static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // 使用bcrypt验证密码
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * 生成JWT令牌
   * @param user 用户信息
   * @returns 生成的JWT令牌
   */
  public static generateToken(user: ISystemUser): string {
    // 从用户信息中提取JWT负载数据
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleType: user.role_type,
      workspaceId: user.workspace_id
    };

    // 生成JWT令牌
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * 验证JWT令牌
   * @param token JWT令牌
   * @returns 解码后的用户信息
   */
  public static verifyToken(token: string): any {
    try {
      // 验证并解码JWT令牌
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('无效的访问令牌');
    }
  }

  /**
   * 提取验证后的用户信息
   * 去除敏感字段后返回
   * @param user 用户完整信息
   * @returns 清理后的用户信息
   */
  public static sanitizeUser(user: ISystemUser): IUserInfo {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      roleType: user.role_type,
      roleName: user.role_name,
      isCustomRole: user.is_custom_role,
      status: user.status,
      workspace: {
        id: user.workspace_id,
        name: '', // 需要从工作空间数据中获取
        status: 1 // 默认为启用状态
      },
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at).toISOString() : undefined
    };
  }
} 