/**
 * 工作空间API路由
 * 作者: 阿瑞
 * 功能: 处理工作空间的增删改查请求
 * 版本: a.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceModel } from '@/models/system';
import { ICreateWorkspaceParams } from '@/models/system/types';

/**
 * 获取所有工作空间
 * GET /api/workspaces
 */
export async function GET(request: NextRequest) {
  try {
    // 获取请求中的查询参数
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');
    
    let workspaces;
    
    // 根据创建者ID筛选或获取所有工作空间
    if (creatorId) {
      workspaces = await WorkspaceModel.getByCreator(parseInt(creatorId));
    } else {
      workspaces = await WorkspaceModel.getAll();
    }
    
    return NextResponse.json(workspaces);
  } catch (error: any) {
    console.error('获取工作空间列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取工作空间列表失败' },
      { status: 500 }
    );
  }
}

/**
 * 创建新工作空间
 * POST /api/workspaces
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const workspaceData: ICreateWorkspaceParams = {
      name: body.name,
      creator_id: body.creator_id
    };
    
    // 验证必填字段
    if (!workspaceData.name) {
      return NextResponse.json(
        { error: '工作空间名称是必填的' },
        { status: 400 }
      );
    }
    
    // 创建工作空间
    const workspaceId = await WorkspaceModel.create(workspaceData);
    
    // 获取新创建的工作空间
    const workspace = await WorkspaceModel.getById(workspaceId);
    
    return NextResponse.json(workspace, { status: 201 });
  } catch (error: any) {
    console.error('创建工作空间失败:', error);
    return NextResponse.json(
      { error: error.message || '创建工作空间失败' },
      { status: 500 }
    );
  }
} 