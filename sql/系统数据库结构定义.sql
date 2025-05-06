-- ========================================================================================
-- 系统数据库结构定义 - 优化版本
-- 作者: 阿瑞
-- 功能: 定义工作空间、用户和团队相关的数据库表结构
-- 版本: 1.0
-- ========================================================================================
-- 需求是：
-- 1、一个团队只能归属一个工作空间，一个用户也只能归属一个工作空间。
-- 2、在用户登录上后（即使不是管理员），也能获取到哪些用户和我在一个工作空间，这个工作空间中，有哪些团队是我可以操作的。
-- 3、完全支持 邀请注册 和 自主注册 的两种场景：
-- 3.1 自主注册：用户获得专属工作空间（workspaces.creator_id = 用户ID）
-- 3.2 邀请加入：被邀请人通过 system_users.workspace_id 直接绑定到邀请人空间
-- ========================================================================================
-- 模块: 工作空间表
-- 说明: 存储所有工作空间信息，移除了creator_id外键约束以解决循环依赖问题
-- ========================================================================================
CREATE TABLE `workspaces` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '空间ID（主键）',
  `name` varchar(50) NOT NULL COMMENT '空间名称',
  `creator_id` int NOT NULL COMMENT '创建者用户ID（关联system_users.id，但不设外键约束）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=活跃，0=停用）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_id` (`creator_id`) COMMENT '创建者ID索引，提高查询效率'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作空间信息表';

-- ========================================================================================
-- 模块: 系统用户表
-- 说明: 存储所有用户信息，包含对工作空间的外键约束
-- ========================================================================================
CREATE TABLE `system_users` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID（主键）',
  `username` varchar(50) NOT NULL COMMENT '登录用户名（唯一）',
  `password` varchar(100) NOT NULL COMMENT '加密密码',
  `email` varchar(100) NOT NULL COMMENT '电子邮箱（唯一）',
  `phone` varchar(20) NOT NULL COMMENT '手机号码（唯一）',
  `workspace_id` int NOT NULL COMMENT '所属工作空间ID（关联workspaces.id）',
  `role` varchar(20) NOT NULL DEFAULT 'user' COMMENT '系统角色（admin=管理员，user=普通用户）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=启用，0=禁用）',
  `invited_by` int DEFAULT NULL COMMENT '邀请人ID（关联system_users.id，NULL表示自主注册）',
  `invitation_token` varchar(100) DEFAULT NULL COMMENT '邀请验证令牌',
  `last_login_at` datetime DEFAULT NULL COMMENT '最后登录时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_workspace_id` (`workspace_id`),
  KEY `idx_invited_by` (`invited_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- ========================================================================================
-- 模块: 团队信息表
-- 说明: 存储所有团队信息，包含对工作空间和所有者的外键约束
-- ========================================================================================
CREATE TABLE `teams` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '团队ID（主键）',
  `team_code` varchar(30) NOT NULL COMMENT '团队唯一编码',
  `name` varchar(50) NOT NULL COMMENT '团队名称',
  `db_host` varchar(100) NOT NULL COMMENT '数据库主机地址',
  `db_name` varchar(50) NOT NULL COMMENT '数据库名称',
  `db_username` varchar(50) NOT NULL COMMENT '数据库用户名',
  `db_password` varchar(100) NOT NULL COMMENT '数据库密码',
  `workspace_id` int NOT NULL COMMENT '所属工作空间ID（关联workspaces.id）',
  `owner_id` int NOT NULL COMMENT '团队管理员ID（关联system_users.id）',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态（1=正常，0=停用）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_team_code` (`team_code`),
  KEY `idx_workspace_id` (`workspace_id`),
  KEY `idx_owner_id` (`owner_id`),
  CONSTRAINT `fk_team_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `fk_team_owner` FOREIGN KEY (`owner_id`) REFERENCES `system_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队信息表';

-- ========================================================================================
-- 模块: 用户-团队关系表（新增）
-- 说明: 明确定义用户和团队之间的关系及权限
-- ========================================================================================
CREATE TABLE `user_team_relations` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '关系ID（主键）',
  `user_id` int NOT NULL COMMENT '用户ID（关联system_users.id）',
  `team_id` int NOT NULL COMMENT '团队ID（关联teams.id）',
  `role` varchar(20) NOT NULL DEFAULT 'member' COMMENT '角色（owner=拥有者，admin=管理员，member=成员）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_team` (`user_id`,`team_id`) COMMENT '确保用户在一个团队中只有一个角色',
  KEY `idx_team_id` (`team_id`),
  CONSTRAINT `fk_relation_user` FOREIGN KEY (`user_id`) REFERENCES `system_users` (`id`),
  CONSTRAINT `fk_relation_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户团队关系表';

-- ========================================================================================
-- 添加外键约束（只添加不会导致循环依赖的约束）
-- ========================================================================================
-- 注意：不添加workspaces.creator_id对system_users.id的外键约束，避免循环依赖

-- 添加system_users表的外键约束
ALTER TABLE `system_users` 
ADD CONSTRAINT `fk_user_workspace` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
ADD CONSTRAINT `fk_user_inviter` FOREIGN KEY (`invited_by`) REFERENCES `system_users` (`id`);

-- ========================================================================================
-- 操作流程示例（应用程序中实现）
-- ========================================================================================

-- 自主注册流程（创建新工作空间）
-- 步骤1: 先创建工作空间（临时creator_id）
-- START TRANSACTION;
-- INSERT INTO workspaces (name, creator_id) VALUES ('新工作空间', 0); 
-- SET @workspace_id = LAST_INSERT_ID();

-- 步骤2: 创建用户并关联到工作空间
-- INSERT INTO system_users (username, password, email, phone, workspace_id) 
-- VALUES ('newuser', 'encrypted_pwd', 'user@example.com', '13800138000', @workspace_id);
-- SET @user_id = LAST_INSERT_ID();

-- 步骤3: 更新工作空间的creator_id为新用户ID
-- UPDATE workspaces SET creator_id = @user_id WHERE id = @workspace_id;
-- COMMIT;

-- 邀请注册流程（使用现有空间）
-- INSERT INTO system_users (username, password, email, phone, workspace_id, invited_by) 
-- VALUES ('invited_user', 'encrypted_pwd', 'invited@example.com', '13900139000', 邀请人的workspace_id, 邀请人ID);

-- 查询同一工作空间的用户
-- SELECT * FROM system_users WHERE workspace_id = 当前用户的workspace_id;

-- 查询用户可操作的团队
-- SELECT t.* FROM teams t
-- JOIN user_team_relations utr ON t.id = utr.team_id
-- WHERE utr.user_id = 当前用户ID AND t.workspace_id = 当前用户的workspace_id;