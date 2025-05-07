/**
 * 用户API路由
 * 作者: 阿瑞
 * 功能: 处理用户的增删改查请求
 * 版本: 1.1
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SystemUserModel } from '@/models/system';
import { ICreateUserParams } from '@/models/system/types';

/**
 * 获取用户列表
 * GET /api/users
 */
export async function GET(request: NextRequest) {
  try {
    // 获取请求中的查询参数
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');
    
    let users;
    
    // 根据工作空间ID筛选或获取所有用户
    if (workspaceId) {
      users = await SystemUserModel.getByWorkspace(parseInt(workspaceId));
    } else {
      users = await SystemUserModel.getAll();
    }
    
    // 过滤敏感信息
    const sanitizedUsers = users.map(user => {
      // 移除密码和其他敏感字段
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    return NextResponse.json(sanitizedUsers);
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取用户列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新用户
 * POST /api/users
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 构建创建参数
    const userData: ICreateUserParams = {
      username: body.username,
      password: body.password, // 此时密码应该已经加密(或在这里加密)
      email: body.email,
      phone: body.phone,
      workspace_id: body.workspace_id,
      role_type: body.role_type || 'user',
      role_name: body.role_name || '普通用户',
      is_custom_role: body.is_custom_role || false,
      invited_by: body.invited_by,
      invitation_token: body.invitation_token
    };
    
    // 验证必填字段
    if (!userData.username || !userData.password || !userData.email || !userData.phone || !userData.workspace_id) {
      return NextResponse.json(
        { error: '用户名、密码、邮箱、手机号和工作空间ID都是必填的' },
        { status: 400 }
      );
    }
    
    // 检查用户名是否已存在
    const existingUserByUsername = await SystemUserModel.getByUsername(userData.username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await SystemUserModel.getByEmail(userData.email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: '邮箱已被注册' },
        { status: 409 }
      );
    }
    
    // 如果密码没有加密，在这里进行加密
    if (!body.password.startsWith('$2')) { // 检查是否已经是bcrypt加密的密码
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    // 创建用户
    const userId = await SystemUserModel.create(userData);
    
    // 获取新创建的用户(不含密码)
    const newUser = await SystemUserModel.getById(userId);
    const { password, ...safeUser } = newUser!;
    
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error: any) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { error: error.message || '创建用户失败' },
      { status: 500 }
    );
  }
} 