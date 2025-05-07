/**
 * 单个供应商API接口
 * 作者: 阿瑞
 * 功能: 提供单个供应商的查询、更新和删除接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取单个供应商
 */
const getSupplier = async (_req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的供应商ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]供应商, ID:${id}`);
    
    const [rows] = await pool.query(
      `SELECT 
        id, \`order\`, name, contact, status, level, type, remark,
        created_at as createdAt, updated_at as updatedAt 
      FROM suppliers WHERE id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '未找到相应供应商' }, { status: 404 });
    }
    
    console.log(`查询团队[${teamCode}]供应商成功, ID:${id}`);
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`获取团队[${teamCode}]供应商详情失败:`, error);
    throw new Error('获取供应商详情失败');
  }
};

/**
 * PUT 更新供应商
 */
const updateSupplier = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的供应商ID' }, { status: 400 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证是否有需要更新的字段
  if (!data.name && data.order === undefined && !data.contact && data.status === undefined && 
      !data.level && !data.type && data.remark === undefined) {
    return NextResponse.json({ error: '缺少需要更新的字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始更新团队[${teamCode}]供应商, ID:${id}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查供应商是否存在
      const [existingSupplier] = await connection.query(
        'SELECT id FROM suppliers WHERE id = ?',
        [id]
      );
      
      if (!Array.isArray(existingSupplier) || existingSupplier.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '未找到相应供应商' }, { status: 404 });
      }
      
      // 如果更新名称，检查名称是否已存在
      if (data.name) {
        const [nameCheck] = await connection.query(
          'SELECT id FROM suppliers WHERE name = ? AND id != ?',
          [data.name, id]
        );
        
        if (Array.isArray(nameCheck) && nameCheck.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该供应商名称已存在' }, { status: 409 });
        }
      }
      
      // 处理联系方式字段
      let contactJson = undefined;
      if (data.contact !== undefined) {
        contactJson = data.contact ? JSON.stringify(data.contact) : null;
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
      
      if (contactJson !== undefined) {
        updateFields.push('contact = ?');
        updateParams.push(contactJson);
      }
      
      if (data.status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(data.status);
      }
      
      if (data.level !== undefined) {
        updateFields.push('level = ?');
        updateParams.push(data.level || null);
      }
      
      if (data.type !== undefined) {
        updateFields.push('type = ?');
        updateParams.push(data.type || null);
      }
      
      if (data.remark !== undefined) {
        updateFields.push('remark = ?');
        updateParams.push(data.remark || null);
      }
      
      updateFields.push('updated_at = NOW()');
      
      // 添加ID作为WHERE条件参数
      updateParams.push(id);
      
      const updateSql = `
        UPDATE suppliers 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      await connection.query(updateSql, updateParams);
      
      // 查询更新后的供应商信息
      const [updatedSupplierRows] = await connection.query(
        `SELECT 
          id, \`order\`, name, contact, status, level, type, remark,
          created_at as createdAt, updated_at as updatedAt 
        FROM suppliers WHERE id = ?`,
        [id]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`更新团队[${teamCode}]供应商成功, ID:${id}`);
      
      return NextResponse.json({
        message: '供应商更新成功',
        supplier: Array.isArray(updatedSupplierRows) && updatedSupplierRows.length > 0 ? updatedSupplierRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]供应商更新连接已释放`);
    }
  } catch (error) {
    console.error(`更新团队[${teamCode}]供应商失败:`, error);
    throw new Error('更新供应商失败');
  }
};

/**
 * DELETE 删除供应商
 */
const deleteSupplier = async (_req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的供应商ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始删除团队[${teamCode}]供应商, ID:${id}`);
    
    // 使用单个连接执行删除操作
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查供应商是否存在
      const [existingSupplier] = await connection.query(
        'SELECT id FROM suppliers WHERE id = ?',
        [id]
      );
      
      if (!Array.isArray(existingSupplier) || existingSupplier.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '未找到相应供应商' }, { status: 404 });
      }
      
      // 删除供应商与品类的关联记录
      await connection.query('DELETE FROM supplier_categories WHERE supplier_id = ?', [id]);
      
      // 删除供应商记录
      await connection.query('DELETE FROM suppliers WHERE id = ?', [id]);
      
      // 提交事务
      await connection.commit();
      
      console.log(`删除团队[${teamCode}]供应商成功, ID:${id}`);
      
      return NextResponse.json({ message: '供应商删除成功' });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]供应商删除连接已释放`);
    }
  } catch (error) {
    console.error(`删除团队[${teamCode}]供应商失败:`, error);
    throw new Error('删除供应商失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getSupplier);
export const PUT = withTeamDb(updateSupplier);
export const DELETE = withTeamDb(deleteSupplier); 