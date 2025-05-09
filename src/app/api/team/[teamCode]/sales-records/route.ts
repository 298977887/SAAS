/**
 * 销售记录API接口
 * 作者: 阿瑞
 * 功能: 提供销售记录的查询和创建接口
 * 版本: 1.0.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';
import { getUserFromAuthHeader } from '@/lib/auth';

/**
 * 销售记录数据接口
 */
interface SalesRecordRow extends RowDataPacket {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  sourceId?: number;
  sourceName?: string;
  sourceWechat?: string;
  guideId?: number;
  paymentType: number;
  dealDate: string;
  receivable: number;
  received: number;
  pending: number;
  platformId?: number;
  platformName?: string;
  dealShopId?: string; 
  dealShopName?: string;
  dealShopWechat?: string;
  orderStatus: string | string[];
  followupDate?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  products?: ProductRow[];
}

/**
 * 产品数据接口
 */
interface ProductRow extends RowDataPacket {
  id: number;
  salesRecordId: number;
  productId: number;
  productName: string;
  productCode?: string;
  productSku?: string;
  image?: string;
  description?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  supplierId?: number;
  supplierName?: string;
  quantity: number;
  price: number;
  createdAt: string;
}

/**
 * GET 获取销售记录列表
 */
const getSalesRecords = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  const customerId = url.searchParams.get('customerId') || '';
  const sourceId = url.searchParams.get('sourceId') || '';
  const platformId = url.searchParams.get('platformId') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]销售记录列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(c.name LIKE ? OR sr.remark LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (customerId) {
      conditions.push('sr.customer_id = ?');
      params.push(customerId);
    }
    
    if (sourceId) {
      conditions.push('sr.source_id = ?');
      params.push(sourceId);
    }
    
    if (platformId) {
      conditions.push('sr.platform_id = ?');
      params.push(platformId);
    }
    
    if (startDate) {
      conditions.push('sr.deal_date >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      conditions.push('sr.deal_date <= ?');
      params.push(endDate);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total 
        FROM sales_records sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        ${whereClause}
      `;
      const [totalRows] = await connection.query<RowDataPacket[]>(countSql, params);
      
      const total = totalRows[0].total as number;
      
      // 查询分页数据
      const querySql = `
        SELECT 
          sr.id, sr.customer_id as customerId, c.name as customerName, c.phone as customerPhone,
          sr.source_id as sourceId, s1.nickname as sourceName, s1.wechat as sourceWechat,
          sr.guide_id as guideId,
          sr.payment_type as paymentType, sr.deal_date as dealDate,
          sr.receivable, sr.received, sr.pending,
          sr.platform_id as platformId, pp.name as platformName,
          sr.deal_shop as dealShopId, s2.nickname as dealShopName, s2.wechat as dealShopWechat,
          sr.order_status as orderStatus,
          sr.followup_date as followupDate, sr.remark,
          sr.created_at as createdAt, sr.updated_at as updatedAt
        FROM sales_records sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN shops s1 ON sr.source_id = s1.id
        LEFT JOIN payment_platforms pp ON sr.platform_id = pp.id
        LEFT JOIN shops s2 ON sr.deal_shop = s2.id
        ${whereClause}
        ORDER BY sr.deal_date DESC, sr.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query<SalesRecordRow[]>(querySql, queryParams);
      
      // 查询每条销售记录关联的产品
      const salesRecords = rows;
      if (salesRecords.length > 0) {
        for (let i = 0; i < salesRecords.length; i++) {
          const record = salesRecords[i];
          
          // 处理order_status字段，从JSON字符串转为数组
          if (record.orderStatus && typeof record.orderStatus === 'string') {
            try {
              record.orderStatus = JSON.parse(record.orderStatus as string);
            } catch (e) {
              record.orderStatus = ['正常']; // 默认值
            }
          }
          
          // 查询关联产品
          const [productRows] = await connection.query<ProductRow[]>(`
            SELECT 
              srp.id, srp.sales_record_id as salesRecordId, 
              srp.product_id as productId, p.name as productName, 
              p.code as productCode, p.sku as productSku,
              p.image, p.description,
              p.brand_id as brandId, b.name as brandName,
              p.category_id as categoryId, c.name as categoryName,
              p.supplier_id as supplierId, s.name as supplierName,
              srp.quantity, srp.price, 
              srp.created_at as createdAt
            FROM sales_record_products srp
            LEFT JOIN products p ON srp.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            WHERE srp.sales_record_id = ?
          `, [record.id]);
          
          record.products = productRows;
        }
      }
      
      console.log(`查询团队[${teamCode}]销售记录列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        salesRecords
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]销售记录列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]销售记录列表失败:`, error);
    throw new Error('获取销售记录列表失败');
  }
};

/**
 * POST 创建销售记录
 */
const createSalesRecord = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取当前登录用户信息
  const user = await getUserFromAuthHeader(req);
  if (!user) {
    return NextResponse.json({ error: '未授权访问' }, { status: 401 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证必填字段
  if (!data.customerId) {
    return NextResponse.json({ error: '客户ID为必填字段' }, { status: 400 });
  }
  
  if (!data.dealDate) {
    return NextResponse.json({ error: '成交日期为必填字段' }, { status: 400 });
  }
  
  if (typeof data.paymentType !== 'number') {
    return NextResponse.json({ error: '收款方式为必填字段' }, { status: 400 });
  }
  
  if (typeof data.receivable !== 'number' || data.receivable < 0) {
    return NextResponse.json({ error: '应收金额必须是大于等于0的数字' }, { status: 400 });
  }
  
  if (typeof data.received !== 'number' || data.received < 0) {
    return NextResponse.json({ error: '实收金额必须是大于等于0的数字' }, { status: 400 });
  }
  
  if (!Array.isArray(data.products) || data.products.length === 0) {
    return NextResponse.json({ error: '至少需要添加一个产品' }, { status: 400 });
  }
  
  // 验证每个产品的信息
  for (const product of data.products) {
    if (!product.productId) {
      return NextResponse.json({ error: '产品ID为必填字段' }, { status: 400 });
    }
    
    if (typeof product.quantity !== 'number' || product.quantity <= 0) {
      return NextResponse.json({ error: '产品数量必须大于0' }, { status: 400 });
    }
    
    if (typeof product.price !== 'number' || product.price < 0) {
      return NextResponse.json({ error: '产品价格必须是大于等于0的数字' }, { status: 400 });
    }
  }
  
  try {
    console.log(`开始创建团队[${teamCode}]销售记录, 客户ID:${data.customerId}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查客户是否存在
      const [existingCustomer] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL',
        [data.customerId]
      );
      
      if (!Array.isArray(existingCustomer) || existingCustomer.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '选择的客户不存在或已被删除' }, { status: 404 });
      }
      
      // 处理订单状态，默认为["正常"]
      const orderStatus = data.orderStatus && Array.isArray(data.orderStatus) && data.orderStatus.length > 0 
        ? JSON.stringify(data.orderStatus) 
        : JSON.stringify(['正常']);
      
      // 插入销售记录
      const insertSql = `
        INSERT INTO sales_records (
          customer_id, source_id, guide_id, payment_type, deal_date,
          receivable, received, pending, platform_id, deal_shop,
          order_status, followup_date, remark, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.customerId,
        data.sourceId || null,
        user.id, // 当前登录用户ID作为导购
        data.paymentType,
        data.dealDate,
        data.receivable,
        data.received,
        data.pending || 0,
        data.platformId || null,
        data.dealShop || null, // dealShop现在是店铺ID
        orderStatus,
        data.followupDate || null,
        data.remark || null
      ]);
      
      const salesRecordId = (result as any).insertId;
      
      // 插入销售记录-产品关联
      if (data.products && data.products.length > 0) {
        const productInsertSql = `
          INSERT INTO sales_record_products (
            sales_record_id, product_id, quantity, price, created_at
          ) VALUES (?, ?, ?, ?, NOW())
        `;
        
        for (const product of data.products) {
          await connection.query(productInsertSql, [
            salesRecordId,
            product.productId,
            product.quantity,
            product.price
          ]);
        }
      }
      
      // 查询新插入的销售记录信息及关联产品
      const [salesRecordRows] = await connection.query<SalesRecordRow[]>(`
        SELECT 
          sr.id, sr.customer_id as customerId, c.name as customerName, c.phone as customerPhone,
          sr.source_id as sourceId, s1.nickname as sourceName, s1.wechat as sourceWechat,
          sr.guide_id as guideId,
          sr.payment_type as paymentType, sr.deal_date as dealDate,
          sr.receivable, sr.received, sr.pending,
          sr.platform_id as platformId, pp.name as platformName,
          sr.deal_shop as dealShopId, s2.nickname as dealShopName, s2.wechat as dealShopWechat,
          sr.order_status as orderStatus,
          sr.followup_date as followupDate, sr.remark,
          sr.created_at as createdAt, sr.updated_at as updatedAt
        FROM sales_records sr
        LEFT JOIN customers c ON sr.customer_id = c.id
        LEFT JOIN shops s1 ON sr.source_id = s1.id
        LEFT JOIN payment_platforms pp ON sr.platform_id = pp.id
        LEFT JOIN shops s2 ON sr.deal_shop = s2.id
        WHERE sr.id = ?
      `, [salesRecordId]);
      
      let salesRecord = null;
      if (salesRecordRows.length > 0) {
        salesRecord = salesRecordRows[0];
        
        // 处理order_status字段，从JSON字符串转为数组
        if (salesRecord.orderStatus && typeof salesRecord.orderStatus === 'string') {
          try {
            salesRecord.orderStatus = JSON.parse(salesRecord.orderStatus as string);
          } catch (e) {
            salesRecord.orderStatus = ['正常']; // 默认值
          }
        }
        
        // 查询关联产品
        const [productRows] = await connection.query<ProductRow[]>(`
          SELECT 
            srp.id, srp.sales_record_id as salesRecordId, 
            srp.product_id as productId, p.name as productName, 
            p.code as productCode, p.sku as productSku,
            p.image, p.description,
            p.brand_id as brandId, b.name as brandName,
            p.category_id as categoryId, c.name as categoryName,
            p.supplier_id as supplierId, s.name as supplierName,
            srp.quantity, srp.price, 
            srp.created_at as createdAt
          FROM sales_record_products srp
          LEFT JOIN products p ON srp.product_id = p.id
          LEFT JOIN brands b ON p.brand_id = b.id
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE srp.sales_record_id = ?
        `, [salesRecordId]);
        
        salesRecord.products = productRows;
      }
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]销售记录成功, ID:${salesRecordId}`);
      
      return NextResponse.json({
        message: '销售记录创建成功',
        salesRecord
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]销售记录创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]销售记录失败:`, error);
    throw new Error('创建销售记录失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getSalesRecords);
export const POST = withTeamDb(createSalesRecord); 