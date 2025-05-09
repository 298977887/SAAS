/**
 * 店铺API接口
 * 作者: 阿瑞
 * 功能: 提供店铺数据的查询接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

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
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
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
      
      const [rows] = await connection.query(querySql, queryParams);
      
      // 获取每个店铺的账号类型
      let shops = Array.isArray(rows) ? rows : [];
      if (shops.length > 0) {
        for (const shop of shops) {
          // 查询店铺关联的账号类型
          const [accountTypes] = await connection.query(
            `SELECT category_id as categoryId FROM shop_account_types WHERE shop_id = ?`,
            [shop.id]
          );
          
          shop.accountTypes = Array.isArray(accountTypes) 
            ? accountTypes.map((type: any) => type.categoryId) 
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

// 导出处理函数
export const GET = withTeamDb(getShops); 