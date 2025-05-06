/**
 * 邀请注册API路由
 * 作者: 阿瑞
 * 功能: 生成邀请链接和令牌
 * 版本: 2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * 生成邀请链接和令牌
 */
export async function POST(req: NextRequest) {
  try {
    console.log('API: 接收到生成邀请链接请求');
    
    // 解析请求体
    const body = await req.json();
    const { role, workspaceId } = body;
    
    console.log('API: 请求参数:', { role, workspaceId });
    
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
      'SELECT id, username, email, role, workspace_id FROM system_users WHERE id = ?',
      [decoded.id]
    );
    
    if (currentUserRows.length === 0) {
      console.log('API: 当前用户不存在');
      return NextResponse.json({ error: '当前用户不存在' }, { status: 404 });
    }
    
    const currentUser = currentUserRows[0];
    console.log('API: 当前用户:', { id: currentUser.id, role: currentUser.role });
    
    // 验证是否是管理员
    if (currentUser.role !== 'admin') {
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
    
    // 将邀请数据存入数据库
    await db.query(
      `INSERT INTO workspace_invitations 
       (token, workspace_id, role, created_by, expires_at, created_at) 
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
      [
        invitationToken,
        workspaceId,
        role || 'user',
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
            role VARCHAR(20) NOT NULL DEFAULT 'user',
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
             (token, workspace_id, role, created_by, expires_at, created_at) 
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), NOW())`,
            [
              invitationToken,
              workspaceId,
              role || 'user',
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