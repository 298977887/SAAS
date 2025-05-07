/**
 * 团队API路由
 * 作者: 阿瑞
 * 功能: 处理团队相关API请求
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamModel } from "@/models/system/TeamModel";
import { UserTeamRelationModel } from "@/models/system/UserTeamRelationModel";
import { ICreateTeamParams } from "@/models/system/types";
import DbConfig from "@/lib/db/config";
import { AuthUtils } from "@/lib/auth";

/**
 * 生成安全的随机密码
 * 包含小写字母、大写字母、数字和特殊字符
 * @param length 密码长度
 * @returns 生成的随机密码
 */
function generateSecurePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()-_=+';
  
  const allChars = lowercase + uppercase + numbers + special;
  
  // 确保密码至少包含每种字符各一个
  let password = '';
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += special.charAt(Math.floor(Math.random() * special.length));
  
  // 添加剩余的随机字符
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * POST 处理创建团队请求
 */
export async function POST(req: NextRequest) {
  try {
    // 解析请求体，提取备份的用户ID和工作空间ID
    const requestData = await req.json();
    const { teamName, teamCode, userId: backupUserId, workspaceId: backupWorkspaceId } = requestData;
    
    // 验证必要参数
    if (!teamName || !teamCode) {
      return NextResponse.json(
        { error: "团队名称和团队代码为必填项" },
        { status: 400 }
      );
    }
    
    // 从请求头获取访问令牌
    const authHeader = req.headers.get('Authorization');
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 尝试从Cookie中获取
      const tokenCookie = req.cookies.get('accessToken');
      if (tokenCookie) {
        token = tokenCookie.value;
      } else {
        // 尝试读取localStorage中的令牌（从请求中）
        const saasStorage = req.cookies.get('saas-user-storage');
        if (saasStorage) {
          try {
            const storageData = JSON.parse(decodeURIComponent(saasStorage.value));
            if (storageData && storageData.state && storageData.state.accessToken) {
              token = storageData.state.accessToken;
            }
          } catch (e) {
            console.error('解析存储的用户数据失败:', e);
          }
        }
      }
    }
    
    // 准备存储用户ID和工作空间ID
    let userId: number | null = null;
    let workspaceId: number | null = null;
    
    // 验证令牌并获取用户信息
    if (!token && !backupUserId && !backupWorkspaceId) {
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      );
    }
    
    // 尝试通过令牌获取用户信息
    if (token) {
      try {
        const user = AuthUtils.verifyToken(token);
        // 验证用户信息的完整性
        if (user && user.id && user.workspaceId) {
          userId = Number(user.id);
          workspaceId = Number(user.workspaceId);
          
          // 验证数字有效性
          if (isNaN(userId) || isNaN(workspaceId)) {
            console.error('令牌中用户ID或工作空间ID无效:', { userId, workspaceId });
            userId = null;
            workspaceId = null;
          }
        } else {
          console.error('令牌中用户信息不完整:', user);
        }
      } catch (error) {
        console.error('令牌验证失败:', error);
      }
    }
    
    // 如果令牌验证失败，尝试使用备份的用户信息
    if ((!userId || !workspaceId) && backupUserId && backupWorkspaceId) {
      console.log('使用备份的用户信息:', { backupUserId, backupWorkspaceId });
      userId = Number(backupUserId);
      workspaceId = Number(backupWorkspaceId);
      
      // 验证备份数据有效性
      if (isNaN(userId) || isNaN(workspaceId)) {
        console.error('备份用户ID或工作空间ID无效:', { userId, workspaceId });
        return NextResponse.json(
          { error: "用户信息无效，请重新登录" },
          { status: 401 }
        );
      }
    }
    
    // 最终验证用户信息
    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: "无法验证用户身份，请重新登录" },
        { status: 401 }
      );
    }
    
    // 验证团队代码格式
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(teamCode)) {
      return NextResponse.json(
        { error: "团队代码只能包含字母、数字和下划线，长度在3-20之间" },
        { status: 400 }
      );
    }
    
    // 检查团队代码是否已存在
    const existingTeam = await TeamModel.getByTeamCode(teamCode);
    if (existingTeam) {
      return NextResponse.json(
        { error: "该团队代码已存在，请使用其他代码" },
        { status: 409 }
      );
    }
    
    // 为团队生成数据库名称和用户名
    const teamDbName = `team_${teamCode}`;
    const teamUsername = `user_${teamCode}`;
    
    // 生成安全的随机密码
    const teamDbPassword = generateSecurePassword(12);
    
    console.log('准备创建团队，用户ID:', userId, '工作空间ID:', workspaceId);
    console.log('团队数据库信息:', {
      db_name: teamDbName,
      db_username: teamUsername,
      // 不输出密码
    });
    
    // 准备团队创建参数
    const teamParams: ICreateTeamParams = {
      team_code: teamCode,
      name: teamName,
      db_host: DbConfig.host,
      db_name: teamDbName,
      db_username: teamUsername,
      db_password: teamDbPassword,
      workspace_id: workspaceId,
      owner_id: userId
    };
    
    console.log('创建团队参数:', {
      ...teamParams,
      db_password: '******' // 不输出密码
    });
    
    // 创建团队
    const teamId = await TeamModel.create(teamParams);
    console.log('团队创建成功，ID:', teamId);
    
    // 建立用户与团队的关系
    await UserTeamRelationModel.create({
      user_id: userId,
      team_id: teamId,
      role: 'owner' as any // 临时类型转换，后续应更新类型定义
    });
    console.log('用户团队关系创建成功');
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      team: {
        id: teamId,
        team_code: teamCode,
        name: teamName
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("创建团队出错:", error);
    return NextResponse.json(
      { error: error.message || "创建团队失败" },
      { status: 500 }
    );
  }
} 