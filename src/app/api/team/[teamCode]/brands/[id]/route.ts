/**
 * 单个品牌API接口
 * 作者: 阿瑞
 * 功能: 提供单个品牌的查询、更新和删除接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取单个品牌
 */
const getBrand = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的品牌ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]品牌, ID:${id}`);
    
    const [rows] = await pool.query(
      `SELECT 
        id, \`order\`, name, description, 
        created_at as createdAt, updated_at as updatedAt 
      FROM brands WHERE id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '未找到相应品牌' }, { status: 404 });
    }
    
    console.log(`查询团队[${teamCode}]品牌成功, ID:${id}`);
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`获取团队[${teamCode}]品牌详情失败:`, error);
    throw new Error('获取品牌详情失败');
  }
};

/**
 * PUT 更新品牌
 */
const updateBrand = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的品牌ID' }, { status: 400 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证是否有需要更新的字段
  if (!data.name && data.order === undefined && !data.description) {
    return NextResponse.json({ error: '缺少需要更新的字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始更新团队[${teamCode}]品牌, ID:${id}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查品牌是否存在
      const [existingBrand] = await connection.query(
        'SELECT id FROM brands WHERE id = ?',
        [id]
      );
      
      if (!Array.isArray(existingBrand) || existingBrand.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '未找到相应品牌' }, { status: 404 });
      }
      
      // 如果更新名称，检查名称是否已存在
      if (data.name) {
        const [nameCheck] = await connection.query(
          'SELECT id FROM brands WHERE name = ? AND id != ?',
          [data.name, id]
        );
        
        if (Array.isArray(nameCheck) && nameCheck.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该品牌名称已存在' }, { status: 409 });
        }
      }
      
      // 构建更新SQL
      const updateFields = [];
      const updateParams = [];
      
      if (data.name) {
        updateFields.push('name = ?');
        updateParams.push(data.name);
      }
      
      if (data.order !== undefined) {
        updateFields.push('`order` = ?');
        updateParams.push(data.order);
      }
      
      if (data.description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(data.description || null);
      }
      
      updateFields.push('updated_at = NOW()');
      
      // 添加ID作为WHERE条件参数
      updateParams.push(id);
      
      const updateSql = `
        UPDATE brands 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      await connection.query(updateSql, updateParams);
      
      // 查询更新后的品牌信息
      const [updatedBrandRows] = await connection.query(
        `SELECT 
          id, \`order\`, name, description, 
          created_at as createdAt, updated_at as updatedAt 
        FROM brands WHERE id = ?`,
        [id]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`更新团队[${teamCode}]品牌成功, ID:${id}`);
      
      return NextResponse.json({
        message: '品牌更新成功',
        brand: Array.isArray(updatedBrandRows) && updatedBrandRows.length > 0 ? updatedBrandRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]品牌更新连接已释放`);
    }
  } catch (error) {
    console.error(`更新团队[${teamCode}]品牌失败:`, error);
    throw new Error('更新品牌失败');
  }
};

/**
 * DELETE 删除品牌
 */
const deleteBrand = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的品牌ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始删除团队[${teamCode}]品牌, ID:${id}`);
    
    // 检查品牌是否存在
    const [existingBrand] = await pool.query(
      'SELECT id FROM brands WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingBrand) || existingBrand.length === 0) {
      return NextResponse.json({ error: '未找到相应品牌' }, { status: 404 });
    }
    
    // 直接删除品牌记录
    await pool.query('DELETE FROM brands WHERE id = ?', [id]);
    
    console.log(`删除团队[${teamCode}]品牌成功, ID:${id}`);
    
    return NextResponse.json({ message: '品牌删除成功' });
  } catch (error) {
    console.error(`删除团队[${teamCode}]品牌失败:`, error);
    throw new Error('删除品牌失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getBrand);
export const PUT = withTeamDb(updateBrand);
export const DELETE = withTeamDb(deleteBrand); 