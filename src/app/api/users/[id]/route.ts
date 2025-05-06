/**
 * 用户ID相关API路由
 * 作者: 阿瑞
 * 功能: 处理特定用户的获取、更新和禁用请求
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SystemUserModel } from '@/models/system';
import { IUpdateUserParams } from '@/models/system/types';

/**
 * 获取指定ID的用户
 * GET /api/users/[id]
 */
export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }
    
    // 获取用户
    const user = await SystemUserModel.getById(id);
    
    // 检查用户是否存在
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 移除敏感信息
    const { password, ...safeUser } = user;
    
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error(`获取用户(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '获取用户失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新指定ID的用户
 * PUT /api/users/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }
    
    // 获取用户，确认存在
    const existingUser = await SystemUserModel.getById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const updateData: IUpdateUserParams = {};
    
    // 只更新提供的字段
    if (body.username !== undefined) updateData.username = body.username;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.last_login_at !== undefined) updateData.last_login_at = new Date(body.last_login_at);
    
    // 如果提供了新密码，进行加密
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }
    
    // 至少需要一个更新字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '未提供任何更新字段' },
        { status: 400 }
      );
    }
    
    // 如果要更新用户名，检查是否已存在
    if (updateData.username && updateData.username !== existingUser.username) {
      const userWithSameUsername = await SystemUserModel.getByUsername(updateData.username);
      if (userWithSameUsername) {
        return NextResponse.json(
          { error: '用户名已存在' },
          { status: 409 }
        );
      }
    }
    
    // 如果要更新邮箱，检查是否已存在
    if (updateData.email && updateData.email !== existingUser.email) {
      const userWithSameEmail = await SystemUserModel.getByEmail(updateData.email);
      if (userWithSameEmail) {
        return NextResponse.json(
          { error: '邮箱已被注册' },
          { status: 409 }
        );
      }
    }
    
    // 执行更新
    const success = await SystemUserModel.update(id, updateData);
    
    if (!success) {
      return NextResponse.json(
        { error: '更新用户失败' },
        { status: 500 }
      );
    }
    
    // 获取更新后的用户(不含密码)
    const updatedUser = await SystemUserModel.getById(id);
    const { password, ...safeUser } = updatedUser!;
    
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error(`更新用户(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '更新用户失败' },
      { status: 500 }
    );
  }
}

/**
 * 禁用指定ID的用户
 * DELETE /api/users/[id]
 */
export async function DELETE(
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的用户ID' },
        { status: 400 }
      );
    }
    
    // 检查用户是否存在
    const user = await SystemUserModel.getById(id);
    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 执行禁用
    const success = await SystemUserModel.disable(id);
    
    if (!success) {
      return NextResponse.json(
        { error: '禁用用户失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: '用户已禁用' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`禁用用户(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '禁用用户失败' },
      { status: 500 }
    );
  }
} 