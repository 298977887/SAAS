/**
 * 团队数据库初始化API
 * 作者: 阿瑞
 * 功能: 初始化团队专用数据库
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from "next/server";
import { TeamModel } from "@/models/system/TeamModel";
import { TeamDatabase } from "@/lib/db/team/init-team";
import { AuthUtils } from "@/lib/auth";
import mysql from 'mysql2/promise';
import DbConfig from "@/lib/db/config";

/**
 * POST 处理初始化团队数据库请求
 */
export async function POST(
  req: NextRequest,
  context: { params: { teamCode: string } }
) {
  try {
    const params = await context.params;
    const { teamCode } = params;
    console.log(`开始初始化团队数据库, 团队代码: ${teamCode}`);
    
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
    
    // 验证令牌并获取用户信息
    if (!token) {
      console.error('初始化数据库失败: 用户未登录');
      return NextResponse.json(
        { error: "用户未登录" },
        { status: 401 }
      );
    }
    
    // 验证令牌
    let user;
    try {
      user = AuthUtils.verifyToken(token);
      // 验证用户信息的完整性
      if (!user || !user.id) {
        console.error('用户信息不完整:', user);
        return NextResponse.json(
          { error: "用户信息不完整，请重新登录" },
          { status: 401 }
        );
      }
      
      // 确保ID是有效的数字
      const userId = Number(user.id);
      
      if (isNaN(userId)) {
        console.error('无效的用户ID:', { userId });
        return NextResponse.json(
          { error: "用户信息无效，请重新登录" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('令牌验证失败:', error);
      return NextResponse.json(
        { error: "无效的访问令牌" },
        { status: 401 }
      );
    }
    
    // 获取团队信息
    const team = await TeamModel.getByTeamCode(teamCode);
    if (!team) {
      console.error(`团队不存在, 团队代码: ${teamCode}`);
      return NextResponse.json(
        { error: "团队不存在" },
        { status: 404 }
      );
    }
    
    console.log(`获取到团队信息: ${team.name}, ID: ${team.id}`);
    
    // 检查用户权限（必须是团队所有者）
    const userId = Number(user.id);
    if (team.owner_id !== userId) {
      console.error(`权限错误: 用户(${userId})不是团队(${team.id})的所有者(${team.owner_id})`);
      return NextResponse.json(
        { error: "只有团队所有者可以初始化数据库" },
        { status: 403 }
      );
    }
    
    try {
      // 首先使用管理员连接
      console.log(`使用管理员账号连接到数据库: ${DbConfig.host}`);
      const rootConnection = await mysql.createConnection({
        host: DbConfig.host,
        user: DbConfig.adminUser,
        password: DbConfig.adminPassword
      });
      
      // 查询数据库是否存在
      const [existingDbs] = await rootConnection.query(
        `SHOW DATABASES LIKE '${team.db_name}'`
      );
      
      // 如果数据库不存在，创建数据库
      if (Array.isArray(existingDbs) && existingDbs.length === 0) {
        console.log(`创建团队数据库: ${team.db_name}`);
        await rootConnection.query(
          `CREATE DATABASE IF NOT EXISTS \`${team.db_name}\` 
           CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
      } else {
        console.log(`团队数据库 ${team.db_name} 已存在`);
      }
      
      // 创建或更新数据库用户
      console.log(`创建/更新团队数据库用户: ${team.db_username}`);
      
      // 删除可能存在的同名用户（确保用户不存在）
      try {
        await rootConnection.query(`DROP USER IF EXISTS '${team.db_username}'@'%'`);
        await rootConnection.query(`DROP USER IF EXISTS '${team.db_username}'@'localhost'`);
      } catch (e) {
        console.log(`删除已存在用户失败，可能是用户不存在: ${e}`);
      }
      
      // 创建新用户（同时为本地和远程连接创建）
      await rootConnection.query(
        `CREATE USER '${team.db_username}'@'localhost' IDENTIFIED BY '${team.db_password}'`
      );
      await rootConnection.query(
        `CREATE USER '${team.db_username}'@'%' IDENTIFIED BY '${team.db_password}'`
      );
      
      // 授予用户对该数据库的所有权限
      await rootConnection.query(
        `GRANT ALL PRIVILEGES ON \`${team.db_name}\`.* TO '${team.db_username}'@'localhost'`
      );
      await rootConnection.query(
        `GRANT ALL PRIVILEGES ON \`${team.db_name}\`.* TO '${team.db_username}'@'%'`
      );
      
      // 刷新权限表
      await rootConnection.query('FLUSH PRIVILEGES');
      
      console.log(`用户 ${team.db_username} 创建完成并授权成功`);
      
      // 关闭管理员连接
      await rootConnection.end();
      
      // 初始化团队数据库表结构
      console.log(`使用团队专用账号连接并初始化数据库表结构: ${team.db_name}`);
      const teamDatabase = new TeamDatabase({
        db_host: team.db_host,
        db_name: team.db_name,
        db_username: team.db_username,
        db_password: team.db_password,
        team_code: team.team_code
      });
      
      // 执行初始化
      await teamDatabase.initialize();
      console.log(`团队数据库 ${team.db_name} 初始化成功`);
      
    } catch (dbError: any) {
      console.error("数据库操作失败:", dbError);
      return NextResponse.json(
        { error: `数据库操作失败: ${dbError.message}` },
        { status: 500 }
      );
    }
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: `团队 ${team.name} 数据库初始化成功`
    });
    
  } catch (error: any) {
    console.error("初始化团队数据库出错:", error);
    return NextResponse.json(
      { error: error.message || "初始化团队数据库失败" },
      { status: 500 }
    );
  }
} 