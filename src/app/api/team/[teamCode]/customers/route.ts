/**
 * 客户API接口
 * 作者: 阿瑞
 * 功能: 提供客户数据的查询和创建接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取客户列表
 */
const getCustomers = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]客户列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(name LIKE ? OR phone LIKE ? OR wechat LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    // 只查询未删除的客户
    conditions.push('deleted_at IS NULL');
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
      // 查询分页数据
      const querySql = `
        SELECT 
          id, name, phone, gender, wechat, 
          address, birthday, follow_date as followDate, balance,
          created_at as createdAt, updated_at as updatedAt 
        FROM customers ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query(querySql, queryParams);
      
      console.log(`查询团队[${teamCode}]客户列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        customers: Array.isArray(rows) ? rows : []
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]客户列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]客户列表失败:`, error);
    throw new Error('获取客户列表失败');
  }
};

/**
 * POST 创建客户
 */
const createCustomer = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证必填字段
  if (!data.name || !data.phone) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始创建团队[${teamCode}]客户, 姓名:${data.name}, 手机:${data.phone}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查手机号是否已存在
      const [existingCustomers] = await connection.query(
        'SELECT id FROM customers WHERE phone = ? AND deleted_at IS NULL',
        [data.phone]
      );
      
      if (Array.isArray(existingCustomers) && existingCustomers.length > 0) {
        await connection.rollback();
        return NextResponse.json({ error: '该手机号已被注册' }, { status: 409 });
      }
      
      // 处理地址字段，确保正确存储结构化地址
      let addressJson = null;
      if (data.address) {
        // 标准化地址对象结构
        const addressObj = {
          province: null,
          city: null, 
          district: null,
          detail: null
        };
        
        if (typeof data.address === 'string') {
          // 如果是字符串，作为详细地址存储
          addressObj.detail = data.address;
        } else if (typeof data.address === 'object') {
          // 将提供的地址对象结构化
          if (data.address.province) addressObj.province = data.address.province;
          if (data.address.city) addressObj.city = data.address.city;
          if (data.address.district || data.address.county) {
            addressObj.district = data.address.district || data.address.county;
          }
          if (data.address.detail) addressObj.detail = data.address.detail;
        }
        
        // 只有当至少有一个地址字段有值时才存储地址
        if (addressObj.province || addressObj.city || addressObj.district || addressObj.detail) {
          addressJson = JSON.stringify(addressObj);
        }
      }
      
      // 插入客户记录
      const insertSql = `
        INSERT INTO customers (
          name, phone, gender, wechat, address, birthday, 
          follow_date, balance, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.name,
        data.phone,
        data.gender || null,
        data.wechat || null,
        addressJson,
        data.birthday || null,
        data.followDate || null,
        data.balance || 0
      ]);
      
      const insertId = (result as any).insertId;
      
      // 查询新插入的客户信息
      const [newCustomerRows] = await connection.query(
        `SELECT 
          id, name, phone, gender, wechat, 
          address, birthday, follow_date as followDate, balance,
          created_at as createdAt, updated_at as updatedAt 
         FROM customers WHERE id = ?`,
        [insertId]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]客户成功, ID:${insertId}`);
      
      return NextResponse.json({
        message: '客户创建成功',
        customer: Array.isArray(newCustomerRows) && newCustomerRows.length > 0 ? newCustomerRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]客户创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]客户失败:`, error);
    throw new Error('创建客户失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getCustomers);
export const POST = withTeamDb(createCustomer); 