/**
 * 工作空间成员列表API路由
 * 作者: 阿瑞
 * 功能: 获取当前工作空间下的所有成员
 * 版本: 1.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import db from '@/lib/db';

/**
 * 错误接口
 */
interface ApiError extends Error {
  message: string;
}

/**
 * 获取工作空间的成员列表
 */
export async function GET(req: NextRequest) {
  try {
    console.log('API: 接收到获取成员列表请求');
    
    // 获取查询参数
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    
    console.log('API: 获取工作空间ID:', workspaceId);
    
    // 验证参数
    if (!workspaceId) {
      console.log('API: 缺少工作空间ID参数');
      return NextResponse.json({ error: '缺少工作空间ID参数' }, { status: 400 });
    }
    
    // 从请求中获取授权信息
    const authHeader = req.headers.get('Authorization');
    console.log('API: 授权头信息:', authHeader ? '存在' : '不存在');
    
    let userId = null;
    
    // 尝试验证授权
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = await AuthUtils.verifyToken(token);
        if (decoded) {
          userId = decoded.id;
          console.log('API: 令牌验证成功, 用户ID:', userId);
        }
      } catch (error) {
        console.log('API: 令牌验证失败, 跳过用户验证');
        // 令牌验证失败时，只是记录错误，但仍然允许请求继续
      }
    }
    
    // 查询工作空间成员，排除密码字段
    console.log('API: 查询工作空间ID:', workspaceId, '的成员');
    
    const members = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        phone, 
        role_type as roleType, 
        role_name as roleName,
        is_custom_role as isCustomRole,
        status, 
        last_login_at as lastLoginAt, 
        created_at as createdAt
       FROM system_users 
       WHERE workspace_id = ?
       ORDER BY role_type DESC, username ASC`,
      [workspaceId]
    );
    
    console.log('API: 查询到成员数量:', members.length);
    
    // 返回成员列表
    return NextResponse.json({
      members
    });
    
  } catch (error: unknown) {
    const err = error as ApiError;
    console.error('API: 获取工作空间成员列表失败:', err);
    
    // 其他错误
    return NextResponse.json(
      { error: '获取工作空间成员列表失败: ' + err.message },
      { status: 500 }
    );
  }
} 