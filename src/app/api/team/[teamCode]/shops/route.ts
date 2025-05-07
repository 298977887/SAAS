/**
 * 店铺API接口
 * 作者: 阿瑞
 * 功能: 提供店铺数据的查询和创建接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';
import { ShopStatus } from '@/models/team/types/shop';

/**
 * GET 获取店铺列表
 */
const getShops = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  const statusParam = url.searchParams.get('status');
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(nickname LIKE ? OR wechat LIKE ? OR phone LIKE ? OR account_no LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (statusParam !== null && statusParam !== undefined && !isNaN(Number(statusParam))) {
      conditions.push('status = ?');
      params.push(Number(statusParam));
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `SELECT COUNT(*) as total FROM shops ${whereClause}`;
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
      // 查询分页数据
      const querySql = `
        SELECT 
          id, unionid, openid, account_no as accountNo, wechat,
          avatar, nickname, phone, status, remark,
          created_at as createdAt, updated_at as updatedAt 
        FROM shops ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query(querySql, queryParams);
      
      console.log(`查询团队[${teamCode}]店铺列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        shops: Array.isArray(rows) ? rows : []
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]店铺列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]店铺列表失败:`, error);
    throw new Error('获取店铺列表失败');
  }
};

/**
 * POST 创建店铺
 */
const createShop = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取请求数据
  const data = await req.json();
  
  try {
    console.log(`开始创建团队[${teamCode}]店铺`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 如果提供了unionid，检查是否已存在
      if (data.unionid) {
        const [existingShops] = await connection.query(
          'SELECT id FROM shops WHERE unionid = ?',
          [data.unionid]
        );
        
        if (Array.isArray(existingShops) && existingShops.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该unionid已存在' }, { status: 409 });
        }
      }
      
      // 如果提供了wechat，检查是否已存在
      if (data.wechat) {
        const [existingShops] = await connection.query(
          'SELECT id FROM shops WHERE wechat = ?',
          [data.wechat]
        );
        
        if (Array.isArray(existingShops) && existingShops.length > 0) {
          await connection.rollback();
          return NextResponse.json({ error: '该微信号已存在' }, { status: 409 });
        }
      }
      
      // 插入店铺记录
      const insertSql = `
        INSERT INTO shops (
          unionid, openid, account_no, wechat, avatar, 
          nickname, phone, status, remark,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.unionid || null,
        data.openid || null,
        data.accountNo || null,
        data.wechat || null,
        data.avatar || null,
        data.nickname || null,
        data.phone || null,
        data.status !== undefined ? data.status : ShopStatus.ACTIVE,
        data.remark || null
      ]);
      
      const insertId = (result as any).insertId;
      
      // 查询新插入的店铺信息
      const [newShopRows] = await connection.query(
        `SELECT 
          id, unionid, openid, account_no as accountNo, wechat,
          avatar, nickname, phone, status, remark,
          created_at as createdAt, updated_at as updatedAt 
         FROM shops WHERE id = ?`,
        [insertId]
      );
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]店铺成功, ID:${insertId}`);
      
      return NextResponse.json({
        message: '店铺创建成功',
        shop: Array.isArray(newShopRows) && newShopRows.length > 0 ? newShopRows[0] : null
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]店铺创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]店铺失败:`, error);
    throw new Error('创建店铺失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getShops);
export const POST = withTeamDb(createShop); 