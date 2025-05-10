/**
 * 店铺API接口
 * 作者: 阿瑞
 * 功能: 提供店铺数据的查询和创建接口
 * 版本: 1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * 自定义类型定义
 */
interface CountResult extends RowDataPacket {
  total: number;
}

interface ShopType extends RowDataPacket {
  categoryId: number;
}

interface Shop extends RowDataPacket {
  id: number;
  unionid?: string;
  openid?: string;
  accountNo?: string;
  wechat?: string;
  avatar?: string;
  nickname?: string;
  phone?: string;
  status: number;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  accountTypes?: number[];
}

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
  const status = url.searchParams.get('status') || '';
  const accountType = url.searchParams.get('accountType') || '';
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(s.nickname LIKE ? OR s.wechat LIKE ? OR s.account_no LIKE ? OR s.remark LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }
    
    // 需要连接账号类型表进行查询
    let joinAccountTypeTable = '';
    if (accountType) {
      joinAccountTypeTable = 'LEFT JOIN shop_account_types sat ON s.id = sat.shop_id';
      conditions.push('sat.category_id = ?');
      params.push(accountType);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `
        SELECT COUNT(DISTINCT s.id) as total 
        FROM shops s
        ${joinAccountTypeTable}
        ${whereClause}
      `;
      const [totalRows] = await connection.query<CountResult[]>(countSql, params);
      
      const total = totalRows[0].total;
      
      // 查询分页数据
      const querySql = `
        SELECT DISTINCT
          s.id, s.unionid, s.openid, s.account_no as accountNo,
          s.wechat, s.avatar, s.nickname, s.phone, s.status,
          s.remark, s.created_at as createdAt, s.updated_at as updatedAt
        FROM shops s
        ${joinAccountTypeTable}
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query<Shop[]>(querySql, queryParams);
      
      // 获取每个店铺的账号类型
      const shops = Array.isArray(rows) ? rows : [];
      if (shops.length > 0) {
        for (const shop of shops) {
          // 查询店铺关联的账号类型
          const [accountTypes] = await connection.query<ShopType[]>(
            `SELECT category_id as categoryId FROM shop_account_types WHERE shop_id = ?`,
            [shop.id]
          );
          
          shop.accountTypes = Array.isArray(accountTypes) 
            ? accountTypes.map((type) => type.categoryId) 
            : [];
        }
      }
      
      console.log(`查询团队[${teamCode}]店铺列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        shops
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
  
  try {
    console.log(`开始创建团队[${teamCode}]店铺`);
    
    // 解析请求数据
    const data = await req.json();
    
    // 校验请求数据：至少需要nickname或wechat之一
    if (!data.nickname && !data.wechat) {
      return NextResponse.json(
        { error: '店铺名称或微信号至少需要填写一项' },
        { status: 400 }
      );
    }
    
    // 获取数据库连接
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查wechat是否已存在
      if (data.wechat) {
        const [existingWechat] = await connection.query(
          'SELECT id FROM shops WHERE wechat = ?',
          [data.wechat]
        );
        
        if (Array.isArray(existingWechat) && existingWechat.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            { error: '该微信号已存在' },
            { status: 409 }
          );
        }
      }
      
      // 检查unionid是否已存在
      if (data.unionid) {
        const [existingUnionid] = await connection.query(
          'SELECT id FROM shops WHERE unionid = ?',
          [data.unionid]
        );
        
        if (Array.isArray(existingUnionid) && existingUnionid.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            { error: '该unionid已存在' },
            { status: 409 }
          );
        }
      }
      
      // 准备插入数据
      const insertSql = `
        INSERT INTO shops (
          unionid, openid, account_no, wechat, 
          avatar, nickname, phone, status, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        data.unionid || null,
        data.openid || null,
        data.accountNo || null,
        data.wechat || null,
        data.avatar || null,
        data.nickname || null,
        data.phone || null,
        data.status || 1, // 默认状态为正常
        data.remark || null
      ];
      
      // 执行插入操作
      const [result] = await connection.query(insertSql, insertParams);
      const shopId = (result as any).insertId;
      
      // 处理账号类型关联
      if (data.accountTypes && Array.isArray(data.accountTypes) && data.accountTypes.length > 0) {
        // 创建账号类型关联
        for (const categoryId of data.accountTypes) {
          await connection.query(
            'INSERT INTO shop_account_types (shop_id, category_id) VALUES (?, ?)',
            [shopId, categoryId]
          );
        }
      }
      
      // 提交事务
      await connection.commit();
      
      // 查询创建好的店铺完整信息
      const [shops] = await connection.query(
        `SELECT 
          id, unionid, openid, account_no as accountNo, wechat,
          avatar, nickname, phone, status, remark,
          created_at as createdAt, updated_at as updatedAt 
        FROM shops WHERE id = ?`,
        [shopId]
      );
      
      if (!Array.isArray(shops) || shops.length === 0) {
        // 这种情况理论上不应该发生
        return NextResponse.json(
          { error: '店铺创建失败，无法获取新建店铺信息' },
          { status: 500 }
        );
      }
      
      const shop = shops[0];
      
      // 获取关联的账号类型
      const [accountTypes] = await connection.query(
        `SELECT category_id as categoryId FROM shop_account_types WHERE shop_id = ?`,
        [shopId]
      );
      
      (shop as Shop).accountTypes = Array.isArray(accountTypes) 
        ? accountTypes.map((type: any) => type.categoryId) 
        : [];
      
      console.log(`创建团队[${teamCode}]店铺成功, ID:${shopId}`);
      
      return NextResponse.json(shop);
    } catch (error) {
      // 捕获到错误时回滚事务
      await connection.rollback();
      console.error(`创建团队[${teamCode}]店铺失败:`, error);
      throw error;
    } finally {
      // 确保在任何情况下都释放连接
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