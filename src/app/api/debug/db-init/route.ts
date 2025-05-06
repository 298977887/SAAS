/**
 * 数据库初始化API
 * 作者: 阿瑞
 * 功能: 提供数据库初始化功能的HTTP接口
 * 版本: 1.0
 */

import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * POST方法 - 执行数据库初始化
 */
export async function POST() {
  try {
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
    });
  } catch (error: any) {
    console.error('数据库初始化API错误:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '数据库初始化失败',
        error: error.message,
      },
      { status: 500 }
    );
  }
} 