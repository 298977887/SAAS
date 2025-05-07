/**
 * 团队数据库初始化模块
 * 作者: 阿瑞
 * 功能: 提供团队数据库的初始化和连接管理
 * 版本: 1.0.0
 */

import { Pool, PoolConnection } from 'mysql2/promise';
import { TeamConnectionManager } from './team-connection-manager';

/**
 * 团队配置接口
 */
export interface TeamDatabaseConfig {
  db_host: string;
  db_name: string;
  db_username: string;
  db_password: string;
  team_code: string;
}

/**
 * 团队数据库管理类
 * 提供团队专用数据库的初始化和管理功能
 */
export class TeamDatabase {
  private pool: Pool;
  private initialized: boolean = false;
  private tablesToCheck: Set<string> = new Set();
  private teamConfig: TeamDatabaseConfig;
  
  /**
   * 表创建SQL定义
   * 团队数据库中的所有表结构
   */
  private static readonly TABLE_DEFINITIONS: Record<string, string> = {
    // 客户表
    customers: `
      CREATE TABLE IF NOT EXISTS customers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '客户ID',
        name VARCHAR(50) NOT NULL COMMENT '客户姓名',
        phone VARCHAR(20) UNIQUE NOT NULL COMMENT '客户电话，唯一标识',
        address JSON COMMENT '地址，包含省份、城市、区县和详细地址',
        gender ENUM('男', '女') COMMENT '性别',
        wechat VARCHAR(64) COMMENT '客户微信账号',
        birthday DATE COMMENT '客户生日日期',
        follow_date DATE COMMENT '客户加粉日期',
        balance DECIMAL(10, 2) DEFAULT 0.00 COMMENT '客户账户余额，冗余字段用于快速查询',
        deleted_at DATETIME DEFAULT NULL COMMENT '软删除时间戳，为空表示未删除',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_phone (phone),
        INDEX idx_wechat (wechat),
        INDEX idx_deleted_at (deleted_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户信息表'
    `,
    
    // 品牌表
    brands: `
      CREATE TABLE IF NOT EXISTS brands (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '品牌ID',
        \`order\` INT DEFAULT 0 COMMENT '品牌显示顺序',
        name VARCHAR(50) NOT NULL COMMENT '品牌名称',
        description VARCHAR(255) COMMENT '品牌详细描述，可不填',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_order (\`order\`),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品牌信息表'
    `,
    
    // 品类表
    categories: `
      CREATE TABLE IF NOT EXISTS categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '品类ID',
        name VARCHAR(50) NOT NULL COMMENT '品类名称',
        description VARCHAR(255) COMMENT '品类详细描述',
        icon VARCHAR(255) COMMENT '品类图标路径',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='品类信息表'
    `,
    
    // 供应商表
    suppliers: `
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '供应商ID',
        \`order\` INT DEFAULT 0 COMMENT '供应商显示顺序',
        name VARCHAR(100) NOT NULL COMMENT '供应商名称',
        contact JSON COMMENT '联系方式，包含电话、联系人和地址',
        status TINYINT DEFAULT 1 COMMENT '供应商状态，0停用 1启用 2异常 3备用，默认为1',
        level VARCHAR(30) COMMENT '供应商等级分类，可不填',
        type VARCHAR(30) COMMENT '供应商类型分类，可不填',
        remark TEXT COMMENT '供应商相关备注信息，可不填',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_name (name),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商信息表'
    `,
    
    // 供应商-品类关联表
    supplier_categories: `
      CREATE TABLE IF NOT EXISTS supplier_categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        supplier_id INT UNSIGNED NOT NULL COMMENT '供应商ID',
        category_id INT UNSIGNED NOT NULL COMMENT '品类ID',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        UNIQUE KEY uk_supplier_category (supplier_id, category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='供应商与品类关联表'
    `,
    
    // 产品表
    products: `
      CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '产品ID',
        supplier_id INT UNSIGNED COMMENT '关联供应商表的外键',
        brand_id INT UNSIGNED COMMENT '关联品牌表的外键',
        category_id INT UNSIGNED COMMENT '关联品类表的外键',
        name VARCHAR(100) NOT NULL COMMENT '产品名称',
        description TEXT COMMENT '产品详细描述',
        code VARCHAR(50) COMMENT '产品唯一编码，可不填',
        image VARCHAR(255) COMMENT '产品图片路径',
        sku VARCHAR(50) COMMENT '产品货号，可不填',
        aliases JSON COMMENT '产品别名数组，可不填',
        level VARCHAR(30) COMMENT '产品级别/等级，可不填',
        cost JSON COMMENT 'JSON对象，包含成本价、包装费和运费',
        price DECIMAL(10, 2) NOT NULL COMMENT '产品售价',
        stock INT DEFAULT 0 COMMENT '当前库存数量',
        logistics_status VARCHAR(50) COMMENT '最新物流状态描述',
        logistics_details TEXT COMMENT '物流详细信息',
        tracking_number VARCHAR(50) COMMENT '物流跟踪单号',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_name (name),
        INDEX idx_code (code),
        INDEX idx_supplier_id (supplier_id),
        INDEX idx_brand_id (brand_id),
        INDEX idx_category_id (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品信息表'
    `,
    
    // 店铺表
    shops: `
      CREATE TABLE IF NOT EXISTS shops (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '店铺ID',
        unionid VARCHAR(64) COMMENT '微信unionid，可为空但有值时必须唯一',
        openid VARCHAR(64) COMMENT '微信openid',
        account_no VARCHAR(50) COMMENT '店铺账号编号',
        wechat VARCHAR(64) COMMENT '店铺微信号',
        avatar VARCHAR(255) COMMENT '店铺头像URL',
        nickname VARCHAR(50) COMMENT '店铺微信昵称',
        phone VARCHAR(20) COMMENT '店铺所在设备编号',
        status TINYINT DEFAULT 1 COMMENT '账号状态，0停用 1正常 2封禁 3待解封 4备用 5其他，默认为1',
        remark TEXT COMMENT '店铺相关备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_unionid (unionid),
        INDEX idx_openid (openid),
        INDEX idx_wechat (wechat),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺信息表'
    `,
    
    // 店铺-账号类型关联表
    shop_account_types: `
      CREATE TABLE IF NOT EXISTS shop_account_types (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        shop_id INT UNSIGNED NOT NULL COMMENT '店铺ID',
        category_id INT UNSIGNED NOT NULL COMMENT '品类ID（作为账号类型）',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        UNIQUE KEY uk_shop_category (shop_id, category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺与账号类型关联表'
    `,
    
    // 支付平台表
    payment_platforms: `
      CREATE TABLE IF NOT EXISTS payment_platforms (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '平台ID',
        \`order\` INT NOT NULL COMMENT '平台显示顺序，必填',
        name VARCHAR(50) NOT NULL COMMENT '平台名称，必填',
        description VARCHAR(255) COMMENT '平台详细描述',
        status TINYINT DEFAULT 1 COMMENT '平台状态，0停用 1正常 2备用 3其他，默认为1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_order (\`order\`),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付平台信息表'
    `,
    
    // 销售记录表
    sales_records: `
      CREATE TABLE IF NOT EXISTS sales_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '销售记录ID',
        customer_id INT UNSIGNED COMMENT '关联客户表的外键',
        source_id INT UNSIGNED COMMENT '关联店铺表的外键',
        guide_id INT UNSIGNED COMMENT '当前登录用户的id',
        payment_type TINYINT DEFAULT 0 COMMENT '收款方式类型，0全款 1定金 2未付 3赠送 4其他',
        deal_date DATE COMMENT '订单成交日期',
        receivable DECIMAL(10, 2) DEFAULT 0.00 COMMENT '订单应收金额',
        received DECIMAL(10, 2) DEFAULT 0.00 COMMENT '实际收款金额',
        pending DECIMAL(10, 2) DEFAULT 0.00 COMMENT '待收款金额',
        platform_id INT UNSIGNED COMMENT '关联支付平台表的外键',
        deal_shop VARCHAR(50) COMMENT '成交使用的店铺',
        order_status JSON DEFAULT ('["正常"]') COMMENT '订单状态数组，默认为["正常"]',
        followup_date DATE COMMENT '客户回访日期',
        remark TEXT COMMENT '销售记录备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_customer_id (customer_id),
        INDEX idx_source_id (source_id),
        INDEX idx_guide_id (guide_id),
        INDEX idx_deal_date (deal_date),
        INDEX idx_platform_id (platform_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售记录信息表'
    `,
    
    // 销售记录-产品关联表
    sales_record_products: `
      CREATE TABLE IF NOT EXISTS sales_record_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        sales_record_id INT UNSIGNED NOT NULL COMMENT '销售记录ID',
        product_id INT UNSIGNED NOT NULL COMMENT '产品ID',
        quantity INT DEFAULT 1 COMMENT '产品数量',
        price DECIMAL(10, 2) COMMENT '销售单价',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='销售记录与产品关联表'
    `,
    
    // 售后记录表
    after_sales_records: `
      CREATE TABLE IF NOT EXISTS after_sales_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '售后记录ID',
        sales_record_id INT UNSIGNED NOT NULL COMMENT '关联销售记录表的外键',
        type ENUM('退货', '换货', '补发', '补差') NOT NULL COMMENT '售后类型，必填',
        previous_after_sale_id INT UNSIGNED COMMENT '关联前一个售后记录的外键，用于链式售后',
        date DATE COMMENT '售后处理日期',
        reason TEXT COMMENT '售后处理原因',
        product_price DECIMAL(10, 2) COMMENT '售后产品价格',
        progress ENUM('待处理', '处理中', '已处理') DEFAULT '待处理' COMMENT '售后处理进度，默认为待处理',
        transaction_type ENUM('收入', '支出') COMMENT '枚举值收入/支出',
        platform_id INT UNSIGNED COMMENT '关联支付平台表的外键',
        amount DECIMAL(10, 2) COMMENT '收支金额，包含退款金额',
        pending DECIMAL(10, 2) DEFAULT 0.00 COMMENT '待收金额',
        remark TEXT COMMENT '售后处理备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_sales_record_id (sales_record_id),
        INDEX idx_type (type),
        INDEX idx_date (date),
        INDEX idx_progress (progress),
        INDEX idx_platform_id (platform_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后记录信息表'
    `,
    
    // 售后记录-原产品关联表
    after_sales_original_products: `
      CREATE TABLE IF NOT EXISTS after_sales_original_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        after_sales_id INT UNSIGNED NOT NULL COMMENT '售后记录ID',
        product_id INT UNSIGNED NOT NULL COMMENT '原产品ID',
        quantity INT DEFAULT 1 COMMENT '产品数量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后记录与原产品关联表'
    `,
    
    // 售后记录-替换产品关联表
    after_sales_replacement_products: `
      CREATE TABLE IF NOT EXISTS after_sales_replacement_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        after_sales_id INT UNSIGNED NOT NULL COMMENT '售后记录ID',
        product_id INT UNSIGNED NOT NULL COMMENT '替换产品ID',
        quantity INT DEFAULT 1 COMMENT '产品数量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后记录与替换产品关联表'
    `,
    
    // 物流记录表
    logistics_records: `
      CREATE TABLE IF NOT EXISTS logistics_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '物流记录ID',
        tracking_number VARCHAR(50) COMMENT '物流跟踪单号',
        is_queryable BOOLEAN DEFAULT TRUE COMMENT '是否可查询，布尔值，默认为true',
        customer_tail_number VARCHAR(20) COMMENT '客户手机尾号',
        company VARCHAR(50) COMMENT '物流公司名称',
        details TEXT COMMENT '物流详细信息',
        status VARCHAR(50) COMMENT '物流当前状态',
        record_id INT UNSIGNED NOT NULL COMMENT '关联的记录ID，必填',
        record_type ENUM('SalesRecord', 'AfterSalesRecord') NOT NULL COMMENT '关联记录类型，必填',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_tracking_number (tracking_number),
        INDEX idx_record_id_type (record_id, record_type),
        INDEX idx_company (company)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流记录信息表'
    `,
    
    // 物流记录-产品关联表
    logistics_products: `
      CREATE TABLE IF NOT EXISTS logistics_products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
        logistics_id INT UNSIGNED NOT NULL COMMENT '物流记录ID',
        product_id INT UNSIGNED NOT NULL COMMENT '产品ID',
        quantity INT DEFAULT 1 COMMENT '产品数量',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流记录与产品关联表'
    `,
    
    // 店铺粉丝增长表
    shop_follower_growth: `
      CREATE TABLE IF NOT EXISTS shop_follower_growth (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '增长记录ID',
        shop_id INT UNSIGNED NOT NULL COMMENT '关联店铺表的外键',
        date DATE NOT NULL COMMENT '记录日期，必填',
        total INT NOT NULL COMMENT '粉丝总人数，必填',
        deducted INT NOT NULL COMMENT '扣除的人数，必填',
        daily_increase INT NOT NULL COMMENT '日增长人数，必填，可在前端基于总人数计算',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_shop_id (shop_id),
        INDEX idx_date (date),
        UNIQUE KEY uk_shop_date (shop_id, date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺粉丝增长记录表'
    `
  };

  /**
   * 外键定义
   * 定义表之间的关系
   */
  private static readonly FOREIGN_KEY_DEFINITIONS: string[] = [
    // 供应商与品类关联外键
    `ALTER TABLE supplier_categories 
     ADD CONSTRAINT fk_supplier_cat_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_supplier_cat_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE`,
    
    // 产品表的外键
    `ALTER TABLE products 
     ADD CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_product_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL`,
     
    // 店铺-账号类型关联外键 
    `ALTER TABLE shop_account_types
     ADD CONSTRAINT fk_shop_account_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_shop_account_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE`,
     
    // 销售记录表的外键
    `ALTER TABLE sales_records
     ADD CONSTRAINT fk_sales_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_sales_source FOREIGN KEY (source_id) REFERENCES shops(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_sales_platform FOREIGN KEY (platform_id) REFERENCES payment_platforms(id) ON DELETE SET NULL`,
     
    // 销售记录-产品关联表的外键
    `ALTER TABLE sales_record_products
     ADD CONSTRAINT fk_sales_product_sales FOREIGN KEY (sales_record_id) REFERENCES sales_records(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_sales_product_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`,
     
    // 售后记录表的外键
    `ALTER TABLE after_sales_records
     ADD CONSTRAINT fk_aftersales_sales FOREIGN KEY (sales_record_id) REFERENCES sales_records(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_aftersales_previous FOREIGN KEY (previous_after_sale_id) REFERENCES after_sales_records(id) ON DELETE SET NULL,
     ADD CONSTRAINT fk_aftersales_platform FOREIGN KEY (platform_id) REFERENCES payment_platforms(id) ON DELETE SET NULL`,
     
    // 售后记录-原产品关联表的外键
    `ALTER TABLE after_sales_original_products
     ADD CONSTRAINT fk_original_aftersales FOREIGN KEY (after_sales_id) REFERENCES after_sales_records(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_original_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`,
     
    // 售后记录-替换产品关联表的外键
    `ALTER TABLE after_sales_replacement_products
     ADD CONSTRAINT fk_replacement_aftersales FOREIGN KEY (after_sales_id) REFERENCES after_sales_records(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_replacement_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`,
     
    // 物流记录-产品关联表的外键
    `ALTER TABLE logistics_products
     ADD CONSTRAINT fk_logistics_product_logistics FOREIGN KEY (logistics_id) REFERENCES logistics_records(id) ON DELETE CASCADE,
     ADD CONSTRAINT fk_logistics_product_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`,
     
    // 店铺粉丝增长表的外键
    `ALTER TABLE shop_follower_growth
     ADD CONSTRAINT fk_follower_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE`
  ];

  /**
   * 构造函数
   * @param teamConfig 团队数据库配置
   */
  constructor(teamConfig: TeamDatabaseConfig) {
    this.teamConfig = teamConfig;
    
    console.log(`初始化团队数据库连接，配置信息:`, {
      host: teamConfig.db_host,
      database: teamConfig.db_name,
      user: teamConfig.db_username,
      // 不输出密码
    });
    
    // 创建数据库连接池
    this.pool = TeamConnectionManager.createTeamPool(teamConfig);
    
    // 初始化需要检查的表名
    Object.keys(TeamDatabase.TABLE_DEFINITIONS).forEach(table => {
      this.tablesToCheck.add(table);
    });
  }

  /**
   * 初始化数据库
   * 检查并创建所有必要的表和外键
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`团队数据库 ${this.teamConfig.db_name} 已初始化，跳过`);
      return;
    }
    
    console.log(`开始初始化团队数据库 ${this.teamConfig.db_name} 的表结构`);
    
    try {
      // 创建所有表
      for (const [tableName, createSQL] of Object.entries(TeamDatabase.TABLE_DEFINITIONS)) {
        await this.ensureTable(tableName, createSQL);
      }
      
      // 添加外键约束
      await this.addForeignKeys();
      
      this.initialized = true;
      console.log(`团队数据库 ${this.teamConfig.db_name} 的所有表已创建完成`);
    } catch (error) {
      console.error(`团队数据库 ${this.teamConfig.db_name} 初始化失败:`, error);
      throw error;
    }
  }

  /**
   * 确保表存在，不存在则创建
   * @param tableName 表名
   * @param createSQL 建表SQL语句
   */
  private async ensureTable(tableName: string, createSQL: string): Promise<void> {
    try {
      // 检查表是否存在
      const [tables] = await this.pool.query<any[]>(
        `SHOW TABLES LIKE '${tableName}'`
      );
      
      if (tables.length === 0) {
        console.log(`创建表 ${tableName}`);
        await this.pool.query(createSQL);
      } else {
        console.log(`表 ${tableName} 已存在`);
      }
    } catch (error) {
      console.error(`创建表 ${tableName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 添加外键约束
   */
  private async addForeignKeys(): Promise<void> {
    try {
      for (const foreignKeySQL of TeamDatabase.FOREIGN_KEY_DEFINITIONS) {
        try {
          await this.pool.query(foreignKeySQL);
        } catch (error: any) {
          // 如果外键已存在，则忽略错误
          if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
            console.warn(`外键已存在，忽略: ${foreignKeySQL}`);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('添加外键约束失败:', error);
      throw error;
    }
  }

  /**
   * 执行SQL查询
   * @param sql SQL语句
   * @param params 查询参数
   * @returns 查询结果
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const [results] = await this.pool.query<any>(sql, params);
      return results as T[];
    } catch (error) {
      console.error(`查询执行失败: ${sql}`, error);
      throw error;
    }
  }

  /**
   * 在事务中执行回调函数
   * @param callback 事务回调函数
   * @returns 回调函数返回值
   */
  public async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 关闭数据库连接池
   */
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log(`团队数据库 ${this.teamConfig.db_name} 连接已关闭`);
    } catch (error) {
      console.error(`关闭团队数据库 ${this.teamConfig.db_name} 连接失败:`, error);
      throw error;
    }
  }
}
