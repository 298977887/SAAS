/**
 * 客户详情API接口
 * 作者: 阿瑞
 * 功能: 提供客户详情获取、更新和删除功能
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取客户详情
 */
const getCustomerDetail = async (
  _req: NextRequest, 
  params: { teamCode: string; id: string }, 
  pool: Pool
) => {
  // teamCode在api-handler中使用，这里只提取id
  const { id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
  }
  
  try {
    // 查询客户信息
    const [rows] = await pool.query(
      `SELECT 
        id, name, phone, gender, wechat, 
        address, birthday, follow_date as followDate, balance,
        created_at as createdAt, updated_at as updatedAt 
       FROM customers 
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ customer: rows[0] });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    throw new Error('获取客户详情失败');
  }
};

/**
 * PUT 更新客户信息
 */
const updateCustomer = async (
  req: NextRequest, 
  params: { teamCode: string; id: string }, 
  pool: Pool
) => {
  // teamCode在api-handler中使用，这里只提取id
  const { id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证ID是否匹配
  if (data.id !== Number(id)) {
    return NextResponse.json({ error: '客户ID不匹配' }, { status: 400 });
  }
  
  try {
    // 检查客户是否存在
    const [existingCustomers] = await pool.query(
      'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!Array.isArray(existingCustomers) || existingCustomers.length === 0) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }
    
    // 如果更新手机号，检查是否与其他客户重复
    if (data.phone) {
      const [phoneCheck] = await pool.query(
        'SELECT id FROM customers WHERE phone = ? AND id != ? AND deleted_at IS NULL',
        [data.phone, id]
      );
      
      if (Array.isArray(phoneCheck) && phoneCheck.length > 0) {
        return NextResponse.json({ error: '该手机号已被其他客户使用' }, { status: 409 });
      }
    }
    
    // 处理地址字段，确保正确存储结构化地址
    let addressJson = undefined;
    if (data.address !== undefined) {
      if (data.address === null) {
        addressJson = null;
      } else {
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
        } else {
          addressJson = null;
        }
      }
    }
    
    // 构建更新字段
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    // 可更新的字段列表
    const fieldMapping: Record<string, string> = {
      'name': 'name',
      'phone': 'phone',
      'gender': 'gender',
      'wechat': 'wechat',
      'birthday': 'birthday',
      'followDate': 'follow_date',
      'balance': 'balance'
    };
    
    // 特殊处理地址字段
    if (addressJson !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(addressJson);
    }
    
    // 遍历请求数据，构建更新语句
    Object.entries(fieldMapping).forEach(([clientField, dbField]) => {
      if (data[clientField] !== undefined) {
        updateFields.push(`${dbField} = ?`);
        updateValues.push(data[clientField]);
      }
    });
    
    // 添加更新时间
    updateFields.push('updated_at = NOW()');
    
    // 如果没有要更新的字段，返回成功
    if (updateFields.length === 0) {
      return NextResponse.json({ message: '无需更新' });
    }
    
    // 构建并执行更新SQL
    const updateSql = `UPDATE customers SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(id);
    
    await pool.query(updateSql, updateValues);
    
    // 获取更新后的客户信息
    const [updatedRows] = await pool.query(
      `SELECT 
        id, name, phone, gender, wechat, 
        address, birthday, follow_date as followDate, balance,
        created_at as createdAt, updated_at as updatedAt 
       FROM customers 
       WHERE id = ?`,
      [id]
    );
    
    return NextResponse.json({
      message: '客户更新成功',
      customer: Array.isArray(updatedRows) && updatedRows.length > 0 ? updatedRows[0] : null
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    throw new Error('更新客户失败');
  }
};

/**
 * DELETE 删除客户
 */
const deleteCustomer = async (
  _req: NextRequest, 
  params: { teamCode: string; id: string }, 
  pool: Pool
) => {
  // teamCode在api-handler中使用，这里只提取id
  const { id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的客户ID' }, { status: 400 });
  }
  
  try {
    // 检查客户是否存在
    const [existingCustomers] = await pool.query(
      'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    
    if (!Array.isArray(existingCustomers) || existingCustomers.length === 0) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 });
    }
    
    // 软删除：设置deleted_at字段
    await pool.query(
      'UPDATE customers SET deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({ message: '客户删除成功' });
  } catch (error) {
    console.error('删除客户失败:', error);
    throw new Error('删除客户失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getCustomerDetail);
export const PUT = withTeamDb(updateCustomer);
export const DELETE = withTeamDb(deleteCustomer); 