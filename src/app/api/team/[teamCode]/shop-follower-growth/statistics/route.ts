/**
 * 店铺粉丝增长统计API接口
 * 作者: 阿瑞
 * 功能: 提供店铺粉丝增长的统计分析数据
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取店铺粉丝增长统计数据
 */
const getGrowthStatistics = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  const { searchParams } = new URL(req.url);
  
  // 获取查询参数
  const shopIds = searchParams.getAll('shopIds');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
  if (!shopIds || shopIds.length === 0) {
    return NextResponse.json({ error: '请提供至少一个店铺ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]店铺粉丝增长统计数据`);
    
    // 构建查询条件
    const conditions = ['1=1']; // 始终为真的条件，方便后续拼接
    const queryParams: any[] = [];
    
    // 添加店铺ID过滤
    if (shopIds.length > 0) {
      const shopIdsInt = shopIds.map(id => parseInt(id));
      conditions.push(`g.shop_id IN (${shopIdsInt.map(() => '?').join(',')})`);
      queryParams.push(...shopIdsInt);
    }
    
    // 添加时间范围过滤
    if (startDate) {
      conditions.push('g.date >= ?');
      queryParams.push(startDate);
    }
    
    if (endDate) {
      conditions.push('g.date <= ?');
      queryParams.push(endDate);
    }
    
    // 拼接条件
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 查询数据
    const [rows] = await pool.query<any[]>(
      `SELECT 
         g.shop_id, g.date, g.total, g.deducted, g.daily_increase,
         s.wechat, s.nickname
       FROM shop_follower_growth g
       LEFT JOIN shops s ON g.shop_id = s.id
       ${whereClause}
       ORDER BY g.shop_id, g.date`,
      queryParams
    );
    
    // 按店铺分组处理数据
    const shopGroups: Record<number, any> = {};
    
    rows.forEach(row => {
      const shopId = row.shop_id;
      
      if (!shopGroups[shopId]) {
        shopGroups[shopId] = {
          shop_id: shopId,
          shop_name: row.nickname || row.wechat || `店铺ID: ${shopId}`,
          dates: [],
          total_counts: [],
          daily_increases: []
        };
      }
      
      shopGroups[shopId].dates.push(row.date.toISOString().split('T')[0]);
      shopGroups[shopId].total_counts.push(row.total);
      shopGroups[shopId].daily_increases.push(row.daily_increase);
    });
    
    // 转换为数组
    const statistics = Object.values(shopGroups);
    
    console.log(`查询团队[${teamCode}]店铺粉丝增长统计数据成功，共 ${statistics.length} 个店铺的数据`);
    
    return NextResponse.json({
      statistics
    });
  } catch (error) {
    console.error(`获取团队[${teamCode}]店铺粉丝增长统计数据失败:`, error);
    throw new Error('获取店铺粉丝增长统计数据失败');
  }
};

// 导出API处理函数
export const GET = withTeamDb(getGrowthStatistics); 