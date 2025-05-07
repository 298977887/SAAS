/**
 * 产品API接口
 * 作者: 阿瑞
 * 功能: 提供产品数据的查询和创建接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取产品列表
 */
const getProducts = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取查询参数
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
  const keyword = url.searchParams.get('keyword') || '';
  const supplierId = url.searchParams.get('supplierId') ? parseInt(url.searchParams.get('supplierId') as string) : null;
  const brandId = url.searchParams.get('brandId') ? parseInt(url.searchParams.get('brandId') as string) : null;
  const categoryId = url.searchParams.get('categoryId') ? parseInt(url.searchParams.get('categoryId') as string) : null;
  const level = url.searchParams.get('level') || null;
  const minPrice = url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice') as string) : null;
  const maxPrice = url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice') as string) : null;
  const hasStock = url.searchParams.get('hasStock') === 'true';
  
  // 计算偏移量
  const offset = (page - 1) * pageSize;
  
  try {
    console.log(`开始查询团队[${teamCode}]产品列表, 页码:${page}, 每页:${pageSize}`);
    
    // 构建查询条件
    const conditions = [];
    const params = [];
    
    if (keyword) {
      conditions.push('(p.name LIKE ? OR p.code LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR JSON_SEARCH(p.aliases, "one", ?) IS NOT NULL)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (supplierId !== null) {
      conditions.push('p.supplier_id = ?');
      params.push(supplierId);
    }
    
    if (brandId !== null) {
      conditions.push('p.brand_id = ?');
      params.push(brandId);
    }
    
    if (categoryId !== null) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    
    if (level) {
      conditions.push('p.level = ?');
      params.push(level);
    }
    
    if (minPrice !== null) {
      conditions.push('p.price >= ?');
      params.push(minPrice);
    }
    
    if (maxPrice !== null) {
      conditions.push('p.price <= ?');
      params.push(maxPrice);
    }
    
    if (hasStock) {
      conditions.push('p.stock > 0');
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 使用单个连接执行多个查询
    const connection = await pool.getConnection();
    
    try {
      // 查询总数
      const countSql = `
        SELECT COUNT(*) as total 
        FROM products p
        ${whereClause}
      `;
      const [totalRows] = await connection.query(countSql, params);
      
      const total = (totalRows as any)[0].total;
      
      // 查询分页数据，包括关联的供应商、品牌、品类名称
      const querySql = `
        SELECT 
          p.id, p.supplier_id as supplierId, p.brand_id as brandId, p.category_id as categoryId, 
          p.name, p.description, p.code, p.image, p.sku, p.aliases, p.level, p.cost, 
          p.price, p.stock, p.logistics_status as logisticsStatus, 
          p.logistics_details as logisticsDetails, p.tracking_number as trackingNumber,
          p.created_at as createdAt, p.updated_at as updatedAt,
          s.name as supplierName, b.name as brandName, c.name as categoryName
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause} 
        ORDER BY p.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      // 添加分页参数到params数组
      const queryParams = [...params, pageSize, offset];
      
      const [rows] = await connection.query(querySql, queryParams);
      
      // 查询所有不同的产品级别，用于前端筛选
      const [levelRows] = await connection.query('SELECT DISTINCT level FROM products WHERE level IS NOT NULL AND level != ""');
      const levels = Array.isArray(levelRows) ? levelRows.map((row: any) => row.level).filter(Boolean) : [];
      
      console.log(`查询团队[${teamCode}]产品列表成功, 总数:${total}`);
      
      return NextResponse.json({
        total,
        products: Array.isArray(rows) ? rows.map((product: any) => {
          // 处理JSON字段
          if (product.aliases && typeof product.aliases === 'string') {
            try {
              product.aliases = JSON.parse(product.aliases);
            } catch (e) {
              product.aliases = [];
            }
          }
          
          if (product.cost && typeof product.cost === 'string') {
            try {
              product.cost = JSON.parse(product.cost);
            } catch (e) {
              product.cost = {};
            }
          }
          
          return product;
        }) : [],
        filters: {
          levels
        }
      });
    } finally {
      // 确保在任何情况下都释放连接
      connection.release();
      console.log(`团队[${teamCode}]产品列表查询连接已释放`);
    }
  } catch (error) {
    console.error(`获取团队[${teamCode}]产品列表失败:`, error);
    throw new Error('获取产品列表失败');
  }
};

/**
 * POST 创建产品
 */
const createProduct = async (req: NextRequest, params: { teamCode: string }, pool: Pool) => {
  const { teamCode } = params;
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证必填字段
  if (!data.name) {
    return NextResponse.json({ error: '产品名称为必填字段' }, { status: 400 });
  }
  
  if (data.price === undefined) {
    return NextResponse.json({ error: '产品价格为必填字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始创建团队[${teamCode}]产品, 名称:${data.name}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 处理JSON字段
      let aliasesJson = null;
      if (data.aliases && Array.isArray(data.aliases)) {
        aliasesJson = JSON.stringify(data.aliases);
      }
      
      let costJson = null;
      if (data.cost) {
        costJson = JSON.stringify(data.cost);
      }
      
      // 插入产品记录
      const insertSql = `
        INSERT INTO products (
          supplier_id, brand_id, category_id, name, description, code, image, sku, 
          aliases, level, cost, price, stock, logistics_status, logistics_details, 
          tracking_number, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const [result] = await connection.query(insertSql, [
        data.supplierId || null,
        data.brandId || null,
        data.categoryId || null,
        data.name,
        data.description || null,
        data.code || null,
        data.image || null,
        data.sku || null,
        aliasesJson,
        data.level || null,
        costJson,
        data.price,
        data.stock || 0,
        data.logisticsStatus || null,
        data.logisticsDetails || null,
        data.trackingNumber || null
      ]);
      
      const insertId = (result as any).insertId;
      
      // 查询新插入的产品信息，包括关联的供应商、品牌、品类名称
      const [newProductRows] = await connection.query(
        `SELECT 
          p.id, p.supplier_id as supplierId, p.brand_id as brandId, p.category_id as categoryId, 
          p.name, p.description, p.code, p.image, p.sku, p.aliases, p.level, p.cost, 
          p.price, p.stock, p.logistics_status as logisticsStatus, 
          p.logistics_details as logisticsDetails, p.tracking_number as trackingNumber,
          p.created_at as createdAt, p.updated_at as updatedAt,
          s.name as supplierName, b.name as brandName, c.name as categoryName
        FROM products p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?`,
        [insertId]
      );
      
      // 处理查询结果
      let newProduct = null;
      if (Array.isArray(newProductRows) && newProductRows.length > 0) {
        newProduct = newProductRows[0] as any;
        
        // 处理JSON字段
        if (newProduct && typeof newProduct === 'object' && 'aliases' in newProduct && typeof newProduct.aliases === 'string') {
          try {
            newProduct.aliases = JSON.parse(newProduct.aliases);
          } catch (e) {
            newProduct.aliases = [];
          }
        }
        
        if (newProduct && typeof newProduct === 'object' && 'cost' in newProduct && typeof newProduct.cost === 'string') {
          try {
            newProduct.cost = JSON.parse(newProduct.cost);
          } catch (e) {
            newProduct.cost = {};
          }
        }
      }
      
      // 提交事务
      await connection.commit();
      
      console.log(`创建团队[${teamCode}]产品成功, ID:${insertId}`);
      
      return NextResponse.json({
        message: '产品创建成功',
        product: newProduct
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]产品创建连接已释放`);
    }
  } catch (error) {
    console.error(`创建团队[${teamCode}]产品失败:`, error);
    throw new Error('创建产品失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getProducts);
export const POST = withTeamDb(createProduct); 