/**
 * 供应商API接口
 * 作者: 阿瑞
 * 功能: 提供供应商数据的查询和创建接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';
import { SupplierStatus } from '@/models/team/types/supplier';

/**
 * GET 获取供应商列表
 */
const getSuppliers = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  const status = url.searchParams.get('status') !== null ? parseInt(url.searchParams.get('status') as string) : null;
  const level = url.searchParams.get('level') || null;
  const type = url.searchParams.get('type') || null;
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]供应商列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR JSON_EXTRACT(contact, "$.contactPerson") LIKE ? OR JSON_EXTRACT(contact, "$.phone") LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (status !== null) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (level) {
      conditions.push('level = ?');
      params.push(level);
    }
    
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`;
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
      // 查询分页数据
      const querySql = `
        SELECT 
          id, \`order\`, name, contact, status, level, type, remark,
          created_at as createdAt, updated_at as updatedAt 
        FROM suppliers ${whereClause} 
        ORDER BY \`order\` ASC, id ASC 
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query(querySql, queryParams);
      
      console.log(`查询团队[${teamCode}]供应商列表成功, 总数:${total}`);
      
      // 查询所有不同的供应商级别和类型，用于前端筛选
      const [levelRows] = await connection.query('SELECT DISTINCT level FROM suppliers WHERE level IS NOT NULL AND level != ""');
      const [typeRows] = await connection.query('SELECT DISTINCT type FROM suppliers WHERE type IS NOT NULL AND type != ""');
      
      // 转换结果
      const levels = Array.isArray(levelRows) ? levelRows.map((row: any) => row.level).filter(Boolean) : [];
      const types = Array.isArray(typeRows) ? typeRows.map((row: any) => row.type).filter(Boolean) : [];
      
      return NextResponse.json({
        total,
        suppliers: Array.isArray(rows) ? rows : [],
        filters: {
          levels,
          types
        }
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]供应商列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]供应商列表失败:`, error);
    throw new Error('获取供应商列表失败');
  }
};

/**
 * POST 创建供应商
 */
const createSupplier = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证必填字段
  if (!data.name) {
    return NextResponse.json({ error: '供应商名称为必填字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始创建团队[${teamCode}]供应商, 名称:${data.name}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查供应商名称是否已存在
      const [existingSuppliers] = await connection.query(
        'SELECT id FROM suppliers WHERE name = ?',
        [data.name]
      );
      
      if (Array.isArray(existingSuppliers) && existingSuppliers.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: '该供应商名称已存在' }, { status: 409 });
      }
      
      // 处理联系方式字段
      let contactJson = null;
      if (data.contact) {
        contactJson = JSON.stringify(data.contact);
      }
      
      // 插入供应商记录
      const insertSql = `
        INSERT INTO suppliers (
          \`order\`, name, contact, status, level, type, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.order || 0,
        data.name,
        contactJson,
        data.status !== undefined ? data.status : SupplierStatus.ENABLED,
        data.level || null,
        data.type || null,
        data.remark || null
      ]);
      
      const insertId = (result as any).insertId;
      
      // 查询新插入的供应商信息
      const [newSupplierRows] = await connection.query(
        `SELECT 
          id, \`order\`, name, contact, status, level, type, remark,
          created_at as createdAt, updated_at as updatedAt 
         FROM suppliers WHERE id = ?`,
        [insertId]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]供应商成功, ID:${insertId}`);
      
      return NextResponse.json({
        message: '供应商创建成功',
        supplier: Array.isArray(newSupplierRows) && newSupplierRows.length > 0 ? newSupplierRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]供应商创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]供应商失败:`, error);
    throw new Error('创建供应商失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getSuppliers);
export const POST = withTeamDb(createSupplier); 