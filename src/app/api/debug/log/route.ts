/**
 * 调试日志API路由
 * 作者: 阿瑞
 * 功能: 用于记录客户端请求日志并返回服务器状态
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConnectionManager } from '@/lib/db/connection-manager';
import DbConfig from '@/lib/db/config';

/**
 * 记录调试日志并返回服务器状态
 * POST /api/debug/log
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 记录日志到控制台
    console.log('客户端日志:', body);
    
    // 测试数据库连接
    const isConnected = await ConnectionManager.testConnection(DbConfig.database);
    
    // 返回服务器状态
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      databaseConnected: isConnected,
      environment: process.env.NODE_ENV || 'development',
      received: body
    });
  } catch (error: any) {
    console.error('调试日志API错误:', error);
    return NextResponse.json(
      { 
        error: error.message || '调试日志API错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 