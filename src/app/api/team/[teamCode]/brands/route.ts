/**
 * 品牌API接口
 * 作者: 阿瑞
 * 功能: 提供品牌数据的查询和创建接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取品牌列表
 */
const getBrands = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]品牌列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM brands ${whereClause}`;
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
      // 查询分页数据
      const querySql = `
        SELECT 
          id, \`order\`, name, description, 
          created_at as createdAt, updated_at as updatedAt 
        FROM brands ${whereClause} 
        ORDER BY \`order\` ASC, id ASC 
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query(querySql, queryParams);
      
      console.log(`查询团队[${teamCode}]品牌列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        brands: Array.isArray(rows) ? rows : []
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]品牌列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]品牌列表失败:`, error);
    throw new Error('获取品牌列表失败');
  }
};

/**
 * POST 创建品牌
 */
const createBrand = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证必填字段
  if (!data.name) {
    return NextResponse.json({ error: '品牌名称为必填字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始创建团队[${teamCode}]品牌, 名称:${data.name}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查品牌名称是否已存在
      const [existingBrands] = await connection.query(
        'SELECT id FROM brands WHERE name = ?',
        [data.name]
      );
      
      if (Array.isArray(existingBrands) && existingBrands.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: '该品牌名称已存在' }, { status: 409 });
      }
      
      // 插入品牌记录
      const insertSql = `
        INSERT INTO brands (
          \`order\`, name, description, created_at, updated_at
        ) VALUES (?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.order || 0,
        data.name,
        data.description || null
      ]);
      
      const insertId = (result as any).insertId;
      
      // 查询新插入的品牌信息
      const [newBrandRows] = await connection.query(
        `SELECT 
          id, \`order\`, name, description, 
          created_at as createdAt, updated_at as updatedAt 
         FROM brands WHERE id = ?`,
        [insertId]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]品牌成功, ID:${insertId}`);
      
      return NextResponse.json({
        message: '品牌创建成功',
        brand: Array.isArray(newBrandRows) && newBrandRows.length > 0 ? newBrandRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]品牌创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]品牌失败:`, error);
    throw new Error('创建品牌失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getBrands);
export const POST = withTeamDb(createBrand); 