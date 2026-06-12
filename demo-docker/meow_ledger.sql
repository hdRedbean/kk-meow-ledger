-- ============================================================
-- 喵喵记账 MySQL 建表脚本
-- 字符集: utf8mb4 (支持 emoji 图标)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `meow_ledger`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `meow_ledger`;

-- -----------------------------------------------------------
-- 1. 分类表 category
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id`         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(20)   NOT NULL              COMMENT '分类名称',
  `icon`       VARCHAR(10)   NOT NULL              COMMENT '分类图标(emoji)',
  `type`       ENUM('income','expense') NOT NULL    COMMENT '类型: income=收入, expense=支出',
  `is_preset`  TINYINT(1)    NOT NULL DEFAULT 0     COMMENT '是否预置分类: 0=否, 1=是',
  `is_hidden`  TINYINT(1)    NOT NULL DEFAULT 0     COMMENT '是否隐藏: 0=否, 1=是',
  `sort_order` INT           NOT NULL DEFAULT 0     COMMENT '排序序号, 越小越靠前',
  PRIMARY KEY (`id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收支分类表';

-- 预置支出分类
INSERT INTO `category` (`name`,`icon`,`type`,`is_preset`,`is_hidden`,`sort_order`) VALUES
('餐饮','🍜','expense',1,0,0),
('交通','🚗','expense',1,0,1),
('购物','🛍️','expense',1,0,2),
('居住','🏠','expense',1,0,3),
('娱乐','🎮','expense',1,0,4),
('医疗','💊','expense',1,0,5),
('教育','📚','expense',1,0,6),
('通讯','📱','expense',1,0,7),
('人情','🎁','expense',1,0,8),
('其他','🐱','expense',1,0,9);

-- 预置收入分类
INSERT INTO `category` (`name`,`icon`,`type`,`is_preset`,`is_hidden`,`sort_order`) VALUES
('工资','💰','income',1,0,10),
('奖金','🏆','income',1,0,11),
('理财','📈','income',1,0,12),
('兼职','💼','income',1,0,13),
('红包','🧧','income',1,0,14),
('其他','😺','income',1,0,15);


-- -----------------------------------------------------------
-- 2. 账户表 account
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `account`;
CREATE TABLE `account` (
  `id`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`      VARCHAR(20)  NOT NULL              COMMENT '账户名称',
  `icon`      VARCHAR(10)  NOT NULL              COMMENT '账户图标(emoji)',
  `is_preset` TINYINT(1)   NOT NULL DEFAULT 0    COMMENT '是否预置账户: 0=否, 1=是',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账户表';

-- 预置账户
INSERT INTO `account` (`name`,`icon`,`is_preset`) VALUES
('现金','💵',1),
('微信','💚',1),
('支付宝','🔵',1),
('银行卡','💳',1);


-- -----------------------------------------------------------
-- 3. 账单表 bill
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `bill`;
CREATE TABLE `bill` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type`        ENUM('income','expense') NOT NULL  COMMENT '类型: income=收入, expense=支出',
  `amount`      DECIMAL(12,2)   NOT NULL            COMMENT '金额',
  `category_id` INT UNSIGNED    NOT NULL            COMMENT '分类ID',
  `account_id`  INT UNSIGNED    NOT NULL            COMMENT '账户ID',
  `date`        DATE            NOT NULL            COMMENT '账单日期',
  `note`        VARCHAR(100)    NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_type` (`type`),
  INDEX `idx_category` (`category_id`),
  INDEX `idx_account` (`account_id`),
  INDEX `idx_created` (`created_at`),
  CONSTRAINT `fk_bill_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_bill_account`  FOREIGN KEY (`account_id`)  REFERENCES `account`  (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单表';


-- -----------------------------------------------------------
-- 4. 预算表 budget
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `budget`;
CREATE TABLE `budget` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `month`       CHAR(7)         NOT NULL              COMMENT '预算月份, 格式 YYYY-MM',
  `category_id` INT UNSIGNED    NULL DEFAULT NULL     COMMENT '分类ID, NULL表示总预算',
  `amount`      DECIMAL(12,2)   NOT NULL              COMMENT '预算金额',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_month_category` (`month`, `category_id`),
  CONSTRAINT `fk_budget_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表';


-- -----------------------------------------------------------
-- 5. 对话表 chat_conversation
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `chat_conversation`;
CREATE TABLE `chat_conversation` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(100)    NOT NULL DEFAULT '新对话'  COMMENT '对话标题',
  `created_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话列表';


-- -----------------------------------------------------------
-- 6. 聊天消息表 chat_message
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `chat_message`;
CREATE TABLE `chat_message` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` INT UNSIGNED    NOT NULL              COMMENT '对话ID',
  `role`            ENUM('user','assistant','system','tool') NOT NULL COMMENT '消息角色',
  `content`         TEXT            NOT NULL              COMMENT '消息内容',
  `created_at`      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_conversation_id` (`conversation_id`),
  CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversation` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天消息';
