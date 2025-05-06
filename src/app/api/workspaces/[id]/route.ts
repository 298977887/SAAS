/**
 * 工作空间ID相关API路由
 * 作者: 阿瑞
 * 功能: 处理特定工作空间的获取、更新和删除请求
 * 版本: 1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceModel } from '@/models/system';
import { IUpdateWorkspaceParams } from '@/models/system/types';

/**
 * 获取指定ID的工作空间
 * GET /api/workspaces/[id]
 */
export async function GET(
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的工作空间ID' },
        { status: 400 }
      );
    }
    
    // 获取工作空间
    const workspace = await WorkspaceModel.getById(id);
    
    // 检查工作空间是否存在
    if (!workspace) {
      return NextResponse.json(
        { error: '工作空间不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(workspace);
  } catch (error: any) {
    console.error(`获取工作空间(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '获取工作空间失败' },
      { status: 500 }
    );
  }
}

/**
 * 更新指定ID的工作空间
 * PUT /api/workspaces/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的工作空间ID' },
        { status: 400 }
      );
    }
    
    // 获取工作空间，确认存在
    const existingWorkspace = await WorkspaceModel.getById(id);
    if (!existingWorkspace) {
      return NextResponse.json(
        { error: '工作空间不存在' },
        { status: 404 }
      );
    }
    
    // 解析请求体
    const body = await request.json();
    const updateData: IUpdateWorkspaceParams = {
      name: body.name,
      status: body.status,
      // 允许更新creator_id（用于注册流程）
      ...('creator_id' in body ? { creator_id: body.creator_id } : {})
    };
    
    // 至少需要一个更新字段
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '未提供任何更新字段' },
        { status: 400 }
      );
    }
    
    // 执行更新
    const success = await WorkspaceModel.update(id, updateData);
    
    if (!success) {
      return NextResponse.json(
        { error: '更新工作空间失败' },
        { status: 500 }
      );
    }
    
    // 获取更新后的工作空间
    const updatedWorkspace = await WorkspaceModel.getById(id);
    
    return NextResponse.json(updatedWorkspace);
  } catch (error: any) {
    console.error(`更新工作空间(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '更新工作空间失败' },
      { status: 500 }
    );
  }
}

/**
 * 删除指定ID的工作空间（实际是逻辑删除，设置状态为停用）
 * DELETE /api/workspaces/[id]
 */
export async function DELETE(
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // 验证ID格式
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: '无效的工作空间ID' },
        { status: 400 }
      );
    }
    
    // 检查工作空间是否存在
    const workspace = await WorkspaceModel.getById(id);
    if (!workspace) {
      return NextResponse.json(
        { error: '工作空间不存在' },
        { status: 404 }
      );
    }
    
    // 执行逻辑删除
    const success = await WorkspaceModel.delete(id);
    
    if (!success) {
      return NextResponse.json(
        { error: '删除工作空间失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: true, message: '工作空间已停用' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`删除工作空间(ID: ${params.id})失败:`, error);
    return NextResponse.json(
      { error: error.message || '删除工作空间失败' },
      { status: 500 }
    );
  }
} 