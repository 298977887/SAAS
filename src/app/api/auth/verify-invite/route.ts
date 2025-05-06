/**
 * 邀请令牌验证API路由
 * 作者: 阿瑞
 * 功能: 验证邀请令牌的有效性并返回相关信息
 * 版本: 1.1
 */

import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * 验证邀请令牌
 */
export async function GET(request: NextRequest) {
  try {
    // 获取令牌参数
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // 验证参数
    if (!token) {
      return NextResponse.json(
        { error: '缺少令牌参数' },
        { status: 400 }
      );
    }
    
    console.log('验证邀请令牌:', token);
    
    // 查询令牌
    const invitations = await db.query(
      `SELECT i.*, w.name as workspace_name, u.username as inviter_name 
       FROM workspace_invitations i
       JOIN workspaces w ON i.workspace_id = w.id
       JOIN system_users u ON i.created_by = u.id
       WHERE i.token = ? AND i.used_by IS NULL AND i.expires_at > NOW()`,
      [token]
    );
    
    // 打印查询结果，用于调试
    console.log('邀请记录查询结果:', JSON.stringify(invitations && invitations.length > 0 ? invitations[0] : {}, null, 2));
    
    // 如果未找到有效令牌
    if (!invitations || invitations.length === 0) {
      console.log('未找到有效的邀请令牌');
      return NextResponse.json(
        { error: '无效的邀请令牌或已过期' },
        { status: 404 }
      );
    }
    
    const invitation = invitations[0];
    console.log('找到有效的邀请令牌:', invitation.id);
    
    // 确保字段名称统一
    const responseData = {
      valid: true,
      workspaceId: invitation.workspace_id,
      workspaceName: invitation.workspace_name,
      inviterId: invitation.created_by,
      inviterName: invitation.inviter_name,
      role: invitation.role,
      expiresAt: invitation.expires_at,
      // 增加额外的字段格式，保证前端能够正确读取
      workspace_id: invitation.workspace_id,
      workspace_name: invitation.workspace_name,
      created_by: invitation.created_by,
      inviter_name: invitation.inviter_name
    };
    
    console.log('响应数据:', responseData);
    
    // 返回邀请相关信息
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('验证邀请令牌失败:', error);
    
    return NextResponse.json(
      { error: '验证邀请令牌失败: ' + error.message },
      { status: 500 }
    );
  }
} 