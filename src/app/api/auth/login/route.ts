/**
 * 登录API路由
 * 作者: 阿瑞
 * 功能: 处理用户登录验证并返回JWT令牌
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { SystemUserModel } from '@/models/system/SystemUserModel';
import { WorkspaceModel } from '@/models/system/WorkspaceModel';
import { AuthUtils } from '@/lib/auth';
import { UserStatus } from '@/models/system/types';
import bcrypt from 'bcryptjs';

/**
 * 处理登录请求
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    const { username, password } = body;

    // 验证请求数据
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 查询用户信息
    const user = await SystemUserModel.getByUsername(username);

    // 用户不存在
    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    if (!user.password) {
      return NextResponse.json(
        { error: '用户密码数据异常' },
        { status: 500 }
      );
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户状态是否正常
    if (user.status !== UserStatus.ENABLED) {
      return NextResponse.json(
        { error: '账户已被禁用，请联系管理员' },
        { status: 403 }
      );
    }

    // 获取工作空间信息
    const workspace = await WorkspaceModel.getById(user.workspace_id);
    if (!workspace) {
      return NextResponse.json(
        { error: '用户工作空间不存在或已被删除' },
        { status: 403 }
      );
    }

    // 更新最后登录时间
    await SystemUserModel.updateLastLogin(user.id);

    // 创建用户信息对象（排除敏感字段）
    const userInfo = AuthUtils.sanitizeUser(user);
    
    // 补充工作空间信息
    userInfo.workspace.name = workspace.name;
    userInfo.workspace.status = workspace.status;

    // 生成JWT访问令牌
    const accessToken = await AuthUtils.createToken(user);

    // 返回成功响应
    return NextResponse.json({
      message: '登录成功',
      user: userInfo,
      accessToken
    });
  } catch (error: Error | unknown) {
    console.error('登录处理失败:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { error: '登录处理过程中发生错误' },
      { status: 500 }
    );
  }
} 