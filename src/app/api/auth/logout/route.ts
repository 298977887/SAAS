/**
 * 注销API路由
 * 作者: 阿瑞
 * 功能: 处理用户退出登录请求
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthUtils } from '@/lib/auth';

/**
 * 处理注销请求
 * 注意：由于JWT是无状态的，服务端无法直接使令牌失效
 * 实际注销操作主要依赖前端清除本地存储的令牌
 * 该API主要用于记录用户注销行为和未来扩展
 */
export async function POST(req: NextRequest) {
  try {
    // 从请求头获取授权令牌
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供授权令牌' },
        { status: 401 }
      );
    }

    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    try {
      // 验证令牌有效性（仅用于确认身份）
      AuthUtils.verifyToken(token);
      
      // 在此处可以添加注销相关逻辑
      // 例如：记录用户注销行为、添加令牌到黑名单等
      
      // 返回成功响应
      return NextResponse.json({
        message: '注销成功'
      });
    } catch (error) {
      // 令牌无效也视为成功注销
      return NextResponse.json({
        message: '注销成功'
      });
    }
  } catch (error: Error | unknown) {
    console.error('注销处理失败:', error);
    
    // 返回错误响应
    return NextResponse.json(
      { error: '注销处理过程中发生错误' },
      { status: 500 }
    );
  }
} 