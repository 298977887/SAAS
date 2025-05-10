/**
 * 工作空间团队列表API路由
 * 作者: 阿瑞
 * 功能: 获取当前工作空间下的所有团队
 * 版本: 1.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';
import db from '@/lib/db';
import { SystemRoleType } from '@/models/system/types';

/**
 * 获取工作空间的团队列表
 */
export async function GET(req: NextRequest) {
  try {
    //console.log('API: 接收到获取团队列表请求');
    
    // 获取查询参数
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get('workspaceId');
    
    //console.log('API: 获取工作空间ID:', workspaceId);
    
    // 验证参数
    if (!workspaceId) {
      console.log('API: 缺少工作空间ID参数');
      return NextResponse.json({ error: '缺少工作空间ID参数' }, { status: 400 });
    }
    
    // 从请求中获取授权信息
    const authHeader = req.headers.get('Authorization');
    console.log('API: 授权头信息:', authHeader ? '存在' : '不存在');
    
    let userId = null;
    let userRoleType = SystemRoleType.USER; // 默认为普通用户
    
    // 尝试验证授权
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = await AuthUtils.verifyToken(token);
        
        if (decoded && decoded.id) {
          userId = decoded.id;
          
          // 查询当前用户
          const userRows = await db.query(
            'SELECT id, role_type, workspace_id FROM system_users WHERE id = ?',
            [decoded.id]
          );
          
          if (userRows.length > 0) {
            const user = userRows[0];
            userRoleType = user.role_type;
            
            // 验证用户是否属于该工作空间
            if (user.workspace_id.toString() !== workspaceId) {
              console.log('API: 用户不属于该工作空间');
            } else {
              console.log('API: 用户验证成功, ID:', userId, '角色:', userRoleType);
            }
          }
        }
      } catch (error) {
        console.log('API: 令牌验证失败, 跳过用户验证');
        // 令牌验证失败时，只是记录错误，但仍然允许请求继续
      }
    }
    
    // 查询团队
    let teamRows;
    
    // 如果是管理员用户，获取整个工作空间的团队
    if (userRoleType === SystemRoleType.ADMIN && userId) {
      console.log('API: 以管理员身份查询所有团队');
      teamRows = await db.query(
        `SELECT t.id, t.team_code as teamCode, t.name, t.status
         FROM teams t 
         WHERE t.workspace_id = ?
         ORDER BY t.name ASC`,
        [workspaceId]
      );
    } else if (userId) {
      // 如果是普通用户，只获取用户关联的团队
      console.log('API: 以普通用户身份查询关联团队');
      teamRows = await db.query(
        `SELECT t.id, t.team_code as teamCode, t.name, t.status
         FROM teams t
         JOIN user_team_relations utr ON t.id = utr.team_id
         WHERE t.workspace_id = ? AND utr.user_id = ?
         ORDER BY t.name ASC`,
        [workspaceId, userId]
      );
    } else {
      // 无用户身份时，获取所有团队
      console.log('API: 无用户身份查询全部团队');
      teamRows = await db.query(
        `SELECT t.id, t.team_code as teamCode, t.name, t.status
         FROM teams t 
         WHERE t.workspace_id = ?
         ORDER BY t.name ASC`,
        [workspaceId]
      );
    }
    
    console.log('API: 查询到团队数量:', teamRows.length);
    
    // 返回团队列表
    return NextResponse.json({
      teams: teamRows
    });
    
  } catch (error: unknown) {
    const err = error as Error;
    console.error('API: 获取团队列表失败:', err);
    
    // 其他错误
    return NextResponse.json(
      { error: '获取团队列表失败: ' + err.message },
      { status: 500 }
    );
  }
} 