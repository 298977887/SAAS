/**
 * 添加工作空间成员API路由
 * 作者: 阿瑞
 * 功能: 将现有用户添加到当前工作空间或创建新用户
 * 版本: 1.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import db from '@/lib/db';
import { SystemRoleType } from '@/models/system/types';
import bcrypt from 'bcryptjs'; // 导入bcrypt库用于密码加密

/**
 * 添加成员到工作空间
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    const { username, email, password, phone, createNewUser, role_type, role_name, is_custom_role, workspaceId } = body;
    
    // 验证参数
    if ((!username && !email) || !workspaceId) {
      return NextResponse.json({ 
        error: '缺少必要参数，需要用户名或邮箱以及工作空间ID' 
      }, { status: 400 });
    }

    // 如果是创建新用户，则密码必填
    if (createNewUser && !password) {
      return NextResponse.json({ 
        error: '创建新用户时密码不能为空' 
      }, { status: 400 });
    }

    // 如果是创建新用户，则电话号码必填
    if (createNewUser && !phone) {
      return NextResponse.json({ 
        error: '创建新用户时电话号码不能为空' 
      }, { status: 400 });
    }
    
    // 验证授权
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 解析令牌
    const token = authHeader.split(' ')[1];
    const decoded = await AuthUtils.verifyToken(token);
    
    // 验证令牌是否有效
    if (!decoded) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }
    
    // 查询当前用户
    const currentUserRows = await db.query(
      'SELECT * FROM system_users WHERE id = ?',
      [decoded.id]
    );
    
    if (currentUserRows.length === 0) {
      return NextResponse.json({ error: '当前用户不存在' }, { status: 404 });
    }
    
    const currentUser = currentUserRows[0];
    
    // 验证是否是管理员
    if (currentUser.role_type !== SystemRoleType.ADMIN) {
      return NextResponse.json({ error: '只有管理员可以添加成员' }, { status: 403 });
    }
    
    // 验证当前用户是否属于该工作空间
    if (currentUser.workspace_id.toString() !== workspaceId.toString()) {
      return NextResponse.json({ error: '无权访问该工作空间' }, { status: 403 });
    }
    
    // 查询目标用户
    let targetUser;
    if (!createNewUser) {
      // 查找现有用户
      if (username) {
        const userRows = await db.query(
          'SELECT * FROM system_users WHERE username = ?',
          [username]
        );
        if (userRows.length > 0) {
          targetUser = userRows[0];
        }
      }
      
      if (!targetUser && email) {
        const userRows = await db.query(
          'SELECT * FROM system_users WHERE email = ?',
          [email]
        );
        if (userRows.length > 0) {
          targetUser = userRows[0];
        }
      }
      
      if (!targetUser) {
        return NextResponse.json({ error: '未找到目标用户' }, { status: 404 });
      }
      
      // 检查用户是否已经在当前工作空间
      if (targetUser.workspace_id.toString() === workspaceId.toString()) {
        return NextResponse.json({ error: '该用户已经在当前工作空间中' }, { status: 400 });
      }
      
      // 确定角色信息
      const finalRoleType = role_type || SystemRoleType.USER;
      const finalRoleName = role_name || (finalRoleType === SystemRoleType.ADMIN ? '管理员' : '普通用户');
      const finalIsCustomRole = is_custom_role || false;

      // 更新用户的工作空间ID和角色
      await db.query(
        'UPDATE system_users SET workspace_id = ?, role_type = ?, role_name = ?, is_custom_role = ?, invited_by = ?, updated_at = NOW() WHERE id = ?',
        [workspaceId, finalRoleType, finalRoleName, finalIsCustomRole, currentUser.id, targetUser.id]
      );
    } else {
      // 创建新用户
      
      // 检查用户名是否已存在
      if (username) {
        const existingUserRows = await db.query(
          'SELECT id FROM system_users WHERE username = ?',
          [username]
        );
        if (existingUserRows.length > 0) {
          return NextResponse.json({ error: '用户名已被占用' }, { status: 400 });
        }
      }
      
      // 检查邮箱是否已存在
      if (email) {
        const existingUserRows = await db.query(
          'SELECT id FROM system_users WHERE email = ?',
          [email]
        );
        if (existingUserRows.length > 0) {
          return NextResponse.json({ error: '邮箱已被注册' }, { status: 400 });
        }
      }
      
      // 检查电话号码是否已存在
      if (phone) {
        const existingUserRows = await db.query(
          'SELECT id FROM system_users WHERE phone = ?',
          [phone]
        );
        if (existingUserRows.length > 0) {
          return NextResponse.json({ error: '电话号码已被注册' }, { status: 400 });
        }
      }
      
      // 加密密码
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // 确定角色信息
      const finalRoleType = role_type || SystemRoleType.USER;
      const finalRoleName = role_name || (finalRoleType === SystemRoleType.ADMIN ? '管理员' : '普通用户');
      const finalIsCustomRole = is_custom_role || false;
      
      // 插入新用户
      const insertId = await db.insert('system_users', {
        username,
        email,
        password: hashedPassword,
        phone, // 使用请求中传入的电话号码
        role_type: finalRoleType,
        role_name: finalRoleName,
        is_custom_role: finalIsCustomRole,
        status: 1, // 修改为整数1，表示启用状态
        workspace_id: workspaceId,
        invited_by: currentUser.id,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // 获取新用户
      const newUserRows = await db.query(
        'SELECT * FROM system_users WHERE id = ?',
        [insertId]
      );
      
      targetUser = newUserRows[0];
    }
    
    // 返回成功响应
    return NextResponse.json({
      message: createNewUser ? '新用户创建并添加成功' : '成员添加成功',
      user: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email
      }
    });
    
  } catch (error: any) {
    console.error('添加成员失败:', error);
    
    // 令牌验证失败
    if (error.message === '无效的访问令牌') {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }
    
    // 其他错误
    return NextResponse.json(
      { error: '添加成员失败: ' + error.message },
      { status: 500 }
    );
  }
} 