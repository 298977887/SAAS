/**
 * 单个店铺API接口
 * 作者: 阿瑞
 * 功能: 提供单个店铺的查询、更新和删除接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取单个店铺
 */
const getShop = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的店铺ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺, ID:${id}`);
    
    const [rows] = await pool.query(
      `SELECT 
        id, unionid, openid, account_no as accountNo, wechat,
        avatar, nickname, phone, status, remark,
        created_at as createdAt, updated_at as updatedAt 
      FROM shops WHERE id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '未找到相应店铺' }, { status: 404 });
    }
    
    console.log(`查询团队[${teamCode}]店铺成功, ID:${id}`);
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(`获取团队[${teamCode}]店铺详情失败:`, error);
    throw new Error('获取店铺详情失败');
  }
};

/**
 * PUT 更新店铺
 */
const updateShop = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的店铺ID' }, { status: 400 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  try {
    console.log(`开始更新团队[${teamCode}]店铺, ID:${id}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查店铺是否存在
      const [existingShop] = await connection.query(
        'SELECT id FROM shops WHERE id = ?',
        [id]
      );
      
      if (!Array.isArray(existingShop) || existingShop.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '未找到相应店铺' }, { status: 404 });
      }
      
      // 如果更新unionid，检查是否已存在
      if (data.unionid) {
        const [unionidCheck] = await connection.query(
          'SELECT id FROM shops WHERE unionid = ? AND id != ?',
          [data.unionid, id]
        );
        
        if (Array.isArray(unionidCheck) && unionidCheck.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该unionid已存在' }, { status: 409 });
        }
      }
      
      // 如果更新wechat，检查是否已存在
      if (data.wechat) {
        const [wechatCheck] = await connection.query(
          'SELECT id FROM shops WHERE wechat = ? AND id != ?',
          [data.wechat, id]
        );
        
        if (Array.isArray(wechatCheck) && wechatCheck.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该微信号已存在' }, { status: 409 });
        }
      }
      
      // 构建更新SQL
      const updateFields = [];
      const updateParams = [];
      
      // 按字段顺序检查并添加到更新列表
      if (data.unionid !== undefined) {
        updateFields.push('unionid = ?');
        updateParams.push(data.unionid || null);
      }
      
      if (data.openid !== undefined) {
        updateFields.push('openid = ?');
        updateParams.push(data.openid || null);
      }
      
      if (data.accountNo !== undefined) {
        updateFields.push('account_no = ?');
        updateParams.push(data.accountNo || null);
      }
      
      if (data.wechat !== undefined) {
        updateFields.push('wechat = ?');
        updateParams.push(data.wechat || null);
      }
      
      if (data.avatar !== undefined) {
        updateFields.push('avatar = ?');
        updateParams.push(data.avatar || null);
      }
      
      if (data.nickname !== undefined) {
        updateFields.push('nickname = ?');
        updateParams.push(data.nickname || null);
      }
      
      if (data.phone !== undefined) {
        updateFields.push('phone = ?');
        updateParams.push(data.phone || null);
      }
      
      if (data.status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(data.status);
      }
      
      if (data.remark !== undefined) {
        updateFields.push('remark = ?');
        updateParams.push(data.remark || null);
      }
      
      if (updateFields.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '没有提供需要更新的字段' }, { status: 400 });
      }
      
      updateFields.push('updated_at = NOW()');
      
      // 添加ID作为WHERE条件参数
      updateParams.push(id);
      
      const updateSql = `
        UPDATE shops 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      await connection.query(updateSql, updateParams);
      
      // 查询更新后的店铺信息
      const [updatedShopRows] = await connection.query(
        `SELECT 
          id, unionid, openid, account_no as accountNo, wechat,
          avatar, nickname, phone, status, remark,
          created_at as createdAt, updated_at as updatedAt 
        FROM shops WHERE id = ?`,
        [id]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`更新团队[${teamCode}]店铺成功, ID:${id}`);
      
      return NextResponse.json({
        message: '店铺更新成功',
        shop: Array.isArray(updatedShopRows) && updatedShopRows.length > 0 ? updatedShopRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]店铺更新连接已释放`);
    }
  } catch (error) {
    console.error(`更新团队[${teamCode}]店铺失败:`, error);
    throw new Error('更新店铺失败');
  }
};

/**
 * DELETE 删除店铺
 */
const deleteShop = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的店铺ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始删除团队[${teamCode}]店铺, ID:${id}`);
    
    // 检查店铺是否存在
    const [existingShop] = await pool.query(
      'SELECT id FROM shops WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingShop) || existingShop.length === 0) {
      return NextResponse.json({ error: '未找到相应店铺' }, { status: 404 });
    }
    
    // 直接删除店铺记录
    await pool.query('DELETE FROM shops WHERE id = ?', [id]);
    
    console.log(`删除团队[${teamCode}]店铺成功, ID:${id}`);
    
    return NextResponse.json({ message: '店铺删除成功' });
  } catch (error) {
    console.error(`删除团队[${teamCode}]店铺失败:`, error);
    throw new Error('删除店铺失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getShop);
export const PUT = withTeamDb(updateShop);
export const DELETE = withTeamDb(deleteShop); 