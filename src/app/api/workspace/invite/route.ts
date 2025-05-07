/**
 * 邀请注册API路由
 * 作者: 阿瑞
 * 功能: 生成邀请链接和令牌
 * 版本: 2.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { SystemRoleType } from '@/models/system/types';

/**
 * 生成邀请链接和令牌
 */
export async function POST(req: NextRequest) {
  try {
    console.log('API: 接收到生成邀请链接请求');
    
    // 解析请求体
    const body = await req.json();
    const { role_type, role_name, is_custom_role, workspaceId } = body;
    
    console.log('API: 请求参数:', { role_type, role_name, is_custom_role, workspaceId });
    
    // 验证参数
    if (!workspaceId) {
      console.log('API: 缺少工作空间ID参数');
      return NextResponse.json({ 
        error: '缺少必要参数，需要工作空间ID' 
      }, { status: 400 });
    }
    
    // 验证授权
    const authHeader = req.headers.get('Authorization');
    console.log('API: 授权头:', authHeader ? '存在' : '不存在');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    // 解析令牌
    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = AuthUtils.verifyToken(token);
      console.log('API: 令牌解析成功, 用户ID:', decoded.id);
    } catch (error) {
      console.log('API: 令牌验证失败');
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 });
    }
    
    // 查询当前用户
    const currentUserRows = await db.query(
      'SELECT id, username, email, role_type, role_name, workspace_id FROM system_users WHERE id = ?',
      [decoded.id]
    );
    
    if (currentUserRows.length === 0) {
      console.log('API: 当前用户不存在');
      return NextResponse.json({ error: '当前用户不存在' }, { status: 404 });
    }
    
    const currentUser = currentUserRows[0];
    console.log('API: 当前用户:', { id: currentUser.id, role_type: currentUser.role_type });
    
    // 验证是否是管理员
    if (currentUser.role_type !== SystemRoleType.ADMIN) {
      console.log('API: 用户不是管理员');
      return NextResponse.json({ error: '只有管理员可以生成邀请链接' }, { status: 403 });
    }
    
    // 验证当前用户是否属于该工作空间
    if (currentUser.workspace_id.toString() !== workspaceId.toString()) {
      console.log('API: 用户不属于该工作空间');
      return NextResponse.json({ error: '无权访问该工作空间' }, { status: 403 });
    }
    
    // 查询工作空间
    const workspaceRows = await db.query(
      'SELECT id, name FROM workspaces WHERE id = ?',
      [workspaceId]
    );
    
    if (workspaceRows.length === 0) {
      console.log('API: 工作空间不存在');
      return NextResponse.json({ error: '工作空间不存在' }, { status: 404 });
    }
    
    const workspace = workspaceRows[0];
    console.log('API: 工作空间:', { id: workspace.id, name: workspace.name });
    
    // 生成唯一邀请令牌
    const invitationToken = uuidv4();
    console.log('API: 生成邀请令牌:', invitationToken.substring(0, 8) + '...');
    
    // 确定角色信息
    const finalRoleType = role_type || SystemRoleType.USER;
    const finalRoleName = role_name || (finalRoleType === SystemRoleType.ADMIN ? '管理员' : '普通用户');
    const finalIsCustomRole = is_custom_role || false;
    
    // 检查表是否需要更新结构
    try {
      await db.query('SELECT role_type FROM workspace_invitations LIMIT 1');
    } catch (err) {
      // 如果字段不存在，添加新的字段
      if ((err as any).code === 'ER_BAD_FIELD_ERROR') {
        console.log('API: 更新邀请表结构以支持新的角色系统');
        await db.query(`
          ALTER TABLE workspace_invitations
          ADD COLUMN role_type VARCHAR(30) NOT NULL DEFAULT 'user' AFTER role,
          ADD COLUMN role_name VARCHAR(50) NOT NULL DEFAULT '普通用户' AFTER role_type,
          ADD COLUMN is_custom_role TINYINT(1) NOT NULL DEFAULT 0 AFTER role_name
        `);
      }
    }
    
    // 将邀请数据存入数据库
    await db.query(
      `INSERT INTO workspace_invitations 
       (token, workspace_id, role, role_type, role_name, is_custom_role, created_by, expires_at, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
      [
        invitationToken,
        workspaceId,
        finalRoleType, // 保持兼容
        finalRoleType,
        finalRoleName,
        finalIsCustomRole,
        currentUser.id
      ]
    ).catch(err => {
      // 如果表不存在，创建表并重试
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log('API: 邀请表不存在，创建表');
        return db.query(`
          CREATE TABLE IF NOT EXISTS workspace_invitations (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(100) NOT NULL UNIQUE,
            workspace_id INT NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'user',
            role_type VARCHAR(30) NOT NULL DEFAULT 'user',
            role_name VARCHAR(50) NOT NULL DEFAULT '普通用户',
            is_custom_role TINYINT(1) NOT NULL DEFAULT 0,
            created_by INT NOT NULL,
            used_by INT NULL DEFAULT NULL,
            used_at DATETIME NULL DEFAULT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_token (token),
            INDEX idx_workspace (workspace_id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
            FOREIGN KEY (created_by) REFERENCES system_users(id)
          )
        `).then(() => {
          return db.query(
            `INSERT INTO workspace_invitations 
             (token, workspace_id, role, role_type, role_name, is_custom_role, created_by, expires_at, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
            [
              invitationToken,
              workspaceId,
              finalRoleType, // 保持兼容
              finalRoleType,
              finalRoleName,
              finalIsCustomRole,
              currentUser.id
            ]
          );
        });
      }
      throw err;
    });
    
    console.log('API: 邀请记录已保存');
    
    // 返回成功响应
    return NextResponse.json({
      message: '邀请链接已生成',
      token: invitationToken,
      expiresIn: '7天'
    });
    
  } catch (error: any) {
    console.error('API: 生成邀请链接失败:', error);
    
    // 其他错误
    return NextResponse.json(
      { error: '生成邀请链接失败: ' + error.message },
      { status: 500 }
    );
  }
} 