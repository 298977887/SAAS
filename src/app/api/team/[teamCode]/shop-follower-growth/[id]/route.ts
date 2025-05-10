/**
 * 单个店铺粉丝增长记录API接口
 * 作者: 阿瑞
 * 功能: 提供单个店铺粉丝增长记录的获取、更新和删除接口
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
 * GET 获取单个店铺粉丝增长记录
 */
const getGrowthRecord = async (_req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的记录ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺粉丝增长记录, ID:${id}`);
    
    // 查询记录详情
    const [rows] = await pool.query<any[]>(
      `SELECT 
         g.id, g.shop_id, g.date, g.total, g.deducted, g.daily_increase,
         g.created_at, g.updated_at,
         s.wechat, s.nickname
       FROM shop_follower_growth g
       LEFT JOIN shops s ON g.shop_id = s.id
       WHERE g.id = ?`,
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '未找到相应记录' }, { status: 404 });
    }
    
    // 格式化返回数据
    const record = {
      id: rows[0].id,
      shop_id: rows[0].shop_id,
      date: formatMySQLDate(rows[0].date), // 使用修复的日期格式化函数
      total: rows[0].total,
      deducted: rows[0].deducted,
      daily_increase: rows[0].daily_increase,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at,
      shop_name: rows[0].nickname || rows[0].wechat || `店铺ID: ${rows[0].shop_id}`
    };
    
    console.log(`查询团队[${teamCode}]店铺粉丝增长记录成功, ID:${id}`);
    
    return NextResponse.json(record);
  } catch (error) {
    console.error(`获取团队[${teamCode}]店铺粉丝增长记录详情失败:`, error);
    throw new Error('获取粉丝增长记录详情失败');
  }
};

/**
 * PUT 更新店铺粉丝增长记录
 */
const updateGrowthRecord = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的记录ID' }, { status: 400 });
  }
  
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
    
    // 检查记录是否存在
    const [existingRecord] = await pool.query<any[]>(
      'SELECT id FROM shop_follower_growth WHERE id = ?',
      [id]
    );
    
    if (existingRecord.length === 0) {
      return NextResponse.json({ error: '未找到相应记录' }, { status: 404 });
    }
    
    // 检查店铺是否存在
    const [shopExists] = await pool.query<any[]>(
      'SELECT id FROM shops WHERE id = ?',
      [shop_id]
    );
    
    if (shopExists.length === 0) {
      return NextResponse.json({ error: '店铺不存在' }, { status: 400 });
    }
    
    // 检查日期是否与其他记录冲突
    const [dateConflict] = await pool.query<any[]>(
      'SELECT id FROM shop_follower_growth WHERE shop_id = ? AND date = ? AND id != ?',
      [shop_id, date, id]
    );
    
    if (dateConflict.length > 0) {
      return NextResponse.json({ 
        error: '该店铺在选定日期已有其他记录，一个店铺每天只能有一条记录' 
      }, { status: 409 });
    }
    
    // 计算日增长
    const daily_increase = total - (deducted || 0);
    
    // 更新记录
    await pool.query(
      `UPDATE shop_follower_growth
       SET shop_id = ?, date = ?, total = ?, deducted = ?, daily_increase = ?
       WHERE id = ?`,
      [shop_id, date, total, deducted || 0, daily_increase, id]
    );
    
    console.log(`更新团队[${teamCode}]店铺粉丝增长记录成功, ID:${id}`);
    
    // 返回更新后的数据
    return NextResponse.json({
      id: parseInt(id),
      shop_id,
      date, // 直接使用客户端传入的日期
      total,
      deducted: deducted || 0,
      daily_increase
    });
  } catch (error) {
    console.error(`更新团队[${teamCode}]店铺粉丝增长记录失败:`, error);
    throw new Error('更新粉丝增长记录失败');
  }
};

/**
 * DELETE 删除店铺粉丝增长记录
 */
const deleteGrowthRecord = async (_req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的记录ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始删除团队[${teamCode}]店铺粉丝增长记录, ID:${id}`);
    
    // 检查记录是否存在
    const [existingRecord] = await pool.query<any[]>(
      'SELECT id FROM shop_follower_growth WHERE id = ?',
      [id]
    );
    
    if (existingRecord.length === 0) {
      return NextResponse.json({ error: '未找到相应记录' }, { status: 404 });
    }
    
    // 删除记录
    await pool.query(
      'DELETE FROM shop_follower_growth WHERE id = ?',
      [id]
    );
    
    console.log(`删除团队[${teamCode}]店铺粉丝增长记录成功, ID:${id}`);
    
    return NextResponse.json({ message: '记录删除成功' });
  } catch (error) {
    console.error(`删除团队[${teamCode}]店铺粉丝增长记录失败:`, error);
    throw new Error('删除粉丝增长记录失败');
  }
};

// 导出API处理函数
export const GET = withTeamDb(getGrowthRecord);
export const PUT = withTeamDb(updateGrowthRecord);
export const DELETE = withTeamDb(deleteGrowthRecord); 