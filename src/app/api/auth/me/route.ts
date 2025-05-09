/**
 * 用户信息获取API路由
 * 作者: 阿瑞
 * 功能: 获取当前登录用户的详细信息
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { SystemUserModel } from '@/models/system/SystemUserModel';
import { WorkspaceModel } from '@/models/system/WorkspaceModel';
import { AuthUtils } from '@/lib/auth';

/**
 * 错误接口定义
 */
interface ApiError extends Error {
  message: string;
  status?: number;
}

/**
 * 获取当前用户信息
 */
export async function GET(req: NextRequest) {
  try {
    // 从请求头获取授权令牌
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供授权令牌' },
        { status: 401 }
      );
    }

    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = await AuthUtils.verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }
    
    // 获取用户详细信息
    const user = await SystemUserModel.getById(decoded.id);
    
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在或已被删除' },
        { status: 404 }
      );
    }
    
    // 获取工作空间信息
    const workspace = await WorkspaceModel.getById(user.workspace_id);
    
    // 创建用户信息对象（排除敏感字段）
    const userInfo = AuthUtils.sanitizeUser(user);
    
    // 补充工作空间信息
    if (workspace) {
      userInfo.workspace.name = workspace.name;
      userInfo.workspace.status = workspace.status;
    }
    
    // 返回成功响应
    return NextResponse.json({
      message: '获取用户信息成功',
      user: userInfo
    });
  } catch (error: unknown) {
    console.error('获取用户信息失败:', error);
    
    // 判断错误类型
    const apiError = error as ApiError;
    if (apiError.message === '无效的访问令牌') {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }
    
    // 返回通用错误响应
    return NextResponse.json(
      { error: '获取用户信息过程中发生错误' },
      { status: 500 }
    );
  }
} 