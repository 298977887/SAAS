/**
 * 单个产品API接口
 * 作者: 阿瑞
 * 功能: 提供单个产品的查询、更新和删除接口
 * 版本: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'mysql2/promise';
import { withTeamDb } from '@/lib/db/team/api-handler';

/**
 * GET 获取单个产品
 */
const getProduct = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的产品ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始查询团队[${teamCode}]产品, ID:${id}`);
    
    // 查询产品信息，包括关联的供应商、品牌、品类名称
    const [rows] = await pool.query(
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
      [id]
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: '未找到相应产品' }, { status: 404 });
    }
    
    // 处理产品数据
    const product = rows[0] as any;
    
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
    
    console.log(`查询团队[${teamCode}]产品成功, ID:${id}`);
    
    return NextResponse.json(product);
  } catch (error) {
    console.error(`获取团队[${teamCode}]产品详情失败:`, error);
    throw new Error('获取产品详情失败');
  }
};

/**
 * PUT 更新产品
 */
const updateProduct = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的产品ID' }, { status: 400 });
  }
  
  // 获取请求数据
  const data = await req.json();
  
  // 验证是否有需要更新的字段
  if (Object.keys(data).length === 1 && data.id) {
    return NextResponse.json({ error: '缺少需要更新的字段' }, { status: 400 });
  }
  
  try {
    console.log(`开始更新团队[${teamCode}]产品, ID:${id}`);
    
    // 获取单个连接并开始事务
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查产品是否存在
      const [existingProduct] = await connection.query(
        'SELECT id FROM products WHERE id = ?',
        [id]
      );
      
      if (!Array.isArray(existingProduct) || existingProduct.length === 0) {
        await connection.rollback();
        return NextResponse.json({ error: '未找到相应产品' }, { status: 404 });
      }
      
      // 处理JSON字段
      let aliasesJson = undefined;
      if (data.aliases !== undefined) {
        aliasesJson = data.aliases ? JSON.stringify(data.aliases) : null;
      }
      
      let costJson = undefined;
      if (data.cost !== undefined) {
        costJson = data.cost ? JSON.stringify(data.cost) : null;
      }
      
      // 构建更新SQL
      const updateFields = [];
      const updateParams = [];
      
      // 映射字段名
      const fieldMappings: Record<string, string> = {
        supplierId: 'supplier_id',
        brandId: 'brand_id',
        categoryId: 'category_id',
        logisticsStatus: 'logistics_status',
        logisticsDetails: 'logistics_details',
        trackingNumber: 'tracking_number',
      };
      
      // 特殊处理的字段
      const specialFields = ['aliases', 'cost', 'id'];
      
      // 添加常规字段
      for (const [key, value] of Object.entries(data)) {
        if (key === 'id' || specialFields.includes(key)) continue;
        
        const dbField = fieldMappings[key] || key;
        updateFields.push(`${dbField} = ?`);
        updateParams.push(value === null ? null : value);
      }
      
      // 添加JSON字段
      if (aliasesJson !== undefined) {
        updateFields.push('aliases = ?');
        updateParams.push(aliasesJson);
      }
      
      if (costJson !== undefined) {
        updateFields.push('cost = ?');
        updateParams.push(costJson);
      }
      
      // 添加更新时间
      updateFields.push('updated_at = NOW()');
      
      // 如果没有需要更新的字段，返回错误
      if (updateFields.length === 1) {
        await connection.rollback();
        return NextResponse.json({ error: '缺少需要更新的字段' }, { status: 400 });
      }
      
      // 添加ID作为WHERE条件参数
      updateParams.push(id);
      
      const updateSql = `
        UPDATE products 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      
      await connection.query(updateSql, updateParams);
      
      // 查询更新后的产品信息，包括关联的供应商、品牌、品类名称
      const [updatedProductRows] = await connection.query(
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
        [id]
      );
      
      // 处理产品数据
      let updatedProduct = null;
      if (Array.isArray(updatedProductRows) && updatedProductRows.length > 0) {
        updatedProduct = updatedProductRows[0] as any;
        
        // 处理JSON字段
        if (updatedProduct.aliases && typeof updatedProduct.aliases === 'string') {
          try {
            updatedProduct.aliases = JSON.parse(updatedProduct.aliases);
          } catch (e) {
            updatedProduct.aliases = [];
          }
        }
        
        if (updatedProduct.cost && typeof updatedProduct.cost === 'string') {
          try {
            updatedProduct.cost = JSON.parse(updatedProduct.cost);
          } catch (e) {
            updatedProduct.cost = {};
          }
        }
      }
      
      // 提交事务
      await connection.commit();
      
      console.log(`更新团队[${teamCode}]产品成功, ID:${id}`);
      
      return NextResponse.json({
        message: '产品更新成功',
        product: updatedProduct
      });
    } catch (error) {
      // 发生错误时回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 确保释放连接
      connection.release();
      console.log(`团队[${teamCode}]产品更新连接已释放`);
    }
  } catch (error) {
    console.error(`更新团队[${teamCode}]产品失败:`, error);
    throw new Error('更新产品失败');
  }
};

/**
 * DELETE 删除产品
 */
const deleteProduct = async (req: NextRequest, params: { teamCode: string, id: string }, pool: Pool) => {
  const { teamCode, id } = params;
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: '无效的产品ID' }, { status: 400 });
  }
  
  try {
    console.log(`开始删除团队[${teamCode}]产品, ID:${id}`);
    
    // 检查产品是否存在
    const [existingProduct] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(existingProduct) || existingProduct.length === 0) {
      return NextResponse.json({ error: '未找到相应产品' }, { status: 404 });
    }
    
    // 直接删除产品记录
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    
    console.log(`删除团队[${teamCode}]产品成功, ID:${id}`);
    
    return NextResponse.json({ message: '产品删除成功' });
  } catch (error) {
    console.error(`删除团队[${teamCode}]产品失败:`, error);
    throw new Error('删除产品失败');
  }
};

// 导出处理函数
export const GET = withTeamDb(getProduct);
export const PUT = withTeamDb(updateProduct);
export const DELETE = withTeamDb(deleteProduct); 