/**
 * 店铺粉丝增长API接口
 * 作者: 阿瑞
 * 功能: 提供店铺粉丝增长记录的查询和新增接口
 * 版本: 1.1.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * 格式化MySQL日期为YYYY-MM-DD格式
 * 修复时区问题，保留原始日期
 */
function formatMySQLDate(date: Date): string {
  // MySQL中存储的是本地日期，直接获取日期部分即可
  // 注意：不使用toISOString()，因为它会转换为UTC时间并导致日期偏移
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET 查询店铺粉丝增长记录列表
 */
const getGrowthRecords = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  const { searchParams } = new URL(req.url);
  
  // 获取分页参数
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const offset = (page - 1) * pageSize;
  
  // 获取筛选参数
  const keyword = searchParams.get('keyword');
  const shopId = searchParams.get('shopId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺粉丝增长记录`);
    
    // 构建查询条件
    const conditions = [];
    const queryParams: any[] = [];
    
    if (shopId && parseInt(shopId) > 0) {
      conditions.push('g.shop_id = ?');
      queryParams.push(parseInt(shopId));
    }
    
    if (startDate) {
      conditions.push('g.date >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      conditions.push('g.date <= ?');
      queryParams.push(endDate);
    }
    
    if (keyword) {
      conditions.push('(s.wechat LIKE ? OR s.nickname LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查询总记录数
    const [countResult] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total FROM shop_follower_growth g
       LEFT JOIN shops s ON g.shop_id = s.id
       ${whereClause}`,
      queryParams
    );
    
    const total = countResult[0].total;
    
    // 查询分页数据
    const paginationParams = [...queryParams, offset, pageSize];
    const [rows] = await pool.query<any[]>(
      `SELECT 
         g.id, g.shop_id, g.date, g.total, g.deducted, g.daily_increase,
         g.created_at, g.updated_at,
         s.wechat, s.nickname
       FROM shop_follower_growth g
       LEFT JOIN shops s ON g.shop_id = s.id
       ${whereClause}
       ORDER BY g.date DESC, g.id DESC
       LIMIT ?, ?`,
      paginationParams
    );
    
    // 格式化返回数据
    const records = rows.map(row => ({
      id: row.id,
      shop_id: row.shop_id,
      // 使用新的日期格式化函数
      date: formatMySQLDate(row.date),
      total: row.total,
      deducted: row.deducted,
      daily_increase: row.daily_increase,
      created_at: row.created_at,
      updated_at: row.updated_at,
      shop_name: row.nickname || row.wechat || `店铺ID: ${row.shop_id}`
    }));
    
    console.log(`查询团队[${teamCode}]店铺粉丝增长记录成功，共 ${total} 条记录`);
    
    return NextResponse.json({
      total,
      records
    });
  } catch (error) {
    console.error(`获取团队[${teamCode}]店铺粉丝增长记录失败:`, error);
    throw new Error('获取店铺粉丝增长记录失败');
  }
};

/**
 * POST 添加店铺粉丝增长记录
 */
const addGrowthRecord = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  try {
    // 解析请求数据
    const data = await req.json();
    const { shop_id, date, total, deducted } = data;
    
    // 验证必填字段
    if (!shop_id || !date || total === undefined) {
      return NextResponse.json({ error: '店铺ID、日期和粉丝总数为必填项' }, { status: 400 });
    }
    
    // 验证数据类型
    if (typeof shop_id !== 'number' || typeof total !== 'number') {
      return NextResponse.json({ error: '数据类型错误' }, { status: 400 });
    }

    // 检查店铺是否存在
    const [shopExists] = await pool.query<any[]>(
      'SELECT id FROM shops WHERE id = ?',
      [shop_id]
    );
    
    if (shopExists.length === 0) {
      return NextResponse.json({ error: '店铺不存在' }, { status: 400 });
    }
    
    // 检查记录是否已存在（同一店铺同一天只能有一条记录）
    const [existingRecord] = await pool.query<any[]>(
      'SELECT id FROM shop_follower_growth WHERE shop_id = ? AND date = ?',
      [shop_id, date]
    );
    
    if (existingRecord.length > 0) {
      return NextResponse.json({ 
        error: '该店铺在选定日期已有记录，请编辑现有记录或选择其他日期' 
      }, { status: 409 });
    }
    
    // 计算日增长
    const daily_increase = total - (deducted || 0);

    // 插入记录
    const [result] = await pool.query(
      `INSERT INTO shop_follower_growth 
       (shop_id, date, total, deducted, daily_increase)
       VALUES (?, ?, ?, ?, ?)`,
      [shop_id, date, total, deducted || 0, daily_increase]
    );
    
    const insertId = (result as any).insertId;
    
    console.log(`添加团队[${teamCode}]店铺粉丝增长记录成功, ID: ${insertId}`);
    
    return NextResponse.json({
      id: insertId,
      shop_id,
      date,
      total,
      deducted: deducted || 0,
      daily_increase
    }, { status: 201 });
  } catch (error) {
    console.error(`添加团队[${teamCode}]店铺粉丝增长记录失败:`, error);
    throw new Error('添加店铺粉丝增长记录失败');
  }
};

// 导出API处理函数
export const GET = withTeamDb(getGrowthRecords);
export const POST = withTeamDb(addGrowthRecord); 