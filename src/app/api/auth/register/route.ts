/**
 * 用户注册API路由
 * 作者: 阿瑞
 * 功能: 处理用户注册请求，支持普通注册和邀请注册
 * 版本: 2.7
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SystemUserModel } from '@/models/system';
import { WorkspaceStatus, UserStatus } from '@/models/system/types';
import db from '@/lib/db';

/**
 * 注册请求处理函数
 * 处理POST请求，创建工作空间和用户，或将用户添加到现有工作空间
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { username, email, phone, password, workspaceName, inviteToken } = body;

    // 验证必填字段
    if (!username || !email || !phone || !password) {
      return NextResponse.json(
        { error: '用户名、邮箱、手机号和密码为必填字段' },
        { status: 400 }
      );
    }

    // 如果没有提供邀请令牌，则需要工作空间名称
    if (!inviteToken && !workspaceName) {
      return NextResponse.json(
        { error: '工作空间名称为必填字段' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    const existingUserByUsername = await SystemUserModel.getByUsername(username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 409 }
      );
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await SystemUserModel.getByEmail(email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: '邮箱已被注册' },
        { status: 409 }
      );
    }
    
    // 检查手机号是否已存在
    const existingUsersByPhone = await db.query(
      'SELECT id FROM system_users WHERE phone = ?',
      [phone]
    );
    if (existingUsersByPhone && existingUsersByPhone.length > 0) {
      return NextResponse.json(
        { error: '手机号已被注册' },
        { status: 409 }
      );
    }
    
    // 对密码进行加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('数据库连接成功');

    // 开始注册流程，使用事务确保数据一致性
    return await db.transaction(async (connection) => {
      // 初始化变量
      let workspaceId: number | null = null;
      let roleType = "user"; // 默认角色类型
      let roleName = "普通用户"; // 默认角色名称
      let isCustomRole = false; // 默认不是自定义角色
      let invitationId: number | null = null;
      let returnWorkspaceName = workspaceName || '';
      const isInviteFlow = Boolean(inviteToken && inviteToken.trim() !== '');
      
      if (isInviteFlow) {
        console.log('处理邀请注册，令牌:', inviteToken);
        
        try {
          // 查询邀请信息 - MySQL查询返回[rows, fields]的结构
          const [rows] = await connection.query(
            `SELECT 
              i.id, 
              i.token, 
              i.workspace_id, 
              i.role,
              i.role_type,
              i.role_name,
              i.is_custom_role, 
              w.name as workspace_name
            FROM workspace_invitations i
            JOIN workspaces w ON i.workspace_id = w.id
            WHERE i.token = ? AND i.used_by IS NULL AND i.expires_at > NOW()`,
            [inviteToken]
          );
          
          // 检查是否有结果
          if (!rows || !(rows as any[]).length) {
            throw new Error('无效的邀请令牌或已过期');
          }
          
          // 获取原始邀请记录
          const rawInvitation = (rows as any[])[0];
          
          // 打印调试信息
          console.log('调试 - 原始记录:', rawInvitation);
          console.log('调试 - 可用字段:', Object.keys(rawInvitation));
          
          // 使用更可靠的字段提取方式
          invitationId = Number(rawInvitation.id || rawInvitation.ID || 0);
          workspaceId = Number(rawInvitation.workspace_id || rawInvitation.workspaceId || rawInvitation.WORKSPACE_ID || 0);
          
          // 获取角色信息
          if (rawInvitation.role_type !== undefined) {
            // 使用新角色系统
            roleType = String(rawInvitation.role_type || 'user');
            roleName = String(rawInvitation.role_name || '普通用户');
            isCustomRole = Boolean(rawInvitation.is_custom_role || false);
          } else {
            // 兼容旧角色系统
            roleType = String(rawInvitation.role || 'user');
            roleName = roleType === 'admin' ? '管理员' : '普通用户';
            isCustomRole = false;
          }
          
          returnWorkspaceName = String(rawInvitation.workspace_name || rawInvitation.workspaceName || '未命名工作空间');
          
          console.log('从记录中提取的字段:', {
            invitationId,
            workspaceId, 
            roleType,
            roleName,
            isCustomRole,
            returnWorkspaceName
          });
          
          // 验证工作空间ID
          if (!workspaceId || isNaN(workspaceId)) {
            console.error('工作空间ID提取失败，可用字段:', Object.keys(rawInvitation));
            throw new Error('邀请中的工作空间ID无效，请联系管理员');
          }
        } catch (error: any) {
          console.error('处理邀请记录时出错:', error);
          throw new Error(`邀请处理失败: ${error.message}`);
        }
      } else {
        // 普通注册流程，创建新工作空间
        console.log('普通注册流程，创建新工作空间:', workspaceName);
        
        // 创建工作空间（临时创建者ID为0）
        const result = await connection.execute(
          `INSERT INTO workspaces (name, creator_id, status, created_at) VALUES (?, ?, ?, ?)`,
          [workspaceName, 0, WorkspaceStatus.ACTIVE, new Date()]
        );
        
        // 从插入结果中获取ID
        const resultObj = (result as any)[0];
        workspaceId = resultObj.insertId;
        
        // 管理员角色
        roleType = "admin";
        roleName = "管理员";
        isCustomRole = false;

        if (!workspaceId) {
          throw new Error('创建工作空间失败');
        }
      }
      
      // 最终检查工作空间ID
      if (workspaceId === null || isNaN(workspaceId) || workspaceId === 0) {
        throw new Error('无法确定工作空间ID');
      }

      console.log('准备创建用户并关联到工作空间:', workspaceId);

      // 创建用户并关联到工作空间
      const userResult = await connection.execute(
        `INSERT INTO system_users 
         (username, password, email, phone, workspace_id, role_type, role_name, is_custom_role, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username, 
          hashedPassword, 
          email, 
          phone, 
          workspaceId, 
          roleType,
          roleName,
          isCustomRole, 
          UserStatus.ENABLED,
          new Date()
        ]
      );
      
      const userResultObj = (userResult as any)[0];
      const userId = userResultObj.insertId;

      if (!userId) {
        throw new Error('创建用户失败');
      }
      
      // 如果是普通注册（创建了新工作空间），更新工作空间的创建者ID
      if (!isInviteFlow) {
        await connection.execute(
          `UPDATE workspaces SET creator_id = ?, updated_at = ? WHERE id = ?`,
          [userId, new Date(), workspaceId]
        );
      }
      
      // 如果是邀请注册，更新邀请记录
      if (isInviteFlow && invitationId !== null) {
        await connection.execute(
          `UPDATE workspace_invitations SET used_by = ?, used_at = NOW() WHERE id = ?`,
          [userId, invitationId]
        );
      }

      // 返回注册成功响应
      return NextResponse.json(
        { 
          success: true, 
          message: '注册成功',
          user: { id: userId, username, email },
          workspace: { id: workspaceId, name: returnWorkspaceName }
        }, 
        { status: 201 }
      );
    });
  } catch (error: any) {
    console.error('注册失败:', error);
    
    // 根据错误类型返回适当的错误信息
    const statusCode = error.code === 'ER_DUP_ENTRY' ? 409 : 500;
    const errorMessage = error.code === 'ER_DUP_ENTRY' 
      ? '用户名、邮箱或手机号已存在' 
      : error.message || '注册失败，请稍后再试';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
