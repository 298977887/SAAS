# SaaS 多租户管理系统

## 项目概述

本项目是一个基于Next.js的多租户SaaS管理系统，支持工作空间、用户和团队的管理，采用MySQL作为数据存储。

## 系统架构

### 数据库结构

系统采用以下数据库表结构：

1. **workspaces** - 工作空间表
   - 存储所有工作空间信息
   - 主要字段：id, name, creator_id, status, created_at, updated_at

2. **system_users** - 系统用户表
   - 存储所有用户信息，包含对工作空间的外键约束
   - 主要字段：id, username, password, email, phone, workspace_id, role, status, invited_by, invitation_token, last_login_at, created_at, updated_at

3. **teams** - 团队信息表
   - 存储所有团队信息，包含对工作空间和所有者的外键约束
   - 主要字段：id, team_code, name, db_host, db_name, db_username, db_password, workspace_id, owner_id, status, created_at, updated_at

4. **user_team_relations** - 用户-团队关系表
   - 明确定义用户和团队之间的关系及权限
   - 主要字段：id, user_id, team_id, role, created_at, updated_at

### 数据模型

系统数据模型位于 `src/models` 目录下，按照功能模块组织：

1. **系统模型（system）**：
   - `WorkspaceModel` - 工作空间数据模型
   - `SystemUserModel` - 系统用户数据模型
   - `TeamModel` - 团队数据模型
   - `UserTeamRelationModel` - 用户-团队关系数据模型

2. **类型定义**：
   - 位于 `src/models/system/types` 目录下
   - 包含接口定义和枚举类型

### 数据库连接管理

数据库访问采用单例模式设计，提供了高可靠性和便捷性：

- `src/lib/db/init.ts` - 核心Database类提供数据库连接、初始化和操作方法
- `src/lib/db/connection-manager.ts` - 连接池管理，处理多连接场景
- `src/lib/db/config.ts` - 数据库配置模块
- `src/lib/db/index.ts` - 统一导出

**主要特点**：
- 自动创建数据库和表结构
- 连接池管理和健康检查
- 事务支持
- 智能表检查和创建机制
- 完整的CRUD操作支持

## 开发规范

### 代码行数限制

- 单文件代码严格限制在700行以内（含注释）
- 当修改超过700行的文件时，确保每次修改代码行数 ≤ 300行，分多次修改

### 注释体系

必须包含三级注释体系：
1. **文件头注释**：包含作者(阿瑞)、功能、版本信息
2. **模块级注释**：逻辑分段说明
3. **关键代码行注释**：复杂逻辑解释

### 目录结构

- **app** - Next.js的页面组件
  - **(auth)** - 认证相关页面
    - **login** - 登录页面
    - **register** - 注册页面
  - **api** - API路由
    - **auth** - 认证相关API
    - **users** - 用户管理API
    - **workspaces** - 工作空间管理API
    - **teams** - 团队管理API
    - **debug** - 调试工具API
- **models** - 数据模型
  - **system** - 系统数据模型
    - **types** - 类型定义
- **lib** - 工具库
  - **db** - 数据库相关

## 功能模块

### 数据库初始化

系统提供了自动初始化数据库功能：

- 自动创建数据库（如不存在）
- 自动创建表结构（如不存在）
- 添加表之间的外键约束
- 通过API路由（/api/debug/db-init）可触发初始化

### 用户注册流程

用户注册同时会创建一个新的工作空间，注册流程如下：

1. 创建工作空间（临时创建者ID）
2. 创建用户并关联到工作空间
3. 更新工作空间的creator_id为新用户ID

### 用户认证

- 基于JWT的认证机制
- 支持用户登录、注销和会话管理

### 工作空间管理

- 创建、查询、更新和删除工作空间
- 工作空间内的用户管理

### 团队管理

- 创建、查询、更新和删除团队
- 团队成员关系管理
- 团队数据库连接管理

## 环境配置

### 数据库配置

数据库配置信息位于 `src/lib/db/config.ts`，支持从环境变量读取：

```typescript
export const DbConfig = {
  // 数据库连接基本配置
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  
  // 管理员账号(需要有创建数据库权限)
  adminUser: process.env.DB_ADMIN_USER || 'root',
  adminPassword: process.env.DB_ADMIN_PASSWORD || 'aiwoQwo520..',
  
  // 常规用户账号(用于应用程序连接)
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'aiwoQwo520..',

  // 数据库名称
  database: process.env.DB_DATABASE || 'saas_master',
  
  // 连接池配置
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
  
  // 重试配置
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3'),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
};
```

### Docker数据库

项目使用Docker容器中的MySQL数据库，可以使用以下命令进入数据库：

```bash
docker exec -it my-mysql mysql -uroot -p"aiwoQwo520.."
```

## 后期开发计划

### API路由开发

需要开发以下API路由以支持前端操作：

1. **工作空间API** - `/api/workspaces`
   - GET, POST, PUT, DELETE 操作 ✓

2. **用户API** - `/api/users`
   - 用户CRUD和认证相关操作 ✓

3. **团队API** - `/api/teams`
   - 团队管理和成员关系操作

### 前端页面开发

1. **仪表盘** - 工作空间概览
2. **用户管理** - 用户列表、编辑、权限管理
3. **团队管理** - 团队创建、成员管理
4. **设置页面** - 工作空间和个人设置

### 功能增强

1. **邀请机制** - 邀请新用户加入工作空间
2. **权限控制** - 基于角色的访问控制
3. **数据导入/导出** - 支持数据迁移
4. **审计日志** - 系统操作记录

## 开发注意事项

1. 使用PowerShell作为开发终端，注意避免使用Linux特有命令
2. 遵循项目的文件命名和组织结构
3. 优先使用原生功能或已有依赖，减少引入新的第三方库
4. 确保所有接口和类型定义完整
5. 在修改数据库结构时，确保同时更新相应的数据模型和接口定义

## 开发历程

### 2025-05-06 数据库模块重构

- 重构数据库连接模块，采用单例模式设计
- 实现自动创建数据库和表结构功能
- 增强错误处理和连接管理
- 修复了注册流程中的数据库连接问题
- 更新了所有系统模型，使用新的数据库访问接口

## 参考文档

- Next.js官方文档: https://nextjs.org/docs
- MySQL官方文档: https://dev.mysql.com/doc/
- Tailwind CSS: https://tailwindcss.com/docs